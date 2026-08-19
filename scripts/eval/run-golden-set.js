// Roda o golden set (Parte 8 do plano) contra o pipeline REAL de recuperação
// — a mesma busca híbrida + rerank que /api/rag/match usa — e imprime
// recall@10, precision@5, NDCG@10, MRR e violação de barreira por perfil e
// na média geral.
//
// Por que não chama /api/rag/match diretamente: aquela rota também exige
// login + cota + geração por LLM (GLM-5.2). Nada disso importa pra medir
// RECUPERAÇÃO (retrieval) — só adicionaria custo e ruído (a mesma bio pode
// gerar texto levemente diferente a cada chamada, mas a lista de ids
// recuperados é determinística). Este script importa hybridSearch/rerank
// direto de server/utils/rag/, os MESMOS arquivos que a rota usa — não é
// uma reimplementação paralela que pode ficar dessincronizada.
//
// Como rodar:
//   npm run eval:golden-set
//
// Requer as mesmas variáveis do .env da raiz do projeto (DEV_SUPABASE_URL,
// DEV_SUPABASE_SERVICE_ROLE_KEY, NVIDIA_API_KEY, EMBEDDING_MODEL,
// EMBEDDING_DIMENSIONS) — carregadas manualmente aqui via dotenv porque,
// ao contrário do servidor Nuxt, rodar com `node` puro não injeta o .env
// sozinho.

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { readFileSync, mkdirSync, writeFileSync } from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

// Importados DEPOIS do dotenv.config(): esses módulos leem process.env no
// momento em que o arquivo carrega, então a ordem importa.
const { hybridSearch } = await import("../../server/utils/rag/hybridSearch.js");
const { rerank } = await import("../../server/utils/rag/rerank.js");
const { devSupabase } = await import("../../server/utils/rag/devClient.js");
const { recallAtK, precisionAtK, ndcgAtK, reciprocalRank, barrierViolationRate, average } = await import(
  "./metrics.js"
);

const RETRIEVAL_COUNT = 30; // quantos candidatos pedir na fusão RRF antes do rerank
const RERANK_TOP_K = 10; // quantos sobrevivem ao rerank — o que o script mede
const RECALL_K = 10;
const PRECISION_K = 5;
const NDCG_K = 10;

// Remove acentos e normaliza espaços/caixa, pra comparar título do golden
// set com título do banco sem exigir digitação byte-a-byte idêntica.
function normalizarTitulo(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove marcas de acento após NFD
    .toLowerCase()
    .trim();
}

async function carregarMapaDeTitulos() {
  const { data, error } = await devSupabase.from("opportunities").select("id, title").eq("status", "Aprovada");
  if (error) throw new Error(`Erro ao carregar oportunidades: ${error.message}`);

  const porTituloNormalizado = new Map();
  for (const row of data) {
    porTituloNormalizado.set(normalizarTitulo(row.title), row.id);
  }
  return { porTituloNormalizado, todas: data };
}

// Sugere títulos reais do catálogo parecidos com uma query que não bateu
// exato nem por substring — pra você conseguir corrigir o golden set em
// vez de adivinhar.
function candidatosSemelhantes(query, todasOportunidades, limite = 5) {
  const queryNorm = normalizarTitulo(query);
  const queryPalavras = queryNorm.split(/\s+/).filter((p) => p.length >= 3);

  const pontuados = todasOportunidades.map((o) => {
    const tituloNorm = normalizarTitulo(o.title);
    let pontos = 0;
    for (const palavra of queryPalavras) {
      if (tituloNorm.includes(palavra)) pontos += 1;
    }
    return { title: o.title, pontos };
  });

  return pontuados
    .filter((p) => p.pontos > 0)
    .sort((a, b) => b.pontos - a.pontos)
    .slice(0, limite);
}

