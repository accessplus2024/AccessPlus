export function recallAtK(ranked, relevantes, k) {
  if (!relevantes.length) return null;
  const top = new Set(ranked.slice(0, k));
  return relevantes.filter((id) => top.has(id)).length / relevantes.length;
}
export function precisionAtK(ranked, relevantes, k) {
  if (!relevantes.length) return null;
  const rel = new Set(relevantes);
  const top = ranked.slice(0, k);
  if (!top.length) return 0;
  return top.filter((id) => rel.has(id)).length / top.length;
}
export function ndcgAtK(ranked, relevantes, k) {
  if (!relevantes.length) return null;
  const rel = new Set(relevantes);
  let dcg = 0;
  ranked.slice(0, k).forEach((id, i) => { if (rel.has(id)) dcg += 1 / Math.log2(i + 2); });
  let idcg = 0;
  for (let i = 0; i < Math.min(k, relevantes.length); i++) idcg += 1 / Math.log2(i + 2);
  return idcg ? dcg / idcg : null;
}
export function reciprocalRank(ranked, relevantes) {
  if (!relevantes.length) return null;
  const rel = new Set(relevantes);
  for (let i = 0; i < ranked.length; i++) if (rel.has(ranked[i])) return 1 / (i + 1);
  return 0;
}
// Recall "atingível": quando o perfil tem 21 relevantes, é matematicamente
// impossível caber tudo em 10 posições. Normaliza pelo máximo possível, pra
// separar "o ranking errou" de "o k é pequeno demais pro caso".
export function recallAtingivelAtK(ranked, relevantes, k) {
  if (!relevantes.length) return null;
  const top = new Set(ranked.slice(0, k));
  const acertos = relevantes.filter((id) => top.has(id)).length;
  return acertos / Math.min(k, relevantes.length);
}
export const average = (vals) => {
  const v = vals.filter((x) => x !== null && x !== undefined && !Number.isNaN(x));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};
