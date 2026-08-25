// Versao otimizada do juiz LLM. Duas mudancas que valem latencia:
//  1. SAIDA TERSA: um array de inteiros na mesma ordem da lista, em vez de
//     [{"id":123,"n":3}]. Corta ~85% dos tokens de saida - e tokens de saida
//     sao o que domina a latencia (45s -> alguns segundos).
//  2. LOTES EM PARALELO: 3 chamadas de 8-10 itens simultaneas em vez de 1
//     chamada de 30 sequencial.
// O risco da saida tersa e desalinhamento (modelo devolve menos itens que a
// lista); tratamos isso explicitamente - array de size errado e descartado
// e o lote degrada pra "sem nota", nunca reordena errado.
import dotenv from "dotenv";
import { createHash } from "crypto";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { derivedSignals } from "./signals.mjs";
dotenv.config({ path: new URL("../.env", import.meta.url).pathname, quiet: true });

const CACHE = new URL("./cache/judge2.json", import.meta.url).pathname;
let cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, "utf8")) : {};

const SYSTEM = `Você avalia se oportunidades extracurriculares servem para um estudante brasileiro específico. Público da AccessPlus: 11 a 18 anos, maioria de escola pública e baixa renda, muitos primeira geração da família a acessar isso.

Para CADA item da lista, na ordem, dê uma nota:
3 = serve muito: é sobre o que ele pediu E ele pode participar (nível, elegibilidade, idioma e custo compatíveis)
2 = serve com ressalva menor
1 = tangencial, ou tem barreira concreta (idioma que ele não domina, presencial fora do país quando ele não pode viajar, custo que ele não tem)
0 = não serve: nível escolar incompatível, elegibilidade o exclui, ou nada a ver com o pedido

Regras: julgue pelo que ele ESCREVEU, não pelo prestígio do programa. Negação conta ("nunca pensei em estudar fora" → presencial no exterior é 1). Inglês fraco declarado → programa em inglês nunca é 3. Elegibilidade vence tema. Campo vazio é neutro, nunca motivo pra baixar nota.

SAÍDA: só um array JSON de inteiros, um por item, na mesma ordem, mesmo tamanho da lista. Nada mais.
Exemplo para 4 itens: {"n":[3,1,0,2]}`;

function ficha(o, i) {
  const s = derivedSignals(o);
  const j = (v) => (Array.isArray(v) ? v.filter(Boolean).join("/") : v || "");
  const bits = [
    o.title,
    o.type,
    j(o.areas),
    j(o.level) ? `nível ${j(o.level)}` : "",
    o.cost,
    s.provavelPortugues ? "português" : s.provavelIngles ? "inglês" : "",
    s.brasileiro ? "Brasil" : s.presencialForaDoBrasil ? "presencial no exterior" : "",
    o.eligibility ? `pode: ${String(o.eligibility).slice(0, 130)}` : "",
    o.description ? String(o.description).slice(0, 150) : "",
  ].filter(Boolean);
  return `${i + 1}. ${bits.join(" | ")}`;
}

async function chamarLote(perfilTexto, bloco, modelo) {
  const userMsg = `Estudante: "${perfilTexto}"\n\nItens (${bloco.length}):\n${bloco.map(ficha).join("\n")}\n\nDê ${bloco.length} notas.`;
  const chave = createHash("sha1").update(`v2|${modelo}|${userMsg}`).digest("hex");
  if (cache[chave]) return cache[chave];

  for (let t = 1; t <= 3; t++) {
    try {
      const r = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: modelo,
          messages: [{ role: "system", content: SYSTEM }, { role: "user", content: userMsg }],
          temperature: 0,
          max_tokens: 2600,
          // gpt-oss/nemotron gastam orcamento de tokens em raciocinio ANTES
          // do content; com 400 o content voltava vazio ("sem JSON").
          chat_template_kwargs: { reasoning_effort: "low" },
          response_format: { type: "json_object" },
        }),
      });
      if (!r.ok) throw new Error(`${r.status} ${(await r.text()).slice(0, 150)}`);
      const d = await r.json();
      const raw = d.choices?.[0]?.message?.content ?? "";
      let parsed;
      try { parsed = JSON.parse(raw); }
      catch { const m = raw.match(/\{[\s\S]*\}/); if (!m) throw new Error("sem JSON"); parsed = JSON.parse(m[0]); }
      const notas = Array.isArray(parsed.n) ? parsed.n : Array.isArray(parsed) ? parsed : null;
      if (!notas || notas.length !== bloco.length) throw new Error(`tamanho ${notas?.length} != ${bloco.length}`);
      cache[chave] = notas;
      writeFileSync(CACHE, JSON.stringify(cache));
      return notas;
    } catch (e) {
      if (t === 3) { console.error(`[judge2] lote falhou (${bloco.length} itens): ${e.message}`); return null; }
      await new Promise((res) => setTimeout(res, 900 * t));
    }
  }
}

export async function julgar2(perfilTexto, candidates, { modelo = "openai/gpt-oss-20b", lote = 10 } = {}) {
  const blocos = [];
  for (let i = 0; i < candidates.length; i += lote) blocos.push(candidates.slice(i, i + lote));
  const results = await Promise.all(blocos.map((b) => chamarLote(perfilTexto, b, modelo)));
  const notas = new Map();
  blocos.forEach((bloco, bi) => {
    const ns = results[bi];
    if (!ns) return;
    bloco.forEach((o, i) => {
      const n = Number(ns[i]);
      if (Number.isFinite(n)) notas.set(o.id, Math.max(0, Math.min(3, n)));
    });
  });
  return notas;
}
