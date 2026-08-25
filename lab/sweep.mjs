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

const grade = [];
for (const candidates of [30, 50, 70]) {
  for (const [pv, pl] of [[1, 1], [1.4, 0.7], [0.7, 1.4]]) {
    for (const pesoRerank of [0.4, 0.6, 0.8, 1.0]) {
      grade.push({ candidates, pesoVetor: pv, pesoLexical: pl, pesoRerank, rerank: "rico", boosts: true, expansao: true, vetor: "novo", lexical: "bm25" });
    }
  }
}

const linhas = [];
for (const cfg of grade) {
  const { media } = await avaliarVariante(cfg, casos);
  linhas.push({ cfg, media });
  process.stdout.write(
    `cand ${String(cfg.candidates).padStart(2)} v/l ${cfg.pesoVetor}/${cfg.pesoLexical} rr ${cfg.pesoRerank}  ` +
    `recall ${media.recall10.toFixed(3)} prec ${media.precision5.toFixed(3)} ndcg ${media.ndcg10.toFixed(3)} mrr ${media.mrr.toFixed(3)} vaz ${media.vazamentos}\n`
  );
}

linhas.sort((a, b) => b.media.recall10 - a.media.recall10);
console.log("\n== TOP 5 por recall@10 ==");
for (const l of linhas.slice(0, 5)) console.log(JSON.stringify({ ...l.cfg, ...l.media }));
linhas.sort((a, b) => b.media.ndcg10 - a.media.ndcg10);
console.log("\n== TOP 5 por NDCG@10 ==");
for (const l of linhas.slice(0, 5)) console.log(JSON.stringify({ ...l.cfg, ...l.media }));
