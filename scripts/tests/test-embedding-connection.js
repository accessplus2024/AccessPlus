import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env.embedding") });

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL;
const EMBEDDING_DIMENSIONS = process.env.EMBEDDING_DIMENSIONS;

if (!NVIDIA_API_KEY || !EMBEDDING_MODEL) {
  console.error("Nvidia key or embedding model is missing");
  process.exit(1);
}

async function testEmbedding() {
  const response = await fetch("https://integrate.api.nvidia.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${NVIDIA_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: ["Olimpíada Brasileira de Biologia para estudantes do 9º ano"],
      model: `nvidia/${EMBEDDING_MODEL}`,
      input_type: "query",
      dimensions: Number(EMBEDDING_DIMENSIONS),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`NIM respondeu ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const vector = data.data[0].embedding;

  console.log("✅ Conexão funcionando!");
  console.log("Modelo usado:", data.model);
  console.log("Tamanho do vetor:", vector.length);
  console.log("Primeiros 5 números:", vector.slice(0, 5));
}

testEmbedding().catch((err) => {
  console.error("❌ Erro:", err.message);
  process.exit(1);
});