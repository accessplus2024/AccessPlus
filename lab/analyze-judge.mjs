// Por que o juiz LLM PIOROU o recall@10 (0.668 -> 0.602)? Duas hipoteses
// muito diferentes, e a acao correta depende de qual e:
//   (a) O juiz da a mesma nota pra muita coisa (ex: metade do pool com 3).
//       Ai ele nao ORDENA nada, so destroi a ordem que a busca tinha, e o
//       desempate vira quase sorteio. Solucao: usar a nota como faixa e
//       manter a ordem da busca dentro da faixa.
//   (b) O juiz discorda do golden set de verdade - da nota baixa pra itens
//       que a mantenedora marcou como "deve aparecer". Ai o problema nao e
//       tecnico, e de alinhamento: ou o prompt do juiz esta errado, ou o
//       golden set espera coisas que o juiz (com ratio ou nao) considera
//       inuteis. Solucao: olhar CASO A CASO qual dos dois esta certo.
import { loadCorpus } from "./corpus.mjs";
import { loadGoldenSet } from "./goldenset.mjs";
import { rodar } from "./pipeline.mjs";
import { julgar2 } from "./judge2.mjs";
import { average } from "./metrics.mjs";

const corpus = await loadCorpus();
const casos = loadGoldenSet("scripts/eval/golden-set.json", corpus);
const titulo = (id) => corpus.find((o) => o.id === id)?.title ?? id;

const cfg = { multiQuery: true, boosts: true, rerank: "rico", pesoRerank: 0.6, candidates: 30, queryRerank: "focada" };
const histNotaRelevante = [0, 0, 0, 0];
const histNotaOutro = [0, 0, 0, 0];
const discordancias = [];
const empates = [];

for (const caso of casos) {
  if (!caso.relevantIds.length || caso.semOportunidadeEsperada) continue;
  const { candidates } = await rodar(caso.perfil, cfg);
  const notas = await julgar2(caso.perfil.bio, candidates.slice(0, 30), { modelo: "openai/gpt-oss-20b", lote: 10 });
  if (!notas.size) continue;

  const rel = new Set(caso.relevantIds);
  const dist = [0, 0, 0, 0];
  for (const o of candidates.slice(0, 30)) {
    const n = notas.get(o.id);
    if (n === undefined) continue;
    dist[n]++;
    if (rel.has(o.id)) histNotaRelevante[n]++;
    else histNotaOutro[n]++;
  }
  empates.push({ id: caso.id, dist, maiorFaixa: Math.max(...dist) });

  // relevantes que o juiz rebaixou (nota 0 ou 1)
  const rebaixados = candidates.slice(0, 30).filter((o) => rel.has(o.id) && (notas.get(o.id) ?? 9) <= 1);
  if (rebaixados.length) {
    discordancias.push({ id: caso.id, bio: caso.perfil.bio.slice(0, 110), itens: rebaixados.map((o) => `${o.title} (n=${notas.get(o.id)})`) });
  }
}

console.log("Distribuicao das notas do juiz:");
console.log("  em itens RELEVANTES (golden set):", histNotaRelevante, "-> media", (histNotaRelevante.reduce((a, n, i) => a + n * i, 0) / Math.max(1, histNotaRelevante.reduce((a, b) => a + b, 0))).toFixed(2));
console.log("  em itens NAO relevantes:         ", histNotaOutro, "-> media", (histNotaOutro.reduce((a, n, i) => a + n * i, 0) / Math.max(1, histNotaOutro.reduce((a, b) => a + b, 0))).toFixed(2));
console.log("\nTamanho da MAIOR faixa de nota empatada, por perfil (30 candidatos):");
console.log("  media:", average(empates.map((e) => e.maiorFaixa)).toFixed(1), "| max:", Math.max(...empates.map((e) => e.maiorFaixa)));
console.log("  (se isso e grande, o juiz nao ordena - ele empata, e o desempate vira o que decide)");

console.log("\nRelevantes que o juiz rebaixou para 0 ou 1:");
for (const d of discordancias) {
  console.log(`  ${d.id}: "${d.bio}"`);
  for (const i of d.itens) console.log(`      - ${i}`);
}
