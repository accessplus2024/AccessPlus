// Quais lacunas do BANCO estão limitando o retrieval, e quanto cada uma
// custa. Isto não é "campo nulo é feio": cada linha aqui está amarrada a um
// comportamento concreto do pipeline que deixa de funcionar.
import { loadCorpus } from "./corpus.mjs";
import { loadGoldenSet } from "./goldenset.mjs";
import { derivedSignals } from "./signals.mjs";

const corpus = await loadCorpus();
const casos = loadGoldenSet("scripts/eval/golden-set.json", corpus);
const n = corpus.length;
const pct = (x) => `${((x / n) * 100).toFixed(0)}%`;
const vazio = (v) => v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
const faltam = (campo) => corpus.filter((o) => vazio(o[campo])).length;

console.log(`Catálogo: ${n} oportunidades com status 'Aprovada' (Supabase dev)\n`);

const campos = ["title","description","eligibility","process","applicants","additionals","type","areas","keywords","level","audience","cost","language","location","format","inscricoes","deadline","link","resources"];
console.log("Preenchimento por campo:");
for (const c of campos) {
  const f = faltam(c);
  const barra = "#".repeat(Math.round(((n - f) / n) * 30)).padEnd(30, ".");
  console.log(`  ${c.padEnd(14)} ${barra} ${n - f}/${n}  faltam ${f} (${pct(f)})`);
}

console.log("\n— Vocabulário livre onde deveria ser controlado —");
const locais = [...new Set(corpus.map((o) => o.location).filter(Boolean))];
console.log(`  location: ${locais.length} valores distintos para ${n - faltam("location")} linhas preenchidas`);
console.log(`     exemplos: ${locais.slice(0, 6).map((l) => `"${l.slice(0, 45)}"`).join(", ")}`);
const idiomas = [...new Set(corpus.map((o) => o.language).filter(Boolean))];
console.log(`  language: ${JSON.stringify(idiomas)}`);

console.log("\n— Quanto o sinal DERIVADO está substituindo dado ausente —");
let inferidoPt = 0, inferidoEn = 0, declarado = 0, semNada = 0;
for (const o of corpus) {
  const s = derivedSignals(o);
  if (s.confiancaIdioma === "declarada") declarado++;
  else if (s.provavelPortugues) inferidoPt++;
  else if (s.provavelIngles) inferidoEn++;
  else semNada++;
}
console.log(`  idioma declarado no banco: ${declarado}`);
console.log(`  idioma INFERIDO do título: ${inferidoPt} como português, ${inferidoEn} como inglês`);
console.log(`  sem sinal nenhum de idioma: ${semNada}  <- estes ficam neutros, nem premiados nem penalizados`);

console.log("\n— Faixa de idade: só é filtro quando está escrita em texto —");
const RE_IDADE = /\b(\d{1,2})\s*(a|até|-|–)\s*(\d{1,2})\s*anos\b|\b(entre|de)\s+(\d{1,2})\s+e\s+(\d{1,2})\s+anos\b|\bmenores de\s+(\d{1,2})\b|\bacima de\s+(\d{1,2})\s+anos\b/i;
const RE_SERIE = /\b[1-9][ºo°]?\s*ano\b|ensino m[ée]dio|ensino fundamental|high school|grades?\s*\d/i;
let comIdadeTexto = 0, soSerie = 0, nemUm = 0;
for (const o of corpus) {
  const t = `${o.title} ${o.description ?? ""} ${o.eligibility ?? ""}`;
  if (RE_IDADE.test(t)) comIdadeTexto++;
  else if (RE_SERIE.test(t)) soSerie++;
  else nemUm++;
}
console.log(`  declaram faixa de IDADE em texto: ${comIdadeTexto} (${pct(comIdadeTexto)})`);
console.log(`  só declaram SÉRIE, sem idade:     ${soSerie} (${pct(soSerie)})  <- filtro de idade nunca age aqui (correto, por decisão)`);
console.log(`  não declaram nem um nem outro:    ${nemUm} (${pct(nemUm)})`);

console.log("\n— Prazo: quantas oportunidades o aluno pode perder por falta do dado —");
const abertas = corpus.filter((o) => /aberta/i.test(o.inscricoes ?? ""));
const abertasSemPrazo = abertas.filter((o) => !o.deadline);
console.log(`  com inscrição 'Aberta': ${abertas.length}`);
console.log(`  dessas, SEM prazo registrado: ${abertasSemPrazo.length} (${((abertasSemPrazo.length / Math.max(1, abertas.length)) * 100).toFixed(0)}% das abertas)`);

console.log("\n— Cobertura do golden set: o catálogo tem o que os perfis pedem? —");
const idsRelevantes = new Set(casos.flatMap((c) => c.relevantIds));
console.log(`  oportunidades citadas como relevantes por algum perfil: ${idsRelevantes.size} de ${n} (${pct(idsRelevantes.size)})`);
const naoResolvidos = casos.flatMap((c) => c.naoResolvidos);
if (naoResolvidos.length) console.log(`  títulos do golden set que NÃO existem no catálogo: ${naoResolvidos.join(", ")}`);

console.log("\n— Distribuição por tipo (concorrência pelo topo, por categoria) —");
const porTipo = {};
for (const o of corpus) porTipo[o.type ?? "(nulo)"] = (porTipo[o.type ?? "(nulo)"] ?? 0) + 1;
for (const [t, c] of Object.entries(porTipo).sort((a, b) => b[1] - a[1])) console.log(`  ${String(t).padEnd(26)} ${c}`);

console.log("\n— Quantas são brasileiras / em português (o que este público mais consegue usar) —");
const br = corpus.filter((o) => derivedSignals(o).brasileiro).length;
const forinha = corpus.filter((o) => derivedSignals(o).presencialForaDoBrasil).length;
console.log(`  reconhecidas como brasileiras: ${br} (${pct(br)})`);
console.log(`  presenciais fora do Brasil:    ${forinha} (${pct(forinha)})`);
