// Métricas de recuperação (Parte 8 do plano). Escritas à mão de propósito —
// o objetivo (Parte 5.7) é entender o que cada número mede, não importar
// uma lib. São ~50 linhas de matemática, como o plano previu.
//
// Todas as funções recebem "rankedIds": um array de ids de oportunidade na
// ordem em que a Accessia os mostraria ao aluno (já depois do rerank), e
// "relevantIds": os ids que o golden set diz que DEVERIAM aparecer.

// recall@k — dos itens relevantes que EXISTEM, quantos apareceram nos
// primeiros k resultados? Esta é a métrica PRINCIPAL do projeto (Parte 1:
// esconder uma oportunidade real custa mais caro que mostrar uma errada).
export function recallAtK(rankedIds, relevantIds, k) {
  if (relevantIds.length === 0) return null; // nada pra medir
  const topK = new Set(rankedIds.slice(0, k));
  const found = relevantIds.filter((id) => topK.has(id)).length;
  return found / relevantIds.length;
}

// precision@k — dos k primeiros resultados MOSTRADOS, quantos eram
// relevantes? Não penaliza um relevante que ficou de fora do top-k (isso é
// papel do recall) — mede só "o que aparece primeiro é bom?".
export function precisionAtK(rankedIds, relevantIds, k) {
  const topK = rankedIds.slice(0, k);
  if (topK.length === 0) return null;
  const relevantSet = new Set(relevantIds);
  const relevantInTopK = topK.filter((id) => relevantSet.has(id)).length;
  return relevantInTopK / topK.length;
}

// Reciprocal Rank de UM caso — 1 dividido pela posição do primeiro item
// relevante encontrado (posição 1 → 1.0, posição 4 → 0.25). Prêmia
// aparecer relevante bem no topo, não só "em algum lugar no top-k".
// A média disso ao longo de todos os perfis do golden set é o MRR.
export function reciprocalRank(rankedIds, relevantIds) {
  const relevantSet = new Set(relevantIds);
  for (let i = 0; i < rankedIds.length; i++) {
    if (relevantSet.has(rankedIds[i])) return 1 / (i + 1);
  }
  return 0; // nenhum relevante apareceu em nenhuma posição
}

// NDCG@k (Normalized Discounted Cumulative Gain) — parecido com recall, mas
// pondera POSIÇÃO: um relevante na posição 1 vale mais que um na posição 9.
// "Discounted" = desconta o valor de cada acerto por log2(posição+1);
// "Normalized" = divide pelo DCG do ranking perfeito (IDCG), pra dar um
// número de 0 a 1 comparável entre perfis com número diferente de
// relevantes esperados.
export function ndcgAtK(rankedIds, relevantIds, k) {
  const relevantSet = new Set(relevantIds);
  const topK = rankedIds.slice(0, k);

  let dcg = 0;
  topK.forEach((id, index) => {
    const relevancia = relevantSet.has(id) ? 1 : 0; // relevância binária: aparece ou não
    const posicao = index + 1;
    dcg += relevancia / Math.log2(posicao + 1);
  });

  // IDCG: o DCG que você teria se TODOS os relevantes viessem primeiro,
  // na ordem ideal possível.
  const quantosRelevantesCabem = Math.min(relevantIds.length, k);
  let idcg = 0;
  for (let posicao = 1; posicao <= quantosRelevantesCabem; posicao++) {
    idcg += 1 / Math.log2(posicao + 1);
  }

  if (idcg === 0) return null; // sem relevantes esperados, não dá pra normalizar
  return dcg / idcg;
}

// "Violação de barreira" (Parte 8) — fração dos recomendados que quebram
// uma restrição que o ALUNO marcou (ex: "preciso que seja gratuito" e
// apareceu um programa pago). Ao contrário das outras métricas, aqui
// MENOR é melhor. `checkFn` recebe uma oportunidade e devolve true se ELA
// viola a restrição daquele perfil.
export function barrierViolationRate(recommendedOpportunities, checkFn) {
  if (recommendedOpportunities.length === 0) return null;
  const violacoes = recommendedOpportunities.filter(checkFn).length;
  return violacoes / recommendedOpportunities.length;
}

export function average(numbers) {
  const validos = numbers.filter((n) => n !== null && n !== undefined && !Number.isNaN(n));
  if (validos.length === 0) return null;
  return validos.reduce((soma, n) => soma + n, 0) / validos.length;
}