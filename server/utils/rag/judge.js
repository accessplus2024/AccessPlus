// Reranking por LLM (listwise). Substitui, como sinal principal de ordenação,
// o cross-encoder de 1B da NIM (`llama-nemotron-rerank-vl-1b-v2`).
//
// Por que trocar: medido no golden set (30 perfis reais), o pool de
// candidates gerado pela busca já continha 84% dos relevantes em @30+@30 e
// 93% em @60+@60 — mas só ~67% chegavam ao topo-10, e esse número não se
// movia com NENHUMA combinação de pesos de fusão, size de pool ou peso de
// rerank testada (36 configurações varridas, todas entre 0.60 e 0.67). Isso
// é a assinatura de um teto de MODELO, não de configuração: um cross-encoder
// de 1B mede semelhança de assunto, e o que falta aqui é julgamento — "esse
// aluno, com 13 anos, no 7º ano, inglês fraco, sem poder viajar, consegue de
// fato participar disto?".
//
// Formato listwise (todos os candidatos de um lote numa chamada, notas de 0 a
// 3) em vez de pointwise (uma chamada por candidato): 3 requisições em vez de
// 30, e o modelo compara os itens entre si, que é o que produz ordem boa.
//
// Modelo: `openai/gpt-oss-20b` na MESMA chave NIM do resto do pipeline. Os
// outros testados e por que não: `nvidia/nemotron-3.5-lightning-30b-a3b`
// devolveu 2 notas de 30 (truncava); `nvidia/nvidia-nemotron-nano-9b-v2`, 10
// de 30; `openai/gpt-oss-120b` acertou as 30 mas levou 204s; Cerebras
// (gpt-oss-120b, chave já no .env) responde em 8s mas a conta está sem
// crédito (`payment_required`) — vale reavaliar se isso mudar, é a opção
// mais rápida por uma margem grande.

const CHAT_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
export const JUIZ_MODEL = process.env.NIM_JUDGE_MODEL || "openai/gpt-oss-20b";

import { derivedSignals } from "./signals.js";

const SYSTEM = `Você avalia se oportunidades extracurriculares servem para um estudante brasileiro específico. Público da AccessPlus: 11 a 18 anos, maioria de escola pública e baixa renda, muitos primeira geração da família a acessar isso.

Para CADA item da lista, na ordem, dê uma nota:
3 = serve muito: é sobre o que ele pediu E ele pode participar (nível, elegibilidade, idioma e custo compatíveis)
2 = serve com ressalva menor
1 = tangencial, ou tem barreira concreta (idioma que ele não domina, presencial fora do país quando ele não pode viajar, custo que ele não tem)
0 = não serve: nível escolar incompatível, elegibilidade o exclui, ou nada a ver com o pedido

REGRAS
1. Julgue pelo que ele ESCREVEU, não pelo prestígio do programa — Harvard não vale 3 se ele pediu olimpíada de biologia no Brasil.
2. Negação conta: "nunca pensei em estudar fora", "não tenho condição de viajar" torna programa presencial no exterior nota 1, não 3.
3. Inglês fraco declarado → programa em inglês nunca é 3.
4. Elegibilidade vence tema: se o campo "pode" exclui o estudante, é 0, mesmo que o assunto combine perfeitamente.
5. Programa cujo PROPÓSITO INTEIRO é preparar ou levar o aluno para cursar a GRADUAÇÃO INTEIRA no exterior (preparatório para faculdade fora, bolsa de graduação no exterior) vale no máximo 1, A NÃO SER que o estudante tenha dito explicitamente que quer fazer faculdade/graduação fora do Brasil. Isso NÃO é a mesma coisa que intercâmbio curto ou programa de verão, que continuam valendo pela relevância normal.
6. Campo vazio é neutro, nunca motivo pra baixar nota.

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

async function julgarLote(perfilTexto, bloco, modelo) {
  const userMsg = `Estudante: "${perfilTexto}"\n\nItens (${bloco.length}):\n${bloco.map(ficha).join("\n")}\n\nDê ${bloco.length} notas.`;

  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    try {
      const r = await fetch(CHAT_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: modelo,
          messages: [
            { role: "system", content: SYSTEM },
            { role: "user", content: userMsg },
          ],
          temperature: 0,
          // 2600, não 400: os modelos gpt-oss/nemotron gastam orçamento de
          // tokens em raciocínio ANTES de emitir o content. Com 400, o
          // content voltava string vazia e todo lote caía em "sem JSON" —
          // silenciosamente, porque a resposta HTTP era 200.
          max_tokens: 2600,
          chat_template_kwargs: { reasoning_effort: "low" },
          response_format: { type: "json_object" },
        }),
      });
      if (!r.ok) throw new Error(`${r.status} ${(await r.text()).slice(0, 150)}`);
      const d = await r.json();
      const raw = d.choices?.[0]?.message?.content ?? "";

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        const m = raw.match(/\{[\s\S]*\}/);
        if (!m) throw new Error("resposta sem JSON");
        parsed = JSON.parse(m[0]);
      }
      const notas = Array.isArray(parsed.n) ? parsed.n : Array.isArray(parsed) ? parsed : null;
      // Saída tersa economiza latência mas cria um risco: array de size
      // diferente da lista desalinha TODAS as notas. Descartar o lote inteiro
      // é a única resposta segura — reordenar por notas deslocadas seria pior
      // que não reordenar.
      if (!notas || notas.length !== bloco.length) throw new Error(`tamanho ${notas?.length} != ${bloco.length}`);
      return notas;
    } catch (e) {
      if (tentativa === 3) {
        console.error(`[juiz] lote de ${bloco.length} falhou depois de 3 tentativas: ${e.message}`);
        return null;
      }
      await new Promise((res) => setTimeout(res, 900 * tentativa));
    }
  }
}

/**
 * @returns {Promise<Map<number, number>>} id da oportunidade -> nota 0..3.
 *   Lote que falha simplesmente não aparece no Map — quem chama trata
 *   ausência de nota como "sem opinião" e mantém a ordem anterior. Nunca
 *   deixa a busca inteira cair por causa desta etapa.
 */
export async function judgeRelevance(perfilTexto, candidates, { modelo = JUIZ_MODEL, lote = 10 } = {}) {
  if (!candidates.length) return new Map();
  const blocos = [];
  for (let i = 0; i < candidates.length; i += lote) blocos.push(candidates.slice(i, i + lote));

  const results = await Promise.all(blocos.map((b) => julgarLote(perfilTexto, b, modelo)));

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