function resolverTitulos(titulos, porTituloNormalizado, todasOportunidades, nomeDoCase) {
  const ids = [];
  for (const titulo of titulos) {
    const queryNorm = normalizarTitulo(titulo);
    let id = porTituloNormalizado.get(queryNorm);

    // Fallback 1: título do banco CONTÉM a query como substring. Cobre o
    // padrão comum no seu catálogo de abreviação entre parênteses, ex:
    // golden set diz "OBB", banco tem "Olimpíada Brasileira de Biologia (OBB)".
    if (id === undefined) {
      const bateram = [...porTituloNormalizado.entries()].filter(([tituloBanco]) =>
        tituloBanco.includes(queryNorm)
      );
      if (bateram.length === 1) {
        id = bateram[0][1];
        const tituloReal = todasOportunidades.find((o) => o.id === id)?.title;
        console.log(`  ℹ️  [${nomeDoCase}] "${titulo}" resolvido por substring → "${tituloReal}"`);
      } else if (bateram.length > 1) {
        const opcoes = bateram.map(([, bid]) => todasOportunidades.find((o) => o.id === bid)?.title);
        console.warn(
          `  ⚠️  [${nomeDoCase}] "${titulo}" bate com mais de um título — ambíguo, pulando: ${opcoes.join(" | ")}`
        );
      }
    }

    if (id === undefined) {
      console.warn(
        `  ⚠️  [${nomeDoCase}] título "${titulo}" não encontrado em opportunities.title — verifique se mudou ou se há erro de digitação.`
      );
      const sugestoes = candidatosSemelhantes(titulo, todasOportunidades);
      if (sugestoes.length > 0) {
        console.warn(`      Candidatos próximos no catálogo: ${sugestoes.map((s) => `"${s.title}"`).join(", ")}`);
      }
      continue;
    }
    ids.push(id);
  }
  return ids;
}

// Heurística simples pra "violação de barreira" quando o aluno marcou
// condicao_financeira = 'precisa_gratuito'. Segue a Parte 7.2 do plano:
// dado ausente/desconhecido NUNCA conta como violação — só um valor
// explícito de custo pago conta.
function violaBarreiraFinanceira(oportunidade) {
  const custo = (oportunidade.cost ?? oportunidade.metadata?.cost ?? "").toString().toLowerCase();
  if (!custo) return false; // desconhecido → neutro, não é violação
  const pareceGratuito = /gratuit|bolsa|financiad|isen/.test(custo);
  const parecePago = /pago|taxa|mensalidade/.test(custo);
  return parecePago && !pareceGratuito;
}

async function rodarCaso(caso, porTituloNormalizado, todasOportunidades) {
  const { perfil } = caso;
  const freeText = perfil.bio;
  const keywordText = [...(perfil.areas ?? [])].join(" ");

  const relevantIds = resolverTitulos(
    caso.deve_aparecer_no_top10 ?? [],
    porTituloNormalizado,
    todasOportunidades,
    caso.id
  );
  const naoDeveIds = resolverTitulos(
    caso.nao_deve_aparecer_no_top5 ?? [],
    porTituloNormalizado,
    todasOportunidades,
    caso.id
  );

  // Etapa 1: fusão RRF (vetor + FTS), igual ao match.post.js.
  const fused = await hybridSearch(freeText, keywordText, RETRIEVAL_COUNT);
  const ids = fused.map((r) => r.opportunity_id);

  const { data: oportunidades, error } = await devSupabase
    .from("opportunities")
    .select("id, title, description, cost, metadata")
    .in("id", ids);
  if (error) throw new Error(`Erro ao buscar oportunidades para "${caso.id}": ${error.message}`);
  const porId = new Map(oportunidades.map((o) => [o.id, o]));

  const antesDoRerank = fused.map((r) => porId.get(r.opportunity_id)).filter(Boolean);

  // Etapa 2: rerank (cross-encoder), igual ao match.post.js.
  const passagens = antesDoRerank.map((o) => `${o.title}\n${o.description ?? ""}`);
  const rankings = await rerank(freeText, passagens);
  const depoisDoRerank = rankings.slice(0, RERANK_TOP_K).map((r) => antesDoRerank[r.index]);
  const rankedIds = depoisDoRerank.map((o) => o.id);

  const metrics = {
    recallAt10: recallAtK(rankedIds, relevantIds, RECALL_K),
    precisionAt5: precisionAtK(rankedIds, relevantIds, PRECISION_K),
    ndcgAt10: ndcgAtK(rankedIds, relevantIds, NDCG_K),
    mrr: reciprocalRank(rankedIds, relevantIds),
  };

  if (perfil.condicao_financeira === "precisa_gratuito") {
    metrics.violacaoBarreiraFinanceira = barrierViolationRate(depoisDoRerank, violaBarreiraFinanceira);
  }

  // Sinal extra, não uma métrica formal: quantos dos "não deveria aparecer
  // no top5" realmente vazaram pro top5 mostrado.
  const top5 = new Set(rankedIds.slice(0, 5));
  const vazamentos = naoDeveIds.filter((id) => top5.has(id));

  return {
    id: caso.id,
    observacao: caso.observacao,
    relevantesEsperados: relevantIds.length,
    rankedTitles: depoisDoRerank.map((o) => o.title),
    metrics,
    vazamentos: vazamentos.map((id) => porId.get(id)?.title ?? id),
  };
}

