// Reranking por LLM (listwise). O cross-encoder de 1B da NIM
// (llama-nemotron-rerank-vl-1b-v2) empacou em ~0.67 de recall@10 mesmo com o
// pool de candidatos contendo 0.84 - ou seja, ele nao consegue separar
// "relevante de verdade pra ESTE aluno" de "fala do mesmo assunto".
// Julgamento assim (nivel escolar compativel? elegibilidade permite? o
// idioma e uma barreira real? o custo cabe?) e exatamente o que um LLM faz
// bem e um cross-encoder pequeno nao faz.
//
// Formato listwise (todos os candidatos numa chamada, notas de 0 a 3) em vez
// de pointwise (uma chamada por candidato): 1 requisicao em vez de 30, e o
// modelo compara os itens entre si, que e o que produz uma ordem boa.
import dotenv from "dotenv";
import { createHash } from "crypto";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { derivedSignals } from "./signals.mjs";
import "./cache-dir.mjs";
dotenv.config({ path: new URL("../.env", import.meta.url).pathname, quiet: true });

const CACHE = new URL("./cache/judge.json", import.meta.url).pathname;
let cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, "utf8")) : {};

export const PROVEDORES = {
  nim: {
    url: "https://integrate.api.nvidia.com/v1/chat/completions",
    key: () => process.env.NVIDIA_API_KEY,
  },
  cerebras: {
    url: "https://api.cerebras.ai/v1/chat/completions",
    key: () => process.env.CEREBRAS_API_KEY,
  },
};

const SYSTEM = `Você avalia relevância de oportunidades extracurriculares para um estudante brasileiro, no contexto da AccessPlus (público de 11 a 18 anos, maioria de escola pública e baixa renda, muitos primeira geração a acessar esse tipo de coisa).

Dê uma nota de 0 a 3 para CADA oportunidade da lista:
3 = encaixe forte: é sobre o que o estudante disse que quer, e ele pode de fato participar (nível escolar, elegibilidade, idioma e custo compatíveis)
2 = encaixe razoável: é da área/tipo que ele quer, com alguma ressalva menor
1 = tangencial: só encosta no assunto, ou tem barreira concreta (idioma que ele não domina, custo que ele não tem, presencial fora do país quando ele disse que não pode viajar)
0 = não serve: nível escolar incompatível, elegibilidade exclui, ou nada a ver com o que ele pediu

REGRAS QUE NÃO PODEM SER QUEBRADAS
- Julgue pelo que o estudante ESCREVEU, não pelo prestígio do programa. Harvard não vale 3 se o estudante pediu olimpíada de biologia no Brasil.
- Negação conta: "nunca pensei em estudar fora", "não tenho condição de viajar" torna programa presencial no exterior nota 1, não 3.
- Inglês fraco declarado torna programa em inglês nota 1 ou 2, nunca 3.
- Elegibilidade vence tema: se o campo "quem pode participar" exclui o estudante, é 0, mesmo que o tema combine perfeitamente.
- Ausência de dado nunca é motivo pra baixar nota. Campo vazio = neutro.

SAÍDA: apenas JSON válido, sem texto antes ou depois:
{"notas": [{"id": 123, "n": 3}, {"id": 456, "n": 1}]}
Inclua TODOS os ids recebidos, exatamente uma vez cada.`;

function ficha(o) {
  const s = derivedSignals(o);
  const arr = (v) => (Array.isArray(v) ? v.filter(Boolean).join("/") : v || "");
  const bits = [
    `id ${o.id}`,
    o.title,
    o.type ? `tipo: ${o.type}` : "",
    arr(o.areas) ? `áreas: ${arr(o.areas)}` : "",
    arr(o.level) ? `nível: ${arr(o.level)}` : "",
    o.cost ? `custo: ${o.cost}` : "",
    s.provavelPortugues ? "em português" : s.provavelIngles ? "em inglês" : "",
    s.brasileiro ? "brasileiro" : s.presencialForaDoBrasil ? "presencial fora do Brasil" : "",
    o.eligibility ? `quem pode: ${String(o.eligibility).slice(0, 180)}` : "",
    o.description ? `sobre: ${String(o.description).slice(0, 200)}` : "",
  ].filter(Boolean);
  return `- ${bits.join(" | ")}`;
}

export async function julgar(perfilTexto, candidates, { provedor = "nim", modelo = "nvidia/nemotron-3.5-lightning-30b-a3b", lote = 20 } = {}) {
  const notas = new Map();
  for (let i = 0; i < candidates.length; i += lote) {
    const bloco = candidates.slice(i, i + lote);
    const userMsg = `Estudante: "${perfilTexto}"\n\nOportunidades para avaliar:\n${bloco.map(ficha).join("\n")}`;
    const chave = createHash("sha1").update(`${provedor}|${modelo}|${SYSTEM}|${userMsg}`).digest("hex");

    let parsed = cache[chave];
    if (!parsed) {
      const p = PROVEDORES[provedor];
      let raw = null;
      for (let t = 1; t <= 3; t++) {
        try {
          const r = await fetch(p.url, {
            method: "POST",
            headers: { Authorization: `Bearer ${p.key()}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: modelo,
              messages: [{ role: "system", content: SYSTEM }, { role: "user", content: userMsg }],
              temperature: 0,
              max_tokens: 2000,
              response_format: { type: "json_object" },
            }),
          });
          if (!r.ok) throw new Error(`${r.status} ${(await r.text()).slice(0, 200)}`);
          const d = await r.json();
          raw = d.choices?.[0]?.message?.content ?? "";
          break;
        } catch (e) {
          if (t === 3) { console.error("[judge] falhou:", e.message); raw = null; }
          else await new Promise((res) => setTimeout(res, 1200 * t));
        }
      }
      if (raw === null) continue; // degrada: sem notas desse bloco, ordem anterior vale
      try {
        parsed = JSON.parse(raw);
      } catch {
        const m = raw.match(/\{[\s\S]*\}/);
        if (!m) continue;
        try { parsed = JSON.parse(m[0]); } catch { continue; }
      }
      cache[chave] = parsed;
      writeFileSync(CACHE, JSON.stringify(cache));
    }
    for (const item of parsed.notas ?? []) {
      const id = Number(item.id);
      const n = Number(item.n);
      if (Number.isFinite(id) && Number.isFinite(n)) notas.set(id, Math.max(0, Math.min(3, n)));
    }
  }
  return notas;
}
