const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL;
const EMBEDDING_DIMENSIONS = Number(process.env.EMBEDDING_DIMENSIONS);

  console.log("[debug] NVIDIA_API_KEY:", NVIDIA_API_KEY ? `${NVIDIA_API_KEY.slice(0, 8)}...(len=${NVIDIA_API_KEY.length})` : "UNDEFINED");
console.log("[debug] EMBEDDING_MODEL:", JSON.stringify(EMBEDDING_MODEL));
console.log("[debug] EMBEDDING_DIMENSIONS:", EMBEDDING_DIMENSIONS);

export async function embedTexts(texts, inputType) {
  const response = await fetch("https://integrate.api.nvidia.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${NVIDIA_API_KEY}`,
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
