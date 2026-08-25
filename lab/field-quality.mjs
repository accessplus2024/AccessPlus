// Métricas de QUALIDADE DE CAMPO — camada 1 do plano de recalibragem.
// Roda offline, sem API, em segundos. Não prova ganho de retrieval sozinha:
// diz ONDE mexer. O árbitro continua sendo o golden set.
//
// Uso: node lab/qualidade-campos.mjs [--json]
//
// Documento que define estas métricas e as metas de cada campo:
//   docs/metricas-campos-2026-08-24.md
import { loadCorpus } from "./corpus.mjs";

const corpus = await loadCorpus();
const n = corpus.length;
const JSONMODE = process.argv.includes("--json");

const arr = (v) => (Array.isArray(v) ? v.filter(Boolean) : v ? [v] : []);
const pct = (x, base = n) => `${((x / base) * 100).toFixed(0)}%`;
const num = (x) => x.toFixed(2);

// ── 1. coverage ────────────────────────────────────────────────────────────
const coverage = (campo) => corpus.filter((o) => arr(o[campo]).length > 0).length / n;

// ── 2. cardinalidade: rótulos por linha (campos multi-rótulo) ───────────────
// Um campo multi-rótulo com média 1,0 é mono-rótulo disfarçado: `areas` está
// em 1,11 hoje, o que significa que quase nenhuma oportunidade recebeu a
// segunda área que ela de fato tem.
function cardinalidade(campo) {
  const preenchidas = corpus.filter((o) => arr(o[campo]).length > 0);
  if (!preenchidas.length) return { media: 0, distribuicao: {} };
  const dist = {};
  let soma = 0;
  for (const o of preenchidas) { const k = arr(o[campo]).length; dist[k] = (dist[k] ?? 0) + 1; soma += k; }
  return { media: soma / preenchidas.length, distribuicao: dist };
}

// ── 3. entropia e cardinalidade EFETIVA do vocabulário ──────────────────────
// Um campo pode ter 37 valores no vocabulário e se comportar como se tivesse
// 5: é o que exp(H) mede. Discriminância = exp(H) / V, entre 0 e 1. Perto de
// zero significa vocabulário decorativo — valores que aparecem uma vez cada e
// não separam nada para o BM25.
function vocabulario(campo) {
  const freq = new Map();
  let total = 0;
  for (const o of corpus) for (const v of arr(o[campo])) { const k = String(v).trim(); freq.set(k, (freq.get(k) ?? 0) + 1); total++; }
  const V = freq.size;
  let H = 0;
  for (const c of freq.values()) { const p = c / total; H -= p * Math.log(p); }
  const efetiva = V ? Math.exp(H) : 0;
  const ordenado = [...freq.entries()].sort((a, b) => b[1] - a[1]);
  const top2 = ordenado.slice(0, 2).reduce((s, [, c]) => s + c, 0) / Math.max(1, total);
  return { V, efetiva, discriminancia: V ? efetiva / V : 0, top2, ordenado, total };
}

// ── 4. redundância entre dois campos ────────────────────────────────────────
// `campos.js` concatena format, language, location e audience no MESMO campo
// `facets` do BM25F. Quando `location` repete `format`, a palavra "Híbrido"
// conta duas vezes e a oportunidade sobe indevidamente para quem pediu
// híbrido. Redundância aqui não é feiúra: é peso dobrado no ranking.
function redundancia(a, b) {
  const ambos = corpus.filter((o) => arr(o[a]).length && arr(o[b]).length);
  if (!ambos.length) return { fracao: 0, base: 0, iguais: 0 };
  const iguais = ambos.filter((o) => arr(o[a]).join("|").toLowerCase() === arr(o[b]).join("|").toLowerCase()).length;
  return { fracao: iguais / ambos.length, base: ambos.length, iguais };
}

