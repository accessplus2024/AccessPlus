import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env.embedding") });

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL;
const EMBEDDING_DIMENSIONS = Number(process.env.EMBEDDING_DIMENSIONS);

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
    const errorText = await response.text();
    throw new Error(`NIM respondeu ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.data.map((item) => item.embedding);
}