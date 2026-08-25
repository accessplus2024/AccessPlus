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
  const resOpp = await devSupabase.from("opportunities").select(COLUNAS).eq("status", "Aprovada");
  if (resOpp.error) throw new Error(`Erro ao carregar catálogo: ${resOpp.error.message}`);

  const corpus = resOpp.data;
  const index = buildIndex(corpus, buildFields);
  const byId = new Map(corpus.map((o, i) => [o.id, i]));
  return { corpus, index, byId, loadedAt: Date.now() };
}

// ── Vetores, carregados SÓ quando a perna vetorial roda ────────────────────
//
// Medido em 2026-08-25: os vetores são 7,25 MB por carga; o texto do catálogo
// é 0,47 MB. E `chat.post.js` chamava `getCatalog()` no topo de TODA
// requisição — um aluno dizendo "oi" ou perguntando "o que é um MUN" baixava
// os 7,25 MB sem usar um único vetor.
//
// Na Vercel cada invocação é um processo novo, então o cache de 12h quase nunca
// é reaproveitado: na prática era ~7,7 MB por requisição. 663 cargas esgotam os
// 5 GB de egress do plano — e o projeto chegou a 7,27 GB.
//
// O roteador precisa do TEXTO (para casar título); só `search.js` e
// `multiAspect.js` tocam os vetores. Separar as duas cargas é o que faz um
// "oi" custar 0,47 MB em vez de 7,72 MB.
let vetores = null;
let carregandoVetores = null;

// Lê os vetores do arquivo embarcado no bundle (server/assets/vectors/core.bin,
// gerado por scripts/dump-vectors.js no build). Egress ZERO — é a diferença
// entre 7,25 MB por invocação e nada.
//
// Devolve null em qualquer problema: arquivo ausente (dev, ou build sem
// credenciais), modelo diferente do configurado, formato inesperado. Quem chama
// cai no Supabase, que continua sendo a fonte de verdade.
async function lerVetoresDoBundle() {
  try {
    if (typeof useStorage !== "function") return null;

    // O nome da chave difere entre `nuxt dev` e o bundle da Vercel, e entre
    // versões do Nitro. Em vez de adivinhar, tenta as grafias conhecidas e, se
    // nenhuma servir, LISTA o que existe — descobrir isso por log é mais rápido
    // que por tentativa e erro em deploy.
    // `assets:server` é o mount que o Nuxt cria sozinho para server/assets/ —
    // verificado funcionando em 2026-08-25, e é o único que existe na Vercel.
    // As outras grafias ficam como rede para versões diferentes do Nitro; não
    // há `serverAssets` no nuxt.config de propósito: declarar um segundo mount
    // do mesmo diretório embarcaria os 2,3 MB duas vezes no bundle da função.
    const tentativas = [
      ["assets:server", "vectors/core.bin"],
      ["assets:vectors", "core.bin"],
      ["assets:server", "vectors:core.bin"],
      ["assets:vectors", "vectors/core.bin"],
    ];
    let bruto = null;
    let origem = null;
    for (const [mount, chave] of tentativas) {
      try { bruto = await useStorage(mount).getItemRaw(chave); } catch { /* mount/chave inexistente */ }
      if (bruto) { origem = `${mount}/${chave}`; break; }
    }

    // Último recurso: ler do disco. Cobre `nuxt dev`, onde o mount de
    // serverAssets às vezes não expõe o arquivo.
    if (!bruto) {
      try {
        const { readFileSync, existsSync } = await import("node:fs");
        const caminho = new URL("../../assets/vectors/core.bin", import.meta.url).pathname;
        if (existsSync(caminho)) { bruto = readFileSync(caminho); origem = "disco (dev)"; }
      } catch { /* em produção o caminho não existe; segue para o aviso */ }
    }

    if (!bruto) {
      for (const mount of ["assets:server", "assets:vectors"]) {
        try {
          console.warn(`[catalogo] chaves em ${mount} = ${JSON.stringify(await useStorage(mount).getKeys())}`);
        } catch (e) {
          console.warn(`[catalogo] ${mount} indisponível: ${e.message}`);
        }
      }
      return null;
    }

    const buf = Buffer.isBuffer(bruto) ? bruto : Buffer.from(bruto);
    if (buf.length < 8 || buf.toString("ascii", 0, 4) !== "ACV1") {
      console.warn("[catalogo] core.bin com formato inesperado — ignorado");
      return null;
    }
    const tamCabecalho = buf.readUInt32LE(4);
    const cab = JSON.parse(buf.toString("utf8", 8, 8 + tamCabecalho));

    const dimsEsperadas = Number(process.env.EMBEDDING_DIMENSIONS) || null;
    if (dimsEsperadas && cab.dims !== dimsEsperadas) {
      console.warn(`[catalogo] core.bin tem ${cab.dims} dims, config diz ${dimsEsperadas} — ignorado`);
      return null;
    }
    if (process.env.EMBEDDING_MODEL && cab.model !== process.env.EMBEDDING_MODEL) {
      console.warn(`[catalogo] core.bin foi gerado com "${cab.model}", config diz "${process.env.EMBEDDING_MODEL}" — ignorado`);
      return null;
    }

    // Cópia para um buffer alinhado: Float32Array exige offset múltiplo de 4, e
    // o cabeçalho tem tamanho variável.
    const inicio = 8 + tamCabecalho;
    const floats = new Float32Array(buf.buffer.slice(buf.byteOffset + inicio, buf.byteOffset + buf.length));
    if (floats.length !== cab.count * cab.dims) {
      console.warn("[catalogo] core.bin truncado — ignorado");
      return null;
    }

    const porId = new Map();
    cab.ids.forEach((id, i) => porId.set(id, Array.from(floats.subarray(i * cab.dims, (i + 1) * cab.dims))));

    // A ORIGEM importa: o mount do Nitro é o que existe na Vercel; "disco" só
    // funciona em `nuxt dev`. Sem distinguir as duas, um teste local passando
    // não diz nada sobre o egress em produção.
    porId._origem = origem;
    return porId;
  } catch (e) {
    console.warn(`[catalogo] falha ao ler core.bin (${e.message}) — caindo no Supabase`);
    return null;
  }
}

