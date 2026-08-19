import { devSupabase } from "./devClient.js";

// Grava um rastro da busca em ai_interactions — Parte 9 do plano. NUNCA
// guarda o texto do aluno (freeText/bio) aqui, só ids e metadados: os ids
// já bastam pra reconstruir "por que essa recomendação apareceu" semanas
// depois, e não multiplicam a superfície de dado sensível que o projeto
// precisa proteger sob LGPD.
export async function logInteraction({
  userId,
  sessionId,
  mode,
  retrievedIds,
  rerankedIds,
  shownIds,
  latencyMs,
  modelsUsed,
  generationDegraded,
}) {
  const { error } = await devSupabase.from("ai_interactions").insert({
    user_id: userId ?? null,
    session_id: sessionId,
    mode,
    retrieved_ids: retrievedIds,
    reranked_ids: rerankedIds,
    shown_ids: shownIds,
    latency_ms: latencyMs,
    models_used: modelsUsed,
    generation_degraded: generationDegraded,
  });

  // Uma falha ao logar nunca deve derrubar a resposta pro aluno — só avisa
  // no console do servidor. O aluno não deve pagar (com um erro) por uma
  // etapa que existe só pra rastreio interno.
  if (error) console.error("[rag] Falha ao gravar ai_interactions:", error.message);
}
