// Onde o recall se perde: no candidate generation (o item relevante nunca
// entra no pool) ou na ordenacao (entra e fica abaixo da posicao 10)?
// Sem separar isso, ajustar pesos de rerank e chute no escuro.
import { loadCorpus } from "./corpus.mjs";
import { loadGoldenSet } from "./goldenset.mjs";
import { prepararEstado, normalizeLevel } from "./pipeline.mjs";
import { analyzeQuery, expandedTerms } from "./expand.mjs";
import { bm25Search } from "./bm25.mjs";
import { embed, cosine } from "./embed.mjs";
import { average } from "./metrics.mjs";

const corpus = await loadCorpus();
const casos = loadGoldenSet("scripts/eval/golden-set.json", corpus);
const st = await prepararEstado();

const rec = (ids, rel, k) => (rel.length ? rel.filter((r) => ids.slice(0, k).includes(r)).length / rel.length : null);

const linhas = [];
for (const caso of casos) {
  const rel = caso.relevantIds;
  if (!rel.length || caso.semOportunidadeEsperada) continue;
  const p = caso.perfil;
  const analysis = analyzeQuery({ bio: p.bio, areasMarcadas: p.areas ?? [], nivel: normalizeLevel(p.nivel), condicaoFinanceira: p.condicao_financeira, local: p.local });
  const { termos, boost } = expandedTerms(p.bio, analysis);

  const idsBm25 = bm25Search(st.index, termos, { boostPorTermo: boost, topK: corpus.length }).map((r) => corpus[r.docIdx].id);

  const queryVet = [p.bio, analysis.areas.length ? `Areas de interesse: ${analysis.areas.join(", ")}.` : "",
    analysis.tipos.length ? `Procura por: ${analysis.tipos.join(", ")}.` : "",
    analysis.niveis.length ? `Nivel escolar: ${analysis.niveis.join(", ")}.` : ""].filter(Boolean).join(" ");
  const [qv] = await embed([queryVet], "query");
  const idsVet = corpus.map((o, i) => ({ id: o.id, s: cosine(qv, st.vetoresNovos[i]) })).sort((a, b) => b.s - a.s).map((x) => x.id);

  const uniao30 = [...new Set([...idsBm25.slice(0, 30), ...idsVet.slice(0, 30)])];
  const uniao60 = [...new Set([...idsBm25.slice(0, 60), ...idsVet.slice(0, 60)])];

  linhas.push({
    id: caso.id,
    nRel: rel.length,
    bm25_10: rec(idsBm25, rel, 10), bm25_30: rec(idsBm25, rel, 30), bm25_60: rec(idsBm25, rel, 60),
    vet_10: rec(idsVet, rel, 10), vet_30: rec(idsVet, rel, 30), vet_60: rec(idsVet, rel, 60),
    uniao30: rec(uniao30, rel, uniao30.length), uniao60: rec(uniao60, rel, uniao60.length),
    faltantesNaUniao60: rel.filter((r) => !uniao60.includes(r)).map((r) => corpus.find((o) => o.id === r)?.title),
  });
}

const col = (k) => average(linhas.map((l) => l[k])).toFixed(3);
console.log("recall medio por lado e por corte:");
console.log(`  BM25    @10 ${col("bm25_10")}  @30 ${col("bm25_30")}  @60 ${col("bm25_60")}`);
console.log(`  vetor   @10 ${col("vet_10")}  @30 ${col("vet_30")}  @60 ${col("vet_60")}`);
console.log(`  TETO uniao dos dois lados: @30+30 ${col("uniao30")}   @60+60 ${col("uniao60")}`);
console.log("\nrelevantes que NENHUM lado encontra nem no top-60 (limite do candidate generation):");
for (const l of linhas) {
  if (l.faltantesNaUniao60.length) console.log(`  ${l.id} (${l.nRel} rel): ${l.faltantesNaUniao60.join(" | ")}`);
}
