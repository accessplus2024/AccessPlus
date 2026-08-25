// Varredura de pesos. O diagnostico (lab/diagnostico.mjs) mostrou que o
// pool de candidatos ja contem 84% dos relevantes em @30+@30 e 93% em
// @60+@60 - ou seja, o recall perdido esta na ORDENACAO, nao na busca.
// Entao e aqui que os pesos importam.
import { loadCorpus } from "./corpus.mjs";
import { loadGoldenSet } from "./goldenset.mjs";
import { prepararEstado } from "./pipeline.mjs";
import { avaliarVariante } from "./run.mjs";

const corpus = await loadCorpus();
const casos = loadGoldenSet("scripts/eval/golden-set.json", corpus);
await prepararEstado();

// `bIdiomaPenal` entrou na grade em 2026-08-25. Ela era uma constante (0,8)
// calibrada contra a escala de scores de `llama-nemotron-embed-1b-v2`, que a
// NVIDIA desligou. Modelo novo, distribuição de score nova: a mesma subtração
// de 0,8 pesa diferente. Medido depois da troca, "inglês no top-3 de quem não
// fala inglês" foi de 0,043 para 0,130 — e essa é a métrica que o valor 0,8
// existia para segurar.
//
// Varrer isto junto com os pesos importa porque as duas coisas interagem: o
// boost compete com o score de fusão, e mudar o peso da fusão muda quanto a
// penalidade vale na prática.
const grade = [];
for (const candidates of [30, 50, 70]) {
  for (const [pv, pl] of [[1, 1], [1.4, 0.7], [0.7, 1.4]]) {
    for (const pesoRerank of [0.4, 0.6, 0.8, 1.0]) {
      for (const bIdiomaPenal of [0.8, 1.2, 1.6, 2.0]) {
        grade.push({ candidates, pesoVetor: pv, pesoLexical: pl, pesoRerank, bIdiomaPenal,
          rerank: "rico", boosts: true, expansao: true, vetor: "novo", lexical: "bm25" });
      }
    }
  }
}
console.log(`grade: ${grade.length} configurações\n`);

const linhas = [];
for (const cfg of grade) {
  const { media } = await avaliarVariante(cfg, casos);
  linhas.push({ cfg, media });
  process.stdout.write(
    `cand ${String(cfg.candidates).padStart(2)} v/l ${cfg.pesoVetor}/${cfg.pesoLexical} rr ${cfg.pesoRerank} idi ${cfg.bIdiomaPenal}  ` +
    `recall ${media.recall10.toFixed(3)} prec ${media.precision5.toFixed(3)} ndcg ${media.ndcg10.toFixed(3)} mrr ${media.mrr.toFixed(3)} vaz ${media.vazamentos}` +
    (media.inglesTop3 !== undefined ? ` ing ${media.inglesTop3.toFixed(3)}` : "") + "\n"
  );
}

linhas.sort((a, b) => b.media.recall10 - a.media.recall10);
console.log("\n== TOP 5 por recall@10 ==");
for (const l of linhas.slice(0, 5)) console.log(JSON.stringify({ ...l.cfg, ...l.media }));
linhas.sort((a, b) => b.media.ndcg10 - a.media.ndcg10);
console.log("\n== TOP 5 por NDCG@10 ==");
for (const l of linhas.slice(0, 5)) console.log(JSON.stringify({ ...l.cfg, ...l.media }));
