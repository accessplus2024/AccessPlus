// Harness de ablacao: roda o golden set inteiro por variante e imprime a
// tabela comparativa. Uso:
//   node lab/run.mjs                  -> todas as variantes, 1 rodada
//   node lab/run.mjs --rodadas 3      -> 3 rodadas de cada
//   node lab/run.mjs --variantes A,F  -> so as variantes escolhidas
import { loadCorpus } from "./corpus.mjs";
import { loadGoldenSet } from "./goldenset.mjs";
import { rodar, prepararEstado } from "./pipeline.mjs";
import { recallAtK, precisionAtK, ndcgAtK, reciprocalRank, recallAtingivelAtK, average } from "./metrics.mjs";
import { derivedSignals } from "./signals.mjs";
import { writeFileSync, mkdirSync } from "fs";

const argv = process.argv.slice(2);
const arg = (nome, def) => {
  const i = argv.indexOf(`--${nome}`);
  return i >= 0 ? argv[i + 1] : def;
};

export const VARIANTES = {
  A_baseline_producao: { vetor: "db", lexical: "fts", expansao: false, boosts: false, rerank: "basico", pesoRerank: 1.0, candidates: 20 },
  B_so_bm25:           { vetor: "db", lexical: "bm25", expansao: false, boosts: false, rerank: "basico", pesoRerank: 1.0, candidates: 20 },
  C_bm25_expansao:     { vetor: "db", lexical: "bm25", expansao: true,  boosts: false, rerank: "basico", pesoRerank: 1.0, candidates: 20 },
  D_vetor_novo:        { vetor: "novo", lexical: "bm25", expansao: true, boosts: false, rerank: "basico", pesoRerank: 1.0, candidates: 20 },
  E_boosts:            { vetor: "novo", lexical: "bm25", expansao: true, boosts: true,  rerank: "basico", pesoRerank: 1.0, candidates: 30 },
  F_rerank_rico:       { vetor: "novo", lexical: "bm25", expansao: true, boosts: true,  rerank: "rico",   pesoRerank: 1.0, candidates: 30 },
  G_rerank_misturado:  { vetor: "novo", lexical: "bm25", expansao: true, boosts: true,  rerank: "rico",   pesoRerank: 0.6, candidates: 30 },
  H_sem_rerank:        { vetor: "novo", lexical: "bm25", expansao: true, boosts: true,  rerank: "off",    candidates: 30 },
  I_query_focada:      { vetor: "novo", lexical: "bm25", expansao: true, boosts: true,  rerank: "rico", pesoRerank: 0.6, candidates: 30, queryRerank: "focada" },
  J_multi_aspecto:     { multiQuery: true, boosts: true, rerank: "rico", pesoRerank: 0.6, candidates: 30, queryRerank: "bio" },
  K_multi_focada:      { multiQuery: true, boosts: true, rerank: "rico", pesoRerank: 0.6, candidates: 30, queryRerank: "focada" },
  L_multi_sem_rerank:  { multiQuery: true, boosts: true, rerank: "off", candidates: 30 },
  M_multi_focada_rr08: { multiQuery: true, boosts: true, rerank: "rico", pesoRerank: 0.8, candidates: 40, queryRerank: "focada" },
  N_juiz_llm:          { multiQuery: true, boosts: true, rerank: "rico", pesoRerank: 0.6, candidates: 30, queryRerank: "focada", juiz: "openai/gpt-oss-20b", pesoJuiz: 1.0 },
  O_juiz_forte:        { multiQuery: true, boosts: true, rerank: "rico", pesoRerank: 0.6, candidates: 30, queryRerank: "focada", juiz: "openai/gpt-oss-20b", pesoJuiz: 2.0 },
  P_juiz_so:           { multiQuery: true, boosts: true, rerank: "off", candidates: 30, juiz: "openai/gpt-oss-20b", pesoJuiz: 3.0 },
  Q_juiz_single:       { vetor: "novo", lexical: "bm25", expansao: true, boosts: true, rerank: "rico", pesoRerank: 0.6, candidates: 30, queryRerank: "focada", juiz: "openai/gpt-oss-20b", pesoJuiz: 2.0 },
  R_juiz_faixa:        { multiQuery: true, boosts: true, rerank: "rico", pesoRerank: 0.6, candidates: 30, queryRerank: "focada", juiz: "openai/gpt-oss-20b", modoJuiz: "faixa" },
  S_juiz_faixa_single: { vetor: "novo", lexical: "bm25", expansao: true, boosts: true, rerank: "rico", pesoRerank: 0.6, candidates: 30, queryRerank: "focada", juiz: "openai/gpt-oss-20b", modoJuiz: "faixa" },

  // As duas finalistas, medidas 3x com LAB_SEM_CACHE=1 (chamadas de API
  // independentes por rodada, senao "3 rodadas" seria o cache 3 vezes).
  FINAL_single:        { vetor: "novo", lexical: "bm25", expansao: true, boosts: true, rerank: "rico", pesoRerank: 0.6, candidates: 30, queryRerank: "focada" },
  FINAL_multi:         { multiQuery: true, boosts: true, rerank: "rico", pesoRerank: 0.6, candidates: 30, queryRerank: "focada" },
  BASE_producao:       { vetor: "db", lexical: "fts", expansao: false, boosts: false, rerank: "basico", pesoRerank: 1.0, candidates: 20 },
  // Melhor medida de todas: consulta unica, query CRUA no cross-encoder
  // (a versao "focada" ajudou o MRR mas custou recall) e mistura 0.6.
  FINALG_escolhida:    { vetor: "novo", lexical: "bm25", expansao: true, boosts: true, rerank: "rico", pesoRerank: 0.6, candidates: 30, queryRerank: "bio" },
  FINALG_pool50:       { vetor: "novo", lexical: "bm25", expansao: true, boosts: true, rerank: "rico", pesoRerank: 0.6, candidates: 50, queryRerank: "bio" },
  T_boost_depois:      { vetor: "novo", lexical: "bm25", expansao: true, boosts: true, rerank: "rico", pesoRerank: 0.6, candidates: 30, queryRerank: "bio", boostDepois: true },
  U_boost_depois_forte:{ vetor: "novo", lexical: "bm25", expansao: true, boosts: true, rerank: "rico", pesoRerank: 0.6, candidates: 30, queryRerank: "bio", boostDepois: true, bIdiomaPenal: 0.6, bLocal: 0.7, bViagemPenal: 0.7 },
  V_pool50:            { vetor: "novo", lexical: "bm25", expansao: true, boosts: true, rerank: "rico", pesoRerank: 0.6, candidates: 50, queryRerank: "bio" },
  V2_pool50_idioma08:  { vetor: "novo", lexical: "bm25", expansao: true, boosts: true, rerank: "rico", pesoRerank: 0.6, candidates: 50, queryRerank: "bio", bIdioma: 0.5, bIdiomaPenal: 0.8 },
  V3_pool50_idioma15:  { vetor: "novo", lexical: "bm25", expansao: true, boosts: true, rerank: "rico", pesoRerank: 0.6, candidates: 50, queryRerank: "bio", bIdioma: 0.7, bIdiomaPenal: 1.5 },
  W1_idioma_06:        { vetor: "novo", lexical: "bm25", expansao: true, boosts: true, rerank: "rico", pesoRerank: 0.6, candidates: 50, queryRerank: "bio", bIdioma: 0.45, bIdiomaPenal: 0.6 },
  W2_idioma_10:        { vetor: "novo", lexical: "bm25", expansao: true, boosts: true, rerank: "rico", pesoRerank: 0.6, candidates: 50, queryRerank: "bio", bIdioma: 0.55, bIdiomaPenal: 1.0 },
  W3_idioma08_pool70:  { vetor: "novo", lexical: "bm25", expansao: true, boosts: true, rerank: "rico", pesoRerank: 0.6, candidates: 70, queryRerank: "bio", bIdioma: 0.5, bIdiomaPenal: 0.8 },

  // ESCOLHIDA PARA PRODUCAO. Igual a `search.js` (PESOS + defaults de search()).
  PROD:                { vetor: "novo", lexical: "bm25", expansao: true, boosts: true, rerank: "rico", pesoRerank: 0.6, candidates: 50, queryRerank: "bio", bIdioma: 0.5, bIdiomaPenal: 0.8 },
  ANTES:               { vetor: "db", lexical: "fts", expansao: false, boosts: false, rerank: "basico", pesoRerank: 1.0, candidates: 20 },
};

