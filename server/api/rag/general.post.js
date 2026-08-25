import { matchOpportunityTitle } from "../../utils/rag/titleMatch.js";
import { ftsSearch } from "../../utils/rag/ftsSearch.js";
import { devSupabase } from "../../utils/rag/ragClient.js";
import { checkRateLimit, getClientIp } from "../../utils/rateLimit.js";
import { answerGeneralQuestion, GENERAL_MODEL } from "../../utils/rag/generateGeneral.js";

// A verificação externa (Parte 5, `verifyExternal.js`) foi desligada em
// 2026-08-24: dependia do Gemini + busca do Google, que exige conta de
// faturamento do Google Cloud mesmo pra volume baixo — a mantenedora não
// pode gastar dinheiro nisso. O arquivo continua no repo, documentado, caso
// isso mude no futuro (ver `docs/decisions.md`), mas não é mais chamado
// daqui.

// MODO GERAL (Parte 2 do plano) — anônimo, sem login, ao contrário do modo
// match (/api/rag/match). Rate limit mais apertado que o do match porque
// não tem limite por aluno segurando o custo de NIM —
// aqui o limite por IP É a única proteção contra abuso.
const RATE_LIMIT = { limit: 8, windowMs: 10 * 60 * 1000 }; // 8 perguntas / 10 min / IP

export default defineEventHandler(async (event) => {
  const startedAt = Date.now();

  const ip = getClientIp(event);
  if (!checkRateLimit(`rag-general:${ip}`, RATE_LIMIT)) {
    throw createError({ statusCode: 429, statusMessage: "Muitas perguntas em pouco tempo. Tente de novo em alguns minutos." });
  }

  const body = await readBody(event);
  const { question, sessionId } = body || {};

  if (!question || typeof question !== "string") {
    throw createError({ statusCode: 400, statusMessage: "question (pergunta) é obrigatório" });
  }
  if (!sessionId || typeof sessionId !== "string") {
    throw createError({ statusCode: 400, statusMessage: "sessionId é obrigatório" });
  }

  // Sem gate de login aqui de propósito (Parte 2: "MODO GERAL (anônimo OK)")
  // — e por isso mesmo, nunca recebemos nem logamos nada de identificação
  // do aluno além do sessionId de uso (mesma política de privacidade de
  // rastreio interno, aqui ainda mais estrita: nem userId existe).

  // Etapa 1: a pergunta bate com o título de UMA oportunidade específica do
  // catálogo? Se sim, a resposta vem direto do banco curado — dado
  // confiável sempre vence sobre geração (Parte 5 do plano: "resposta
  // curada nunca aparece lado a lado com peso visual igual ao de uma
  // divergência externa"). Ambíguo (0 ou vários matches) cai pra etapa 2.
  const titleMatches = await matchOpportunityTitle(question);

  if (titleMatches.length === 1) {
    const { data: opportunity, error } = await devSupabase
      .from("opportunities")
      .select("id, title, description, link, deadline, level, areas, cost, location, language, audience, inscricoes")
      .eq("id", titleMatches[0].id)
      .single();

    if (error) {
      throw createError({ statusCode: 500, statusMessage: `Erro ao buscar oportunidade: ${error.message}` });
    }

    // `atualizacaoWeb` fica sempre `null` por ora — a verificação externa
    // (Parte 5) está desligada (ver comentário no topo do arquivo). O campo
    // continua existindo na resposta e no template do card pra não precisar
    // mexer em mais nada se isso for reativado depois.
    const atualizacaoWeb = null;


    return { type: "opportunity", opportunity: { ...opportunity, atualizacaoWeb } };
  }

  // Etapa 2: sem match de UM título específico. Antes de deixar a Accessia
  // responder no escuro, tenta achar candidates por busca textual (FTS —
  // sem custo de LLM nem de embedding, é só uma query no Postgres) pra
  // perguntas temáticas/de categoria ("quais olimpíadas de história vocês
  // têm", "tem oportunidade de intercâmbio?"). Achado real de 2026-08-24:
  // sem isso, a Accessia respondia "não sei"/"não tenho acesso" ou até
  // inventava uma resposta genérica errada pra esse tipo de pergunta,
  // mesmo quando o catálogo tinha itens reais — exatamente o "esconder um
  // resultado real" que a Parte 1 do plano proíbe. Isto NÃO é o pipeline de
  // match completo (sem busca vetorial, sem rerank, sem personalização por
  // perfil) — só o suficiente pra dar à Accessia algo verdadeiro do
  // catálogo pra citar, em vez de zero contexto.
  let candidates = titleMatches;
  if (candidates.length === 0) {
    try {
      const ftsResults = await ftsSearch(question, 8);
      const ids = ftsResults.map((r) => r.opportunity_id);
      if (ids.length) {
        const { data: opps, error: ftsError } = await devSupabase
          .from("opportunities")
          .select("id, title")
          .in("id", ids);
        if (!ftsError && opps) candidates = opps;
      }
    } catch (ftsErr) {
      console.error("[rag/general] Busca textual falhou:", ftsErr.message);
      // segue sem candidates — degrada pro "não encontrei" do LLM, nunca quebra a resposta
    }
  }

  // LLM responde de forma geral, ancorado nos candidates acima quando
  // existem, nunca inventando dado de nenhuma oportunidade em particular, e
  // apontando pro modo match quando a pergunta pede recomendação
  // personalizada (ver system prompt em generateGeneral.js).
  let answer;
  let generationDegraded = false;
  try {
    answer = await answerGeneralQuestion(question, candidates);
  } catch (genError) {
    console.error("[rag/general] Geração falhou:", genError.message);
    generationDegraded = true;
    answer = {
      text: 'Não consegui responder agora — tenta de novo em instantes, ou usa o modo "Encontrar oportunidades" pra uma busca personalizada.',
      relatedOpportunities: [],
    };
  }


  return { type: "answer", ...answer, generationDegraded };
});
