import { createHash } from "crypto";
import { readFileSync, writeFileSync, existsSync } from "fs";
import dotenv from "dotenv";
dotenv.config({ path: new URL("../.env", import.meta.url).pathname, quiet: true });

const KEY = process.env.NVIDIA_API_KEY;
export const RERANK_MODEL = "llama-nemotron-rerank-vl-1b-v2";
const URL_RERANK = `https://ai.api.nvidia.com/v1/retrieval/nvidia/${RERANK_MODEL}/reranking`;
const CACHE = new URL("./cache/rerank.json", import.meta.url).pathname;
let cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, "utf8")) : {};
// LAB_SEM_CACHE=1 desliga o cache para que N rodadas do golden set sejam
// N chamadas de API independentes. Sem isso, "3 rodadas" repetiriam o mesmo
// resultado em cache e nao mediriam estabilidade nenhuma.
const SEM_CACHE = process.env.LAB_SEM_CACHE === "1";

export async function rerank(query, passages) {
  const chave = createHash("sha1").update(`${RERANK_MODEL}|${query}|${passages.join(" ")}`).digest("hex");
  if (!SEM_CACHE && cache[chave]) return cache[chave];
  let data;
  for (let t = 1; ; t++) {
    const r = await fetch(URL_RERANK, {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: `nvidia/${RERANK_MODEL}`, query: { text: query }, passages: passages.map((text) => ({ text })) }),
    });
    if (r.ok) { data = await r.json(); break; }
    if (t >= 4) throw new Error(`Rerank ${r.status}: ${(await r.text()).slice(0, 200)}`);
    await new Promise((res) => setTimeout(res, 1500 * t));
  }
  const out = data.rankings.slice().sort((a, b) => b.logit - a.logit);
  if (!SEM_CACHE) { cache[chave] = out; writeFileSync(CACHE, JSON.stringify(cache)); }
  return out;
}