// ── 5. omissão e conflito contra a evidência do texto ───────────────────────
// O texto livre frequentemente CONTÉM o valor que a coluna deixou de declarar.
// Omissão = texto tem, campo vazio (lista de trabalho pronta).
// Conflito = texto diz X, campo diz Y (erro de anotação; pior que lacuna).
const EVIDENCIA = {
  audience: {
    "Baixa Renda": /baixa renda|vulnerabilidade (social|econ)|renda familiar|bolsista integral|carente/i,
    "Escola Pública": /escola p[úu]blica|rede p[úu]blica|ensino p[úu]blico/i,
    "Meninas": /\b(meninas|mulheres|feminin\w*|garotas|girls|women|female)\b/i,
    "Negro/Pardo": /\b(negr[oa]s?|pard[oa]s?|afro[- ]?brasileir|pretos?)\b/i,
    "Indígena/Quilombola": /\b(ind[íi]gena|quilombola)\b/i,
    "PcD": /\b(pcd|defici[êe]ncia|surd[oa]|cadeirante|neurodiverg)\b/i,
    "LGBTQIA+": /\blgbtq?i?a?\+?\b|\btrans(g[êe]ner|exuais?|exual)\b|n[ãa]o[- ]bin[áa]ri/i,
  },
  // Para idioma a evidência é o TÍTULO, e só ele: a descrição é sempre escrita
  // em português pela equipe, independente do idioma do programa.
  language: {
    "Inglês": /\b(the|of|and|for|program|award|contest|competition|challenge|summer|school|scholarship|fellowship|institute|society|academy|youth|student|international|global|university|college|writing|young|camp|internship|research)\b/i,
    "Português": /[áàâãéêíóôõúüç]|\b(bras[íi]l\w*|olimp[íi]ada|nacional|jovem|jovens|competi[çc][ãa]o|programa)\b/i,
  },
};

function evidenciaTexto(o, campo) {
  const texto = campo === "language"
    ? (o.title ?? "")
    : `${o.title ?? ""} ${o.eligibility ?? ""} ${o.description ?? ""} ${o.additionals ?? ""}`;
  const achados = [];
  for (const [rotulo, re] of Object.entries(EVIDENCIA[campo] ?? {})) if (re.test(texto)) achados.push(rotulo);
  return achados;
}

function omissaoConflito(campo) {
  let comEvidencia = 0, omitidas = 0, conflitantes = 0;
  const exemplos = [];
  for (const o of corpus) {
    const ev = evidenciaTexto(o, campo);
    if (!ev.length) continue;
    comEvidencia++;
    const declarado = arr(o[campo]).map((v) => String(v).trim());
    if (!declarado.length) {
      omitidas++;
      if (exemplos.length < 5) exemplos.push(`${o.title?.slice(0, 46)} → texto sugere ${ev.join("/")}`);
    } else if (!ev.some((e) => declarado.some((d) => d.includes(e) || e.includes(d)))) {
      conflitantes++;
    }
  }
  return { comEvidencia, omitidas, conflitantes, exemplos };
}

// ── 6. viés de anotação ─────────────────────────────────────────────────────
// Um campo 45% preenchido de forma aleatória é ruído. Um campo 45% preenchido
// só de UM LADO é viés — e qualquer boost construído sobre ele favorece esse
// lado sistematicamente. É o caso de `language` hoje.
function viesAnotacao(campo, particao) {
  const grupos = {};
  for (const o of corpus) {
    const g = particao(o);
    grupos[g] ??= { total: 0, preenchidas: 0 };
    grupos[g].total++;
    if (arr(o[campo]).length) grupos[g].preenchidas++;
  }
  return Object.fromEntries(Object.entries(grupos).map(([g, v]) => [g, { ...v, coverage: v.preenchidas / v.total }]));
}

// ── 7. índice de utilidade ──────────────────────────────────────────────────
//   utilidade = coverage × discriminância × (1 − redundância)
// Não é lei da física; é um jeito de ordenar o trabalho em uma linha por
// campo. Um campo com 100% de coverage e um único valor tem utilidade ~0, e
// é verdade: ele não separa nada.
function utilidade(campo, redund = 0) {
  const v = vocabulario(campo);
  return coverage(campo) * v.discriminancia * (1 - redund);
}

