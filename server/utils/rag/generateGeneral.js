// Geração para o MODO GERAL (Parte 2 do plano técnico): perguntas anônimas,
// sem login, sem lista de oportunidades reranqueada pra ancorar a resposta
// (isso é o modo match, generate.js). Aqui a Accessia responde dúvidas
// amplas sobre como o processo funciona, sem inventar dado de nenhum
// programa específico — e se a pergunta parece pedir recomendação
// personalizada, ela aponta pro modo "Encontrar oportunidades" em vez de
// tentar adivinhar uma.
//
// IMPORTANTE — o que este arquivo NÃO faz: verificação externa contra a web
// (Parte 5 do plano). Chegou a ser construída em 2026-08-24 usando Gemini +
// busca do Google, mas exigia conta de faturamento do Google Cloud pra
// funcionar (o tier gratuito não inclui a ferramenta de busca) — a
// mantenedora não pode gastar dinheiro nisso, então foi desligada de volta
// (ver `verifyExternal.js` e `docs/decisions.md`, 2026-08-24). Se a pergunta
// não bate com nada do catálogo nem é resolvível com conhecimento geral
// seguro, a resposta certa é dizer que não sabe, nunca inventar.
//
// 2026-08-24: voltou de Gemini pra NIM (mesma `NVIDIA_API_KEY` do resto do
// pipeline, sem credencial nova) — a pedido direto da mantenedora, pra não
// depender de dois provedores de IA diferentes. Modelo escolhido:
// `meta/llama-3.1-8b-instruct`, NÃO `z-ai/glm-5.2` (o que já causou dois
// apagões de produção: NVIDIA descontinua versões do GLM sem aviso no
// código — glm-5 → glm-5.1 em abril, glm-5.1 → glm-5.2 → fim em agosto).
// O Llama já era usado com sucesso nesta mesma chave (Semana 11, retagging
// de `areas`/`keywords`, sem throttling) — modelos Meta no NIM não têm
// histórico de descontinuação repentina como a linha GLM.
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const CHAT_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
// Configurável via `.env` (`NIM_GENERAL_MODEL`) pra não precisar editar
// código de novo se a NVIDIA descontinuar este modelo também no futuro.
export const GENERAL_MODEL = process.env.NIM_GENERAL_MODEL || "meta/llama-3.1-8b-instruct";

const SYSTEM_PROMPT = `Você é a Accessia, assistente da AccessPlus, agora no MODO PERGUNTAS GERAIS — sem login, sem nenhum dado pessoal do estudante, e sem lista de oportunidades já filtrada pra ele.

REGRAS
1. Você NÃO tem acesso à lista de oportunidades reranqueadas pra este estudante — isso só existe no modo "Encontrar oportunidades" (exige login). Nunca invente prazo, valor de bolsa, critério de elegibilidade ou link de nenhum programa específico.
2. Se a pergunta pedir claramente uma recomendação personalizada ("qual bolsa é boa pra mim", "me indica algo pro meu perfil"), NÃO tente adivinhar — diga que isso é o modo "Encontrar oportunidades" e sugira usá-lo.
3. Pode responder perguntas amplas sobre como funciona o processo em geral (o que é a AccessPlus, como costuma funcionar inscrição em bolsa/olimpíada, dúvidas sobre documentos comuns etc.) usando conhecimento geral seguro — nunca afirmando isso como regra de um programa específico a menos que ele apareça na lista de "possíveis oportunidades relacionadas" abaixo, e mesmo aí só repita o título, nunca invente detalhe que não foi dado.
4. Se a pergunta pedir uma LISTA ou CATEGORIA de programas ("quais olimpíadas de história vocês têm", "tem oportunidade de intercâmbio aqui?"), a lista de "possíveis oportunidades relacionadas" abaixo (quando não vier vazia) já é uma busca real no catálogo — pode listar os títulos dela diretamente como resposta, é a fonte mais confiável que você tem. NUNCA responda "não sei" ou "não tenho acesso ao catálogo" quando essa lista tiver itens — isso seria esconder um resultado real (Parte 1 do plano). Só diga que não encontrou nada quando a lista vier realmente vazia.
5. Sem verificação externa contra a web neste modo (funcionalidade planejada, atualmente desligada por depender de faturamento — ver comentário no topo do arquivo) — se você não tem certeza, diga que não sabe, em vez de arriscar.
6. Português brasileiro, tom caloroso, público de 11 a 18 anos, a maioria de baixa renda e primeira geração a acessar esse tipo de oportunidade — explique jargão.

FORMATO DE SAÍDA: responda APENAS com um objeto JSON válido, sem texto antes ou depois:
{"text": "resposta em 1 a 4 frases", "relatedOpportunityIds": [ids inteiros da lista de possíveis oportunidades relacionadas que você de fato mencionou, ou array vazio]}`;

function buildUserMessage(question, possibleMatches) {
  const contexto = possibleMatches.length
    ? `Possíveis oportunidades do catálogo relacionadas ao texto da pergunta (só o título é confiável aqui — não afirme mais nada sobre elas além do título, e só cite se fizer sentido pra resposta): ${possibleMatches
        .map((m) => `"${m.title}" (id ${m.id})`)
        .join(", ")}`
    : "Nenhuma oportunidade específica do catálogo parece relacionada ao texto desta pergunta.";
  return `Pergunta do estudante: "${question}"\n\n${contexto}`;
}

/**
 * @param {string} question
 * @param {Array<{id: number, title: string}>} possibleMatches - candidates do
 *   title-match (server/utils/rag/titleMatch.js), não confirmados como a
 *   intenção real do aluno — só contexto pro LLM decidir se cita ou não.
 */
export async function answerGeneralQuestion(question, possibleMatches = []) {
  const response = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${NVIDIA_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GENERAL_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserMessage(question, possibleMatches) },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error(`Modo geral (NIM) respondeu ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) throw new Error("Resposta do modo geral veio vazia");

  // `meta/llama-3.1-8b-instruct` (diferente do GLM usado antes) às vezes
  // não honra `response_format: json_object` à risca e devolve o JSON
  // cercado de texto extra — por isso, antes de desistir, tenta extrair só
  // o primeiro bloco `{...}` da resposta.
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const encontrado = raw.match(/\{[\s\S]*\}/);
    if (!encontrado) throw new Error(`Resposta do modo geral não é JSON válido: ${raw.slice(0, 200)}`);
    try {
      parsed = JSON.parse(encontrado[0]);
    } catch {
      throw new Error(`Resposta do modo geral não é JSON válido: ${raw.slice(0, 200)}`);
    }
  }

  const idsValidos = new Set(possibleMatches.map((m) => m.id));
  const relatedIds = Array.isArray(parsed.relatedOpportunityIds) ? parsed.relatedOpportunityIds : [];
  const relatedOpportunities = relatedIds
    .filter((id) => idsValidos.has(id))
    .map((id) => possibleMatches.find((m) => m.id === id));

  return {
    text: typeof parsed.text === "string" ? parsed.text : "",
    relatedOpportunities,
  };
}
