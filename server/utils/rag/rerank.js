const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
// Exportado (não só local) pra poder aparecer em mensagens de erro e logs
// sem duplicar a string em outro arquivo — ver Semana 11 do plano.
export const RERANK_MODEL = "llama-nemotron-rerank-vl-1b-v2";
const RERANK_URL = `https://ai.api.nvidia.com/v1/retrieval/nvidia/${RERANK_MODEL}/reranking`;

// Reordena uma lista de passagens de texto pela relevância real em relação
// à query, usando um cross-encoder (considera query+passagem juntas, ao
// contrário da busca vetorial, que embedda cada uma separadamente antes de
// comparar). Mais caro por item, mas muito mais preciso — por isso só roda
// sobre os ~20 candidates que já sobreviveram à fusão RRF, não o corpus todo.
export async function rerank(query, passages) {
  const response = await fetch(RERANK_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${NVIDIA_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: `nvidia/${RERANK_MODEL}`,
      query: { text: query },
      passages: passages.map((text) => ({ text })),
    }),
  });

  if (!response.ok) {
    throw new Error(`Rerank NIM respondeu ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();

  // data.rankings vem como [{ index, logit }] — "index" se refere à posição
  // original no array "passages" que enviamos, não à ordem de relevância.
  // Precisamos ordenar nós mesmos, do logit mais alto (mais relevante) pro
  // mais baixo.
  return data.rankings.slice().sort((a, b) => b.logit - a.logit);
}
