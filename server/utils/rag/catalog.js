// Catálogo em memória: as 295 oportunidades aprovadas, o índice BM25F e a
// matriz de embeddings, tudo carregado uma vez e reaproveitado.
//
// Por que em memória e não uma query por busca: o catálogo tem ~295 linhas.
// A matriz de embeddings inteira ocupa cerca de 1,2 MB (295 × 1024 floats).
// Manter isso no processo transforma a busca vetorial numa conta local de
// microssegundos — e é isso que torna a busca MULTI-ASPECTO viável, porque
// ela precisa comparar 5 a 7 consultas contra o catálogo por requisição. Com
// uma ida ao Postgres por consulta, o mesmo desenho custaria 7 RPCs.
//
// A revalidação segue o padrão já usado em `server/utils/opportunitiesCache.js`
// (stale-while-revalidate, 12h): serve o que está em memória na hora e
// atualiza por trás, para que uma oportunidade nova não espere 12h nem
// nenhuma requisição pague o custo de recarregar.
import { devSupabase } from "./ragClient.js";
import { buildIndex } from "./bm25.js";
import { buildFields, buildPassage } from "./fields.js";
import { embed } from "./embedText.js";

const TTL_MS = 12 * 60 * 60 * 1000;

// Só as colunas que alguma etapa do retrieval realmente lê. `resources` e
// `metadata` saíram depois de medir: com elas a query levava 1313ms e
// transferia 658KB; sem elas, 241ms e 458KB — e nenhuma das duas é usada aqui
// (`resources` só aparece na página da oportunidade, e `metadata` duplica
// colunas que já estão nesta lista).
const COLUNAS = [
  "id", "title", "description", "eligibility", "process", "applicants", "additionals",
  "type", "areas", "keywords", "level", "audience", "cost", "language", "location",
  "format", "inscricoes", "deadline", "link",
].join(", ");

let estado = null;      // { corpus, index, vectors, byId, loadedAt }
let carregando = null;  // promise em voo, para não recarregar em paralelo

