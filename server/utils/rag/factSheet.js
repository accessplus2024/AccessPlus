// Resposta para "me fala da OBMEP", "qual o prazo da OBA?", "posso participar
// do TechGirls?".
//
// Regra central: TUDO que sai daqui vem de coluna do banco. O LLM entra
// apenas para escolher o que responder primeiro e escrever em linguagem de
// aluno — nunca para preencher lacuna. Se o prazo é nulo no banco, a resposta
// diz "não temos o prazo registrado", não inventa uma data. Prazo inventado
// não é um erro de estilo: é o aluno perdendo a inscrição.
//
// Por isso a ficha estruturada (`buildFactSheet`) é sempre devolvida junto do
// texto: o cliente pode renderizar os campos reais, e o texto do LLM é
// complemento, não a fonte.
import { derivedSignals } from "./signals.js";

const CHAT_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
export const FICHA_MODEL = process.env.NIM_GENERAL_MODEL || "meta/llama-3.1-8b-instruct";

const arr = (v) => (Array.isArray(v) ? v.filter(Boolean) : v ? [v] : []);

function formatarPrazo(deadline) {
  if (!deadline) return null;
  const d = new Date(deadline);
  if (Number.isNaN(d.getTime())) return String(deadline);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

/** Ficha estruturada: só campos reais, com `null` explícito no que falta. */
export function buildFactSheet(o) {
  const s = derivedSignals(o);
  return {
    id: o.id,
    titulo: o.title,
    tipo: o.type ?? null,
    descricao: o.description ?? null,
    quemPodeParticipar: o.eligibility ?? null,
    comoSeInscrever: o.process ?? null,
    detalhesExtras: o.additionals ?? null,
    perfilDeQuemAplica: o.applicants || null,
    areas: arr(o.areas),
    nivel: arr(o.level),
    custo: o.cost ?? null,
    idioma: o.language ?? null,
    idiomaInferido: o.language ? null : s.provavelPortugues ? "provavelmente português" : s.provavelIngles ? "provavelmente inglês" : null,
    local: o.location ?? null,
    formato: o.format ?? null,
    inscricoes: o.inscricoes ?? null,
    prazo: formatarPrazo(o.deadline),
    link: o.link ?? null,
    materiais: arr(o.resources),
    exigeViagemInternacional: s.presencialForaDoBrasil,
    // O que NÃO sabemos, dito explicitamente — para o cliente poder mostrar
    // "não temos esse dado" em vez de omitir e parecer que não existe.
    faltando: [
      !o.deadline && "prazo",
      !o.eligibility && "quem pode participar",
      !o.cost && "custo",
      !o.process && "como se inscrever",
      !o.language && "idioma",
    ].filter(Boolean),
  };
}

const SYSTEM = `Você é a Accessia, assistente da AccessPlus. Um estudante brasileiro (11 a 18 anos, muitos de escola pública, muitos primeira geração da família nesse tipo de oportunidade) perguntou sobre UMA oportunidade específica do catálogo.

REGRAS QUE NÃO PODEM SER QUEBRADAS
1. Você só pode afirmar o que está na FICHA abaixo. Nada de prazo, valor, critério, cidade ou exigência que não esteja escrito ali.
2. Campo marcado como não informado: diga que não está registrado e sugira conferir no link oficial. NUNCA preencha com um valor plausível — um prazo inventado faz o estudante perder a inscrição.
3. Responda primeiro exatamente o que ele perguntou. Se ele perguntou o prazo, a primeira frase é o prazo.
4. Explique jargão na hora que usar ("fellowship", "totalmente financiado", "elegibilidade").
5. Se a ficha diz que exige viagem internacional ou que é em inglês, diga isso claramente — é informação que muda a decisão dele, não detalhe.
6. Português brasileiro, tom caloroso e direto, 2 a 5 frases. Sem listas longas: o cliente já mostra a ficha completa ao lado.

SAÍDA: apenas JSON válido: {"texto": "sua resposta"}`;

export async function answerAboutOpportunity(pergunta, oportunidade) {
  const ficha = buildFactSheet(oportunidade);
  const userMsg = `Pergunta do estudante: "${pergunta}"\n\nFICHA (única fonte permitida):\n${JSON.stringify(ficha, null, 1)}`;

  try {
    const r = await fetch(CHAT_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: FICHA_MODEL,
        messages: [{ role: "system", content: SYSTEM }, { role: "user", content: userMsg }],
        temperature: 0.2,
        max_tokens: 500,
        response_format: { type: "json_object" },
      }),
    });
    if (!r.ok) throw new Error(`${r.status}`);
    const d = await r.json();
    const raw = d.choices?.[0]?.message?.content ?? "";
    let parsed;
    try { parsed = JSON.parse(raw); }
    catch { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : null; }
    if (parsed?.texto) return { ficha, texto: parsed.texto, degraded: false };
    throw new Error("sem texto");
  } catch (e) {
    console.error("[ficha] geração falhou, caindo pro resumo estruturado:", e.message);
    return { ficha, texto: resumoSemLLM(ficha), degraded: true };
  }
}

/**
 * Resumo sem LLM. Não é um "desculpe, tente novamente": é a mesma informação,
 * montada a partir da ficha. Se a NIM estiver fora do ar, o aluno ainda
 * recebe o prazo e o link — que é o que ele foi search.
 */
export function resumoSemLLM(f) {
  const p = [];
  p.push(`${f.titulo}${f.tipo ? ` — ${f.tipo}` : ""}.`);
  if (f.descricao) p.push(f.descricao);
  if (f.quemPodeParticipar) p.push(`Quem pode participar: ${f.quemPodeParticipar}`);
  if (f.custo) p.push(`Custo: ${f.custo}.`);
  if (f.prazo) p.push(`Prazo: ${f.prazo}.`);
  else p.push("O prazo não está registrado no nosso catálogo — confira na página oficial.");
  if (f.inscricoes) p.push(`Inscrições: ${f.inscricoes}.`);
  if (f.exigeViagemInternacional) p.push("Atenção: é presencial fora do Brasil, então exige viagem internacional.");
  if (f.idioma) p.push(`Idioma: ${f.idioma}.`);
  if (f.link) p.push(`Link oficial: ${f.link}`);
  return p.join(" ");
}
