// Cache em disco de embeddings, com chave = sha1(modelo|input_type|texto).
// Sem isso, cada rodada de ablação re-embeddaria 295 passagens + 30 bios —
// caro, lento, e faz a gente evitar de rodar o teste 3x como deveria.
import { createHash } from "crypto";
import { readFileSync, writeFileSync, existsSync } from "fs";
import dotenv from "dotenv";
dotenv.config({ path: new URL("../.env", import.meta.url).pathname, quiet: true });

const MODEL = process.env.EMBEDDING_MODEL;
const DIMS = Number(process.env.EMBEDDING_DIMENSIONS);
const KEY = process.env.NVIDIA_API_KEY;
const CACHE = new URL("./cache/embeddings.json", import.meta.url).pathname;

let cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, "utf8")) : {};
let sujo = false;

const hash = (t, tipo) => createHash("sha1").update(`${MODEL}|${DIMS}|${tipo}|${t}`).digest("hex");

async function chamarNim(texts, inputType) {
  const r = await fetch("https://integrate.api.nvidia.com/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ input: texts, model: `nvidia/${MODEL}`, input_type: inputType, dimensions: DIMS }),
  });
  if (!r.ok) throw new Error(`NIM ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const d = await r.json();
  return d.data.map((x) => x.embedding);
}

export function salvarCache() {
  if (sujo) { writeFileSync(CACHE, JSON.stringify(cache)); sujo = false; }
}

export async function embed(texts, inputType, { batch = 16 } = {}) {
  const faltando = [];
  for (const t of texts) if (!cache[hash(t, inputType)]) faltando.push(t);
  const unicos = [...new Set(faltando)];
  for (let i = 0; i < unicos.length; i += batch) {
    const lote = unicos.slice(i, i + batch);
    let vectors;
    for (let tentativa = 1; ; tentativa++) {
      try { vectors = await chamarNim(lote, inputType); break; }
      catch (e) {
        if (tentativa >= 4) throw e;
        await new Promise((r) => setTimeout(r, 1500 * tentativa));
      }
    }
    lote.forEach((t, j) => { cache[hash(t, inputType)] = vectors[j]; });
    sujo = true;
    if (i % (batch * 5) === 0) salvarCache();
    process.stderr.write(`\r[embed] ${Math.min(i + batch, unicos.length)}/${unicos.length} (${inputType})   `);
  }
  if (unicos.length) { salvarCache(); process.stderr.write("\n"); }
  return texts.map((t) => cache[hash(t, inputType)]);
}

export function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-12);
}
