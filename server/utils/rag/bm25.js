// BM25F (BM25 com múltiplos campos) em processo. Por que em JS e não no
// Postgres: (1) a função SQL `match_opportunities_fts` não é versionada e
// indexa só um subconjunto dos campos, (2) o catálogo tem 295 itens — cabe
// inteiro em memória, então não há ganho em delegar isso ao banco, e (3)
// aqui conseguimos pesar campo por campo e medir o efeito de cada peso, que
// é justamente o que precisamos pra subir recall de forma controlada.
//
// BM25 em uma frase: uma palavra vale mais quando é rara no catálogo (IDF) e
// aparece várias vezes num documento curto (saturação por tf com k1/b).
import { tokenize } from "./text.js";

const K1 = 1.2;
const B = 0.75;

export const PESOS_PADRAO = {
  title: 3.2,
  type: 2.6,
  areas: 2.0,
  eligibility: 1.4,
  description: 1.0,
  facets: 0.9,
  extra: 0.35,
};

export function buildIndex(docs, buildFields) {
  const campos = Object.keys(PESOS_PADRAO);
  const postings = new Map(); // termo -> Map(docIdx -> tfPonderado)
  const df = new Map();       // termo -> nº de documentos que contêm o termo
  const compLen = new Array(docs.length).fill(0);

  docs.forEach((doc, i) => {
    const fields = buildFields(doc);
    const tfDoc = new Map();
    let len = 0;
    for (const campo of campos) {
      const peso = PESOS_PADRAO[campo];
      const toks = tokenize(fields[campo]);
      len += toks.length * peso;
      for (const t of toks) tfDoc.set(t, (tfDoc.get(t) ?? 0) + peso);
    }
    compLen[i] = len;
    for (const [t, tf] of tfDoc) {
      if (!postings.has(t)) postings.set(t, new Map());
      postings.get(t).set(i, tf);
      df.set(t, (df.get(t) ?? 0) + 1);
    }
  });

  const avgLen = compLen.reduce((a, b) => a + b, 0) / Math.max(1, docs.length);
  return { docs, postings, df, compLen, avgLen, N: docs.length };
}

// `queryTerms`: array de termos JÁ stemmed, podendo repetir (repetição = peso).
// `boostPorTermo`: Map(termo -> multiplicador) — usado pela expansão de
// consulta pra dar peso menor a sinônimo inferido que a palavra que o aluno
// realmente escreveu.
export function bm25Search(index, queryTerms, { boostPorTermo = null, topK = 50 } = {}) {
  const { postings, df, compLen, avgLen, N } = index;
  const scores = new Map();
  const contagem = new Map();
  for (const t of queryTerms) contagem.set(t, (contagem.get(t) ?? 0) + 1);

  for (const [termo, vezes] of contagem) {
    const post = postings.get(termo);
    if (!post) continue;
    const n = df.get(termo) ?? 0;
    // IDF de Robertson com piso positivo: termo presente em quase todo o
    // catálogo (ex: "estudante") não deve virar score negativo.
    const idf = Math.max(0.05, Math.log(1 + (N - n + 0.5) / (n + 0.5)));
    const mult = (boostPorTermo?.get(termo) ?? 1) * vezes;
    for (const [i, tf] of post) {
      const norm = tf / (1 - B + B * (compLen[i] / avgLen));
      const s = idf * ((norm * (K1 + 1)) / (norm + K1)) * mult;
      scores.set(i, (scores.get(i) ?? 0) + s);
      contagem.size; // no-op
      contagem.get(termo);
    }
  }

  return [...scores.entries()]
    .map(([i, score]) => ({ docIdx: i, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