async function loadVectors(cat) {
  const { corpus, byId } = cat;

  // 1. arquivo do bundle: egress zero.
  const doBundle = await lerVetoresDoBundle();

  // 2. o que faltou (oportunidade aprovada depois do último build) vem do
  //    banco — e SÓ ela, não o catálogo inteiro.
  const faltando = doBundle ? corpus.filter((o) => !doBundle.has(o.id)).map((o) => o.id) : null;

  let data = [];
  if (!doBundle) {
    const r = await devSupabase
      .from("opportunity_chunks")
      .select("opportunity_id, embedding")
      .eq("field_name", "core");
    if (r.error) throw new Error(`Erro ao carregar embeddings: ${r.error.message}`);
    data = r.data;
    console.log(`[catalogo] vetores lidos do Supabase (${data.length}) — sem core.bin no bundle`);
  } else if (faltando.length) {
    const r = await devSupabase
      .from("opportunity_chunks")
      .select("opportunity_id, embedding")
      .eq("field_name", "core")
      .in("opportunity_id", faltando);
    if (r.error) throw new Error(`Erro ao carregar embeddings faltantes: ${r.error.message}`);
    data = r.data;
    console.log(`[catalogo] core.bin cobriu ${doBundle.size}; ${faltando.length} buscada(s) no banco`);
  } else {
    const via = doBundle._origem ?? "?";
    console.log(`[catalogo] ${doBundle.size} vetores de ${via} — zero egress`);
    if (via === "disco (dev)") {
      console.warn(
        "[catalogo] ATENÇÃO: veio do DISCO, não do mount do Nitro. Em produção o caminho " +
          "não existe e a busca cairá no Supabase (7,25 MB por invocação). Confira o log do deploy."
      );
    }
  }

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
  const chunks = data;

  const vectors = new Array(corpus.length).fill(null);
  if (doBundle) {
    for (const [id, v] of doBundle) {
      const i = byId.get(id);
      if (i !== undefined) vectors[i] = v;
    }
  }
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

  return { vectors, loadedAt: Date.now() };
}

export async function getVectors() {
  if (vetores && Date.now() - vetores.loadedAt < TTL_MS) return vetores.vectors;
  const cat = await getCatalog();
  if (!carregandoVetores) {
    carregandoVetores = loadVectors(cat)
      .then((v) => { vetores = v; return v; })
      .finally(() => { carregandoVetores = null; });
  }
  const v = await carregandoVetores;
  return v.vectors;
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