export async function avaliarVariante(cfg, casos) {
  const linhas = [];
  for (const caso of casos) {
    const { ranked, analysis } = await rodar(caso.perfil, cfg);
    const ids = ranked.map((o) => o.id);
    const relevantes = caso.relevantIds;
    const vazio = caso.semOportunidadeEsperada || relevantes.length === 0;
    linhas.push({
      id: caso.id,
      analysis,
      titulos: ranked.map((o) => o.title),
      recall10: vazio ? null : recallAtK(ids, relevantes, 10),
      recallAting10: vazio ? null : recallAtingivelAtK(ids, relevantes, 10),
      precision5: vazio ? null : precisionAtK(ids, relevantes, 5),
      ndcg10: vazio ? null : ndcgAtK(ids, relevantes, 10),
      mrr: vazio ? null : reciprocalRank(ids, relevantes),
      vazamentosTop5: caso.naoDeveIds.filter((id) => ids.slice(0, 5).includes(id)).length,
      // Exigencia escrita a mao no golden set (observacao do perfil-03):
      // "Programas em ingles PODEM aparecer com badge de idioma - nao e erro.
      //  Mas nao devem ocupar as 3 primeiras posicoes dado o ingles basico
      //  declarado." Nenhuma das metricas classicas captura isso: recall e
      //  NDCG nao sabem que o aluno declarou ingles fraco. Aqui viramos essa
      //  frase em numero - e, como violacao de barreira, MENOR e best.
      inglesNoTop3: analysis.inglesFraco
        ? ranked.slice(0, 3).filter((o) => derivedSignals(o).provavelIngles).length
        : null,
    });
  }
  return {
    media: {
      recall10: average(linhas.map((l) => l.recall10)),
      recallAting10: average(linhas.map((l) => l.recallAting10)),
      precision5: average(linhas.map((l) => l.precision5)),
      ndcg10: average(linhas.map((l) => l.ndcg10)),
      mrr: average(linhas.map((l) => l.mrr)),
      vazamentos: linhas.reduce((a, l) => a + l.vazamentosTop5, 0),
      inglesNoTop3: average(linhas.map((l) => l.inglesNoTop3)),
      perfisComInglesFraco: linhas.filter((l) => l.inglesNoTop3 !== null).length,
    },
    linhas,
  };
}