// ═══════════════════════════════════════════════════════════════════════════
const CAMPOS = ["type", "areas", "keywords", "level", "audience", "cost", "language", "location", "format"];
const REDUNDANCIAS = [["location", "format"], ["level", "audience"], ["areas", "keywords"], ["type", "areas"]];

const relatorio = { n, campos: {}, redundancia: {}, vies: {} };
for (const c of CAMPOS) {
  const v = vocabulario(c);
  const card = cardinalidade(c);
  const oc = EVIDENCIA[c] ? omissaoConflito(c) : null;
  const red = c === "location" ? redundancia("location", "format").fracao
    : c === "keywords" ? redundancia("keywords", "areas").fracao : 0;
  relatorio.campos[c] = {
    coverage: coverage(c), vocabulario: v.V, efetiva: v.efetiva, discriminancia: v.discriminancia,
    top2: v.top2, cardinalidadeMedia: card.media, distCardinalidade: card.distribuicao,
    omissaoConflito: oc, utilidade: utilidade(c, red), valores: v.ordenado.slice(0, 12),
  };
}
for (const [a, b] of REDUNDANCIAS) relatorio.redundancia[`${a}×${b}`] = redundancia(a, b);

const ehBrasileiro = (o) => /[áàâãéêíóôõúüç]/i.test(o.title ?? "") || /bras[íi]l|olimp[íi]ada|nacional/i.test(o.title ?? "");
relatorio.vies.language = viesAnotacao("language", (o) => (ehBrasileiro(o) ? "cara de brasileiro" : "cara de estrangeiro"));
relatorio.vies.audience = viesAnotacao("audience", (o) => (evidenciaTexto(o, "audience").length ? "texto menciona recorte" : "texto não menciona"));

if (JSONMODE) { console.log(JSON.stringify(relatorio, null, 2)); process.exit(0); }

console.log(`Catálogo: ${n} oportunidades 'Aprovada'\n`);
console.log("QUALIDADE DE CAMPO  (utilidade = cobertura × discriminância × (1 − redundância))\n");
console.log("  campo        cob.   vocab  efetiva  discr.  rót/linha  utilidade");
for (const [c, m] of Object.entries(relatorio.campos)) {
  console.log(`  ${c.padEnd(11)} ${pct(m.coverage * n).padStart(5)}  ${String(m.vocabulario).padStart(5)}  ${num(m.efetiva).padStart(7)}  ${num(m.discriminancia).padStart(6)}  ${num(m.cardinalidadeMedia).padStart(9)}  ${num(m.utilidade).padStart(9)}`);
}

console.log("\nREDUNDÂNCIA ENTRE CAMPOS  (fração de linhas com valor idêntico)");
for (const [par, r] of Object.entries(relatorio.redundancia)) {
  console.log(`  ${par.padEnd(20)} ${pct(r.fracao * 100, 100).padStart(5)}  (${r.iguais}/${r.base} linhas com os dois preenchidos)`);
}

console.log("\nOMISSÃO E CONFLITO CONTRA O TEXTO");
for (const [c, m] of Object.entries(relatorio.campos)) {
  if (!m.omissaoConflito) continue;
  const o = m.omissaoConflito;
  console.log(`  ${c}: ${o.comEvidencia} linhas com evidência no texto → ${o.omitidas} omitidas (campo vazio), ${o.conflitantes} conflitantes`);
  for (const e of o.exemplos) console.log(`      · ${e}`);
}

console.log("\nVIÉS DE ANOTAÇÃO  (a cobertura é a mesma nos dois lados?)");
for (const [c, grupos] of Object.entries(relatorio.vies)) {
  console.log(`  ${c}:`);
  for (const [g, v] of Object.entries(grupos)) console.log(`      ${g.padEnd(24)} ${pct(v.preenchidas, v.total).padStart(5)}  (${v.preenchidas}/${v.total})`);
}
