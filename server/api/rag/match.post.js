import { hybridSearch } from "../../utils/rag/hybridSearch.js";
import { devSupabase } from "../../utils/rag/devClient.js";
import { rerank, RERANK_MODEL } from "../../utils/rag/rerank.js";
import { generateRecommendations, GENERATION_MODEL } from "../../utils/rag/generate.js";
import { checkRateLimit, getClientIp } from "../../utils/rateLimit.js";
import { checkAndIncrementMatchQuota } from "../../utils/rag/quota.js";
import { logInteraction } from "../../utils/rag/logInteraction.js";

// Limite básico de abuso por IP — não é a cota por aluno da Parte 5.5 (essa
// é a checkAndIncrementMatchQuota logo abaixo). Só existe pra impedir um
// loop/bot de esgotar o free tier da NIM sozinho, mesmo vindo de contas
// diferentes.
const RATE_LIMIT = { limit: 15, windowMs: 10 * 60 * 1000 }; // 15 buscas / 10 min / IP

export default defineEventHandler(async (event) => {
  const startedAt = Date.now();

  const ip = getClientIp(event);
  if (!checkRateLimit(`rag-match:${ip}`, RATE_LIMIT)) {
    throw createError({ statusCode: 429, statusMessage: "Muitas buscas em pouco tempo. Tente de novo em alguns minutos." });
  }

  const body = await readBody(event);
  const { freeText, keywordText, userId, sessionId, matchCount = 20, finalCount = 8 } = body || {};

  if (!freeText || typeof freeText !== "string") {
    throw createError({ statusCode: 400, statusMessage: "freeText (texto livre) é obrigatório" });
  }
  if (!keywordText || typeof keywordText !== "string") {
    throw createError({ statusCode: 400, statusMessage: "keywordText (áreas/palavras-chave) é obrigatório" });
  }
  // Parte 19 do plano: modo match exige login (precisa da idade/perfil pra
  // ranquear direito, e a cota por aluno abaixo não existe sem um id real).
  // IMPORTANTE (limitação conhecida, ver docs/decisions.md): este `userId`
  // vem do corpo da requisição, montado pelo frontend a partir da sessão
  // logada no Supabase de PRODUÇÃO — não é verificado criptograficamente
  // aqui, porque este endpoint só fala com o Supabase de DEV (isolado de
  // produção por decisão do mantenedor). Aceitável agora (baixo volume,
  // sem dado sensível liberado por essa confiança), mas é spoofável.
  if (!userId || typeof userId !== "string") {
    throw createError({ statusCode: 401, statusMessage: "Você precisa entrar com sua conta para usar a Accessia." });
  }
  if (!sessionId || typeof sessionId !== "string") {
    throw createError({ statusCode: 400, statusMessage: "sessionId é obrigatório" });
  }

  const quota = await checkAndIncrementMatchQuota(userId);
  if (!quota.allowed) {
    throw createError({
      statusCode: 429,
      statusMessage: `Você já usou suas ${quota.limit} buscas deste mês. Volta mês que vem, ou atualiza seu perfil e revisita as oportunidades que já apareceram 🙂`,
    });
  }

  const fused = await hybridSearch(freeText, keywordText, matchCount);
  const ids = fused.map((r) => r.opportunity_id);

  const { data: opportunities, error } = await devSupabase
    .from("opportunities")
    .select("id, title, description, link, deadline, level, areas, cost, location, language, audience, metadata")
    .in("id", ids);

  if (error) {
    throw createError({ statusCode: 500, statusMessage: `Erro ao buscar oportunidades: ${error.message}` });
  }

  const byId = new Map(opportunities.map((o) => [o.id, o]));

  // Ordem ANTES do rerank — pura fusão RRF (vetor + FTS).
  const beforeRerank = fused
    .map((r) => {
      const opp = byId.get(r.opportunity_id);
      if (!opp) return null;
      return { ...opp, rrf_score: r.rrf_score, vector_rank: r.vector_rank, fts_rank: r.fts_rank };
    })
    .filter(Boolean);

  // Rerank: cross-encoder olha query + (título + descrição) juntos, por item.
  const passages = beforeRerank.map((opp) => `${opp.title}\n${opp.description ?? ""}`);
  const rankings = await rerank(freeText, passages);

  const afterRerank = rankings
    .slice(0, finalCount)
    .map((ranking) => ({
      ...beforeRerank[ranking.index],
      rerank_logit: ranking.logit,
    }));

  // Geração: só agora, sobre os poucos itens que sobreviveram ao rerank, o
  // GLM-5.2 (via NIM — mesma política de não-treino do embedding/rerank)
  // escreve "por que combina" + ressalvas. Ancorado só no que está em
  // `afterRerank` — nunca no corpus inteiro. Ver system prompt em generate.js.
  //
  // Se a geração falhar, o retrieval já é um resultado real e útil por
  // conta própria — devolvemos as oportunidades mesmo assim, sem
  // why_it_fits/caveats, em vez de jogar fora uma busca que funcionou por
  // causa de uma etapa a mais. Ver Parte 1 do plano: nunca esconder um
  // resultado real.
  let recommendations;
  let generationDegraded = false;
  try {
    const explanations = await generateRecommendations(freeText, afterRerank);
    const explanationById = new Map(explanations.map((e) => [e.id, e]));
    recommendations = afterRerank.map((opp) => ({
      ...opp,
      why_it_fits: explanationById.get(opp.id)?.why_it_fits ?? null,
      caveats: explanationById.get(opp.id)?.caveats ?? "",
    }));
  } catch (genError) {
    console.error("[rag/match] Geração falhou, devolvendo oportunidades sem explicação:", genError.message);
    generationDegraded = true;
    recommendations = afterRerank.map((opp) => ({ ...opp, why_it_fits: null, caveats: "" }));
  }

  const latencyMs = Date.now() - startedAt;

  // Nunca deixamos o log derrubar a resposta: se logInteraction falhar
  // internamente, ela só grava um console.error e segue (ver logInteraction.js).
  await logInteraction({
    userId,
    sessionId,
    mode: "match",
    retrievedIds: beforeRerank.map((o) => o.id),
    rerankedIds: afterRerank.map((o) => o.id),
    shownIds: recommendations.map((o) => o.id),
    latencyMs,
    modelsUsed: {
      embed: process.env.EMBEDDING_MODEL,
      rerank: RERANK_MODEL,
      generate: GENERATION_MODEL,
    },
    generationDegraded,
  });

  return {
    query: { freeText, keywordText },
    beforeRerank: beforeRerank.map((o) => ({ id: o.id, title: o.title })),
    afterRerank: recommendations,
    generationDegraded,
    quota: { used: quota.count, limit: quota.limit },
  };
});