async function main() {
  const rodadas = Number(arg("rodadas", 1));
  const filtro = arg("variantes", null);
  const corpus = await loadCorpus();
  const casos = loadGoldenSet("scripts/eval/golden-set.json", corpus);
  await prepararEstado();

  const nomes = Object.keys(VARIANTES).filter((n) => !filtro || filtro.split(",").some((f) => n.startsWith(f)));
  const resultado = {};

  for (const nome of nomes) {
    const porRodada = [];
    for (let r = 0; r < rodadas; r++) {
      const out = await avaliarVariante(VARIANTES[nome], casos);
      porRodada.push(out.media);
      if (r === rodadas - 1) resultado[nome] = { medias: porRodada, detalhe: out.linhas };
    }
    const m = porRodada[porRodada.length - 1];
    console.log(
      `${nome.padEnd(22)} recall@10 ${f(m.recall10)}  prec@5 ${f(m.precision5)}  ndcg@10 ${f(m.ndcg10)}  mrr ${f(m.mrr)}  vazam ${m.vazamentos}  inglesTop3 ${f(m.inglesNoTop3)} (n=${m.perfisComInglesFraco})`
    );
    if (rodadas > 1) {
      const spread = (k) => {
        const vs = porRodada.map((x) => x[k]);
        return `${f(Math.min(...vs))}-${f(Math.max(...vs))}`;
      };
      console.log(`${" ".repeat(22)} (${rodadas} rodadas: recall ${spread("recall10")}, prec ${spread("precision5")}, ndcg ${spread("ndcg10")})`);
    }
  }

  mkdirSync("lab/out", { recursive: true });
  writeFileSync("lab/out/ablacao.json", JSON.stringify(resultado, null, 1));
  console.log("\ndetalhe salvo em lab/out/ablacao.json");
}

const f = (v) => (v === null || v === undefined ? " -- " : v.toFixed(3));

if (import.meta.url === `file://${process.argv[1]}`) main();