async function load() {
  // As duas queries em paralelo: não dependem uma da outra, e serializá-las
  // somava as latências sem motivo.
  const [resOpp, resChunks] = await Promise.all([
    devSupabase.from("opportunities").select(COLUNAS).eq("status", "Aprovada"),
    devSupabase.from("opportunity_chunks").select("opportunity_id, embedding").eq("field_name", "core"),
  ]);
  if (resOpp.error) throw new Error(`Erro ao carregar catálogo: ${resOpp.error.message}`);
  if (resChunks.error) throw new Error(`Erro ao carregar embeddings: ${resChunks.error.message}`);

  const corpus = resOpp.data;
  const index = buildIndex(corpus, buildFields);
  const byId = new Map(corpus.map((o, i) => [o.id, i]));

  // Os vectors vêm de `opportunity_chunks` (chunk "core", gravado por
  // `npm run embed`), NÃO calculados aqui.
  //
  // A primeira versão deste arquivo embeddava as 295 passagens na carga. Em
  // desenvolvimento parecia ótimo — 11s uma vez a cada 12h. Em produção seria
  // um problema sério: na Vercel cada função é efêmera, então o cache em
  // memória não sobrevive entre requisições, e uma requisição que deveria
  // levar menos de 1s pagaria 10 chamadas à NIM e ~11s. Ler do banco é uma
  // query e alguns milissegundos.
  //
  // A outra alternativa — busca vetorial pela RPC `match_opportunity_chunks`
  // (pgvector indexado, devolve só ids) — foi medida e REJEITADA para o
  // caminho padrão: custa ~1067ms POR CONSULTA, contra ~1685ms uma vez na
  // carga e depois zero. E ela não filtra `field_name`, então mistura os
  // chunks de `process`/`additionals` no ranking: só 21 dos 30 primeiros
  // coincidem com o que foi medido no golden set. Trocar exigiria remedir
  // tudo, para ficar mais lento.
  //
  // Consequência operacional, e é a razão pela qual isto está escrito aqui:
  // **mudar `buildPassage()` em `campos.js` exige rodar `npm run embed`.** O
  // texto que gera o vetor e o texto que gera o índice BM25 saem da mesma
  // função de propósito (antes eram dois e divergiram), mas o vetor fica
  // materializado no banco. Sem re-embeddar, o índice vetorial descreve uma
  // versão antiga do catálogo, silenciosamente.
  const chunks = resChunks.data;

  const vectors = new Array(corpus.length).fill(null);
  for (const c of chunks) {
    const i = byId.get(c.opportunity_id);
    if (i === undefined) continue;
    vectors[i] = typeof c.embedding === "string" ? JSON.parse(c.embedding) : c.embedding;
  }

  // Vetor com dimensão diferente da configurada = o modelo de embedding mudou
  // e ninguém rodou `npm run embed`. Isto NÃO degrada com elegância: `cosine()`
  // percorre o vetor da consulta e lê `undefined` além do fim do vetor guardado,
  // devolvendo NaN — ranking aleatório, sem erro nenhum. Aconteceu de verdade
  // quando `llama-nemotron-embed-1b-v2` morreu (410) e o substituto de 2048
  // dimensões entrou no lugar de um índice de 1024.
  const dimsEsperadas = Number(process.env.EMBEDDING_DIMENSIONS) || null;
  const primeiro = vectors.find(Array.isArray);
  if (dimsEsperadas && primeiro && primeiro.length !== dimsEsperadas) {
    throw new Error(
      `[catalogo] vetores gravados têm ${primeiro.length} dimensões, mas ` +
        `EMBEDDING_DIMENSIONS=${dimsEsperadas}. O modelo de embedding mudou e o ` +
        `índice não foi refeito: rode \`npm run embed\`.`
    );
  }

  // Oportunidade sem chunk gravado: entrou no catálogo depois do último
  // `npm run embed`. Embedda só essas, na hora, para não ficarem invisíveis
  // à busca vetorial.
  const withoutVector = corpus.map((o, i) => i).filter((i) => !vectors[i]);

  // Mas ANTES: faltar quase tudo não é catálogo desatualizado, é problema de
  // credencial. `opportunity_chunks` tem RLS ligada, então uma chave anon ou
  // publicável lê ZERO chunks — e sem esta guarda o servidor tentaria embeddar
  // as 295 oportunidades a CADA cold start da Vercel, queimando a cota da NIM
  // e transformando uma requisição de 1s em uma de ~30s, em silêncio.
  //
  // Falhar aqui é melhor: o erro diz exatamente o que configurar.
  if (corpus.length > 0 && withoutVector.length > corpus.length * 0.5) {
    throw new Error(
      `[catalogo] ${withoutVector.length} de ${corpus.length} oportunidades sem vetor. ` +
        `Quase certamente a chave do Supabase não tem permissão para ler opportunity_chunks ` +
        `(RLS): configure uma chave service_role em PROD_SUPABASE_SERVICE_ROLE_KEY. ` +
        `Se as credenciais estiverem certas, rode \`npm run embed\`.`
    );
  }

  if (withoutVector.length) {
    console.warn(
      `[catalogo] ${withoutVector.length} oportunidade(s) sem embedding — embeddando agora. ` +
        `Rode \`npm run embed\` para materializar: ${withoutVector.map((i) => corpus[i].id).join(", ")}`
    );
    for (let k = 0; k < withoutVector.length; k += 32) {
      const batch = withoutVector.slice(k, k + 32);
      const vs = await embed(batch.map((i) => buildPassage(corpus[i])), "passage");
      batch.forEach((i, j) => { vectors[i] = vs[j]; });
    }
  }

  return { corpus, index, vectors, byId, loadedAt: Date.now() };
}

export async function getCatalog() {
  if (estado && Date.now() - estado.loadedAt < TTL_MS) return estado;

  // Vencido mas presente: devolve o antigo e revalida por trás.
  if (estado) {
    if (!carregando) {
      carregando = load()
        .then((novo) => { estado = novo; return novo; })
        .catch((e) => { console.error("[catalogo] revalidação falhou, mantendo cache antigo:", e.message); return estado; })
        .finally(() => { carregando = null; });
    }
    return estado;
  }

  // Primeira carga: aqui precisa esperar de verdade.
  if (!carregando) carregando = load().then((novo) => { estado = novo; return novo; }).finally(() => { carregando = null; });
  return await carregando;
}

export function invalidarCatalogo() {
  estado = null;
}

export const opportunityById = (cat, id) => cat.corpus[cat.byId.get(Number(id))] ?? null;