async function main() {
  const raw = readFileSync(path.join(__dirname, "golden-set.json"), "utf-8");
  const goldenSet = JSON.parse(raw);

  console.log(`Golden set: ${goldenSet.perfis.length} perfil(is) carregado(s).\n`);

  const { porTituloNormalizado, todas } = await carregarMapaDeTitulos();

  const resultados = [];
  for (const caso of goldenSet.perfis) {
    console.log(`▶ Rodando ${caso.id}...`);
    const resultado = await rodarCaso(caso, porTituloNormalizado, todas);
    resultados.push(resultado);

    console.log(`  recall@${RECALL_K}:        ${formatar(resultado.metrics.recallAt10)}`);
    console.log(`  precision@${PRECISION_K}:     ${formatar(resultado.metrics.precisionAt5)}`);
    console.log(`  NDCG@${NDCG_K}:          ${formatar(resultado.metrics.ndcgAt10)}`);
    console.log(`  MRR:              ${formatar(resultado.metrics.mrr)}`);
    if (resultado.metrics.violacaoBarreiraFinanceira !== undefined) {
      console.log(`  violação barreira: ${formatar(resultado.metrics.violacaoBarreiraFinanceira)}`);
    }
    if (resultado.vazamentos.length > 0) {
      console.log(`  ⚠️  apareceu no top5 mesmo estando em "não deveria": ${resultado.vazamentos.join(", ")}`);
    }
    console.log(`  top ${RERANK_TOP_K} mostrado: ${resultado.rankedTitles.join(" | ")}`);
    console.log("");
  }

  const media = {
    recallAt10: average(resultados.map((r) => r.metrics.recallAt10)),
    precisionAt5: average(resultados.map((r) => r.metrics.precisionAt5)),
    ndcgAt10: average(resultados.map((r) => r.metrics.ndcgAt10)),
    mrr: average(resultados.map((r) => r.metrics.mrr)),
    violacaoBarreiraFinanceira: average(
      resultados.map((r) => r.metrics.violacaoBarreiraFinanceira).filter((v) => v !== undefined)
    ),
  };

  console.log("── Média geral ──────────────────────────");
  console.log(`recall@${RECALL_K}:        ${formatar(media.recallAt10)}  (alvo Parte 8: ≥ 0.80)`);
  console.log(`precision@${PRECISION_K}:     ${formatar(media.precisionAt5)}`);
  console.log(`NDCG@${NDCG_K}:          ${formatar(media.ndcgAt10)}`);
  console.log(`MRR:              ${formatar(media.mrr)}`);
  console.log(`violação barreira: ${formatar(media.violacaoBarreiraFinanceira)}  (alvo Parte 8: tendendo a zero)`);

  // Registra o resultado com data — docs/eval.md pede "últimos números
  // registrados com data" (Parte 16).
  const resultsDir = path.join(__dirname, "results");
  mkdirSync(resultsDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outputPath = path.join(resultsDir, `${timestamp}.json`);
  writeFileSync(outputPath, JSON.stringify({ timestamp, media, resultados }, null, 2));
  console.log(`\nResultado completo salvo em scripts/eval/results/${timestamp}.json`);
}

function formatar(valor) {
  if (valor === null || valor === undefined) return "—";
  return valor.toFixed(2);
}

main().catch((err) => {
  console.error("Erro rodando o golden set:", err);
  process.exit(1);
});