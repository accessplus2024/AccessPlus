const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL;
const EMBEDDING_DIMENSIONS = Number(process.env.EMBEDDING_DIMENSIONS);

export async function embedTexts(texts, inputType) {
  if (!texts.length) return [];
  const response = await fetch("https://integrate.api.nvidia.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${NVIDIA_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: texts,
      model: `nvidia/${EMBEDDING_MODEL}`,
      input_type: inputType,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  });

  if (!response.ok) {
    throw new Error(`NIM respondeu ${response.status}: ${await response.text()}`);
  }
  const data = await response.json();
  return data.data.map((item) => item.embedding);
}

/**
 * Alias curto usado pelo pipeline novo. Faz UMA chamada para o lote inteiro —
 * a busca multi-aspecto embedda 5 a 7 consultas por requisição, e mandá-las
 * juntas é a diferença entre uma ida à rede e sete.
 */
export const embed = (texts, inputType) => embedTexts(texts, inputType);

export function cosine(a, b) {
  // Sem esta checagem, comparar vetores de dimensões diferentes devolve NaN em
  // vez de erro — e NaN em ranking é ordem aleatória, silenciosa.
  if (!a || !b || a.length !== b.length) {
    throw new Error(`cosine: dimensões incompatíveis (${a?.length} vs ${b?.length}). Índice desatualizado — rode \`npm run embed\`.`);
  }
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-12);
}
