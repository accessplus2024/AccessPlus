import snowball from "snowball-stemmers";
const stemmer = snowball.newStemmer("portuguese");

const fold = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

export const STOPWORDS = new Set(
  ("a o e de da do das dos em um uma uns umas para pra por com sem sob sobre no na nos nas ao aos " +
   "que qual quais quando onde como porque pois mas ou nem se ja nao sim muito mais menos meu minha meus minhas " +
   "seu sua seus suas nosso nossa este esta esse essa isso aquilo eu tu ele ela vos eles elas me te lhe " +
   "ser estar ter haver ir vir ficar to sou estou tenho quero gostaria queria vou " +
   "aqui ali la entao tambem so ate desde entre depois antes ainda cada todo toda todos todas outro outra " +
   "algum alguma alguns algumas existir existe existem tem tinha havia " +
   "the of and for in to an is are with").split(/\s+/)
);

const preNorm = (s) =>
  fold(s.toLowerCase())
    .replace(/coes\b/g, "cao")
    .replace(/oes\b/g, "ao")
    .replace(/aes\b/g, "ao");

export function stem(word) {
  return stemmer.stem(preNorm(word));
}

// A lista de stopwords é comparada com a palavra CRUA. Isso deixava passar
// toda conjugação que não estivesse escrita nela: "ter" estava na lista, mas
// "tem", "têm" e "tinha" não — e "tem" aparece em quase toda descrição do
// catálogo. Efeito medido: "tem alguma olimpíada de biologia?" trazia
// Olimpíada de Informática antes da Olimpíada de Biologia, porque "tem"
// competia com "biologia" pelo score.
//
// Comparar também pelo RADICAL resolve a classe inteira do problema em vez de
// uma conjugação por vez: basta "ter" na lista para "tem/têm/tinha/tiver"
// caírem junto.
const STOPWORDS_RADICAL = new Set([...STOPWORDS].map((w) => stemmer.stem(w)));

export function tokenize(text, { keepStopwords = false } = {}) {
  if (!text) return [];
  const brutos = fold(String(text).toLowerCase()).match(/[a-z0-9]+/g) ?? [];
  const out = [];
  for (const t of brutos) {
    if (t.length < 2) continue;
    if (!keepStopwords && STOPWORDS.has(t)) continue;
    const radical = stem(t);
    if (!keepStopwords && STOPWORDS_RADICAL.has(radical)) continue;
    out.push(radical);
  }
  return out;
}

export const normalizeTitle = (t) => fold(String(t ?? "").toLowerCase()).replace(/\s+/g, " ").trim();
