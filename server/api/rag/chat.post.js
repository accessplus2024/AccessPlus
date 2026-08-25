// Endpoint único do chat da Accessia. Substitui a divisão entre
// `/api/rag/match` (recomendação, exige login) e `/api/rag/general`
// (pergunta solta, anônimo) por um roteador de intenção — porque o aluno não
// sabe em qual modo está e não deveria precisar saber. Ele escreve "o que é
// MUN?", depois "quais vocês têm?", depois "não sei se eu consigo" — três
// intenções diferentes na mesma conversa.
//
// `/api/rag/match` continua existindo e funcionando; este endpoint é aditivo.
//
// Regras de acesso mantidas do desenho anterior:
//  - CONCEITO, CATEGORIA, SAUDACAO, OPORTUNIDADE: anônimo pode. São dados do
//    catálogo e do glossário, não dependem de perfil. Bloquear isso atrás de
//    login seria esconder informação pública de quem mais precisa dela.
//  - RECOMENDACAO e EXPLORACAO: exigem login, porque usam idade e nível do
//    cadastro (e a idade é filtro duro, ver ageFilter.js).
import { getCatalog, opportunityById } from "../../utils/rag/catalog.js";
import { route, INTENTS } from "../../utils/rag/router.js";
import { search, searchByCategory, normalizeLevel } from "../../utils/rag/search.js";
import { answerAboutOpportunity, buildFactSheet } from "../../utils/rag/factSheet.js";
import { nextStep, collectedToText, accumulate } from "../../utils/rag/conversation.js";
// Regras de "o que de fato chega ao aluno". Moram num arquivo só porque esta
// rota já nasceu sem elas uma vez — ver o cabeçalho de utilidade.js.
import { generateWithIsolation, filterUseful, cutByRelevance, structuredReason, suggestEnglishLearning } from "../../utils/rag/usefulness.js";
import { filterByAge } from "../../utils/rag/ageFilter.js";
import { checkRateLimit, getClientIp } from "../../utils/rateLimit.js";

// Mais folgado que o do match (15/10min) para as intenções baratas, porque
// conversar exige várias mensagens curtas — um limite apertado transformaria
// o modo exploração, que é o mais importante do produto, no mais punido.
const LIMITE_CONVERSA = { limit: 40, windowMs: 10 * 60 * 1000 };
const LIMITE_BUSCA = { limit: 15, windowMs: 10 * 60 * 1000 };

const INTENCOES_QUE_EXIGEM_LOGIN = new Set([INTENTS.RECOMENDACAO, INTENTS.EXPLORACAO]);

export default defineEventHandler(async (event) => {
  const startedAt = Date.now();
  const ip = getClientIp(event);

  const body = await readBody(event);
  const {
    mensagem,
    sessionId,
    userId = null,
    perfil = {},          // { age, nivel, areas, condicao_financeira, linguas }
    // Frases fixas do cadastro ("Estou no Ensino Médio.", "Tenho 16 anos.").
    // Entram na BUSCA, nunca no roteamento — ver `textForSearch()` abaixo.
    contexto = "",
    historico = [],       // [{ papel: 'aluno'|'accessia', texto, oportunidadeId? }]
    coletado = null,      // estado do funil de exploração, devolvido pelo cliente
    resposta = null,      // { campo, valores } quando o aluno clicou numa opção do funil
  } = body || {};

  if (!sessionId || typeof sessionId !== "string") {
    throw createError({ statusCode: 400, statusMessage: "sessionId é obrigatório" });
  }
  if ((!mensagem || typeof mensagem !== "string") && !resposta) {
    throw createError({ statusCode: 400, statusMessage: "mensagem é obrigatória" });
  }

  const cat = await getCatalog();

  // A separação mais importante deste endpoint:
  //
  //   ROTEAMENTO  olha SÓ `mensagem` — o que o aluno acabou de escrever.
  //   BUSCA       olha o contexto acumulado: cadastro + tudo que ele já disse.
  //
  // Misturar os dois quebra o roteamento de um jeito que parece
  // inexplicável: se "o que é MUN?" chegar concatenada com
  // "Estou no Ensino Médio. Tenho 16 anos. gosto de história", o texto inteiro
  // deixa de ser uma pergunta definicional e vira uma descrição de perfil —
  // então a Accessia devolve 7 oportunidades em vez de explicar o que é um MUN.
  // Era exatamente o sintoma relatado.
  //
  // Na direção oposta, search só com a mensagem nova perde o refinamento:
  // "não gostei dessas, quero algo de humanas" isolado não tem perfil nenhum.
  const studentMessages = historico.filter((h) => h.papel === "aluno").map((h) => h.texto).filter(Boolean);
  const textForSearch = (mensagemAtual) =>
    [contexto, ...studentMessages, mensagemAtual].filter(Boolean).join("\n");

  // Clique numa opção do funil: não passa pelo roteador, já sabemos onde
  // estamos. Continua o funil, ou dispara a busca quando ele fecha.
  if (resposta) {
    if (!checkRateLimit(`rag-chat:${ip}`, LIMITE_CONVERSA)) {
      throw createError({ statusCode: 429, statusMessage: "Muitas mensagens em pouco tempo. Tenta de novo em alguns minutos." });
    }
    const novoColetado = accumulate(coletado ?? {}, resposta.campo, resposta.valores);
    // Já dentro do funil: a abertura não é mostrada de novo, então `origem` aqui
    // é irrelevante — mas passamos explicitamente pra não depender do default.
    const passo = nextStep(novoColetado, { origem: "naoSabe" });
    if (passo.passo !== "pronto") {
      return { tipo: "pergunta", intencao: INTENTS.EXPLORACAO, coletado: novoColetado, ...passo };
    }
    return await respondWithRecommendations({
      event, ip, texto: [contexto, collectedToText(novoColetado, perfil, studentMessages)].filter(Boolean).join("\n"),
      areas: novoColetado.areas ?? null, tipos: novoColetado.tipos ?? null,
      perfil, userId, sessionId, startedAt, coletado: novoColetado, intencao: INTENTS.EXPLORACAO,
    });
  }

  const rota = route(mensagem, cat.corpus, { historico, perfil });

  if (INTENCOES_QUE_EXIGEM_LOGIN.has(rota.intencao) && !userId) {
    return {
      tipo: "precisa_login",
      intencao: rota.intencao,
      texto:
        "Pra te recomendar oportunidades de verdade eu preciso saber sua série e sua idade — é o que evita eu te mostrar coisa que você não conseguiria fazer. Entra com sua conta e a gente continua daqui.",
    };
  }

  switch (rota.intencao) {
    case INTENTS.SAUDACAO: {
      return {
        tipo: "texto",
        intencao: rota.intencao,
        texto:
          "Oi! Eu sou a Accessia. Posso te ajudar de três formas: te mostrar oportunidades que combinam com você, explicar como as coisas funcionam (o que é um MUN, o que é bolsa integral), ou te contar tudo sobre uma oportunidade específica.\n\nSe você ainda não sabe o que quer, é só dizer — eu te ajudo a descobrir com algumas perguntas.",
        sugestoes: ["Não sei o que quero, me ajuda", "O que é um MUN?", "Quais olimpíadas vocês têm?"],
      };
    }

    case INTENTS.CONCEITO: {
      const c = rota.conceito;
      // Quando o conceito é uma categoria real do catálogo, a explicação vem
      // acompanhada de exemplos VERDADEIROS — explicar o que é um MUN sem
      // mostrar os MUNs que existem deixa o trabalho pela metade.
      let exemplos = [];
      if (c.tipoCatalogo) {
        exemplos = (await searchByCategory(c.tipoCatalogo, "", { topK: 4 })).map((o) => ({
          id: o.id, titulo: o.title, custo: o.cost ?? null, inscricoes: o.inscricoes ?? null,
        }));
      }
      return {
        tipo: "conceito",
        intencao: rota.intencao,
        conceito: c.chave,
        texto: c.texto,
        exemplos,
        tipoCatalogo: c.tipoCatalogo ?? null,
        sugestoes: c.tipoCatalogo
          ? [`Quais ${c.tipoCatalogo} vocês têm?`, "Isso serve pra mim?"]
          : ["Me mostra oportunidades pra mim"],
      };
    }

    case INTENTS.CATEGORIA: {
      const itens = await searchByCategory(rota.tipo, mensagem, { topK: 12 });
      return {
        tipo: "lista",
        intencao: rota.intencao,
        tipoCatalogo: rota.tipo,
        texto: itens.length
          ? `Achei ${itens.length} no catálogo${rota.tipo ? ` em ${rota.tipo}` : ""} — as com inscrição aberta vêm primeiro. Quer que eu veja quais combinam com você especificamente?`
          : "Não tenho nada nessa categoria no catálogo agora. O catálogo muda com frequência, vale voltar em algumas semanas.",
        itens: itens.map((o) => ({
          id: o.id,
          titulo: o.title,
          tipo: o.type,
          custo: o.cost ?? null,
          inscricoes: o.inscricoes ?? null,
          nivel: o.level ?? null,
          link: o.link ?? null,
        })),
        sugestoes: itens.length ? ["Quais desses combinam comigo?"] : ["Me mostra outras coisas"],
      };
    }

    case INTENTS.OPORTUNIDADE: {
      if (!checkRateLimit(`rag-chat:${ip}`, LIMITE_CONVERSA)) {
        throw createError({ statusCode: 429, statusMessage: "Muitas mensagens em pouco tempo. Tenta de novo em alguns minutos." });
      }
      const o = rota.oportunidade;
      const { ficha, texto, degraded } = await answerAboutOpportunity(mensagem, o);
      return {
        tipo: "oportunidade",
        intencao: rota.intencao,
        via: rota.via,
        texto,
        ficha,
        oportunidadeId: o.id,
        generationDegraded: degraded,
        sugestoes: ["Eu consigo participar disso?", "Como me inscrevo?", "Tem outras parecidas?"],
      };
    }

    case INTENTS.EXPLORACAO: {
      const base = coletado ?? {};
      const comAnalise = rota.analysis.areas.length ? accumulate(base, "areas", rota.analysis.areas) : base;
      const origem = rota.motivo === "declarou nao saber o que quer" ? "naoSabe" : "fallback";
      const passo = nextStep(comAnalise, { origem, mensagemDoAluno: mensagem });
      if (passo.passo === "pronto") {
        return await respondWithRecommendations({
          event, ip,
          texto: [contexto, collectedToText(comAnalise, perfil, [...studentMessages, mensagem])].filter(Boolean).join("\n"),
          areas: comAnalise.areas ?? null,
          tipos: comAnalise.tipos ?? null,
          perfil,
          userId,
          sessionId,
          startedAt,
          coletado: comAnalise,
          intencao: INTENTS.EXPLORACAO,
        });
      }
      return { tipo: "pergunta", intencao: rota.intencao, coletado: comAnalise, ...passo };
    }

    case INTENTS.RECOMENDACAO:
    default: {
      // `semente` existe quando o aluno pediu "outras parecidas": a consulta
      // vem da oportunidade que estava em pauta, e ela mesma é excluída do
      // resultado (mostrar de volta o item que ele acabou de ver como
      // "parecido com ele" não ajuda ninguém).
      return await respondWithRecommendations({
        event, ip,
        texto: rota.semente ? [contexto, rota.semente.texto].filter(Boolean).join("\n") : textForSearch(mensagem),
        excluirId: rota.semente?.excluirId ?? null,
        areas: rota.semente?.areas ?? null,
        tipos: rota.semente?.tipos ?? null,
        escopoTipo: rota.escopoTipo ?? null,
        perfil, userId, sessionId, startedAt, coletado, intencao: INTENTS.RECOMENDACAO,
      });
    }
  }
});

async function respondWithRecommendations({ ip, texto, perfil, userId, sessionId, startedAt, coletado, intencao, excluirId = null, areas = null, tipos = null, escopoTipo = null }) {
  if (!checkRateLimit(`rag-busca:${ip}`, LIMITE_BUSCA)) {
    throw createError({ statusCode: 429, statusMessage: "Muitas buscas em pouco tempo. Tenta de novo em alguns minutos." });
  }

  const { analysis, results, diagnostico } = await search(
    {
      texto,
      // Precedência deliberada: o que o aluno escolheu AGORA (funil, ou a
      // oportunidade de referência do "parecidas") vence o que está salvo no
      // cadastro. O cadastro diz o que ele gosta em geral; a escolha desta
      // conversa diz o que ele quer nesta busca.
      areas: (areas ?? perfil.areas) ?? [],
      tipos: tipos ?? [],
      nivel: normalizeLevel(perfil.nivel),
      condicaoFinanceira: perfil.condicao_financeira ?? null,
      local: perfil.local ?? null,
      // Campo estruturado do cadastro (`profiles.linguas`). Ver o comentario
      // em entenderConsulta.js: e o sinal de idioma mais confiavel que existe,
      // e estava sem uso.
      linguas: perfil.linguas ?? null,
    },
    { candidates: 50, topK: 15, escopoTipo }
  );

  const idade = Number.isFinite(Number(perfil.age)) ? Number(perfil.age) : null;
  const semAExcluida = excluirId ? results.filter((o) => o.id !== excluirId) : results;
  const { kept: eligible, excluded: cut } = filterByAge(semAExcluida, idade);
  if (cut.length) {
    console.log(`[chat] ${cut.length} fora da faixa de idade declarada (aluno ${idade}): ${cut.map((o) => o.title).join(", ")}`);
  }

  if (!eligible.length) {
    return {
      tipo: "sem_resultado",
      intencao,
      coletado,
      texto:
        "Não encontrei nada que sirva de verdade pro seu perfil agora — e prefiro te dizer isso do que te mandar coisa que você não conseguiria fazer. O catálogo muda toda semana, então vale voltar. Se quiser, me conta mais sobre o que te interessa e eu procuro de outro ângulo.",
      analise: analysis,
    };
  }

  // Corte por relevância: não completar `topK` com o que sobrou.
  // Ver cutByRelevance() em utilidade.js — a curva de score medida numa
  // consulta real mostra que o 15º item vale 67% do 1º, e que do 9º em diante
  // nada tinha a ver com o que o aluno pediu.
  const { shown, cut: cortadosPorScore } = cutByRelevance(eligible);
  if (cortadosPorScore.length) {
    console.log(`[chat] ${cortadosPorScore.length} cortada(s) por relevância baixa: ${cortadosPorScore.map((o) => o.title).join(", ")}`);
  }

  // Explicações com isolamento de falha por bissecção: sem isso, um item que
  // o modelo erra derruba a explicação de TODOS (visto em produção — as 15
  // caíram no motivo estruturado de uma vez).
  let explanations = [];
  try {
    explanations = await generateWithIsolation(texto, shown);
  } catch (e) {
    console.error("[chat] geração falhou inteira:", e.message);
  }
  const degraded = explanations.some((e) => e._fallback) || explanations.length === 0;

  // Filtro de utilidade real: backstop de graduação no exterior + julgamento
  // `combina` do LLM. Esta rota estava sem os dois, e por isso Prep Program,
  // UWC e Programa Oportunidades Acadêmicas chegaram a um aluno que pediu
  // pesquisa em história.
  const { recommendations: useful, hidden, reasons } = filterUseful(shown, texto, explanations);
  for (const m of reasons) console.log(`[chat] "${m.titulo}" — ${m.motivo}`);

  if (!useful.length) {
    return {
      tipo: "sem_resultado",
      intencao,
      coletado,
      texto:
        "Procurei e não achei nada que sirva de verdade pro que você pediu — e prefiro te dizer isso do que te mandar coisa que não tem a ver. Tenta me contar de outro jeito, ou me pergunta sobre uma área diferente. O catálogo também muda toda semana.",
      analise: analysis,
    };
  }

  // Se a lista traz algo em inglês, a ponte para aprender inglês entra no fim.
  // Ver suggestEnglishLearning(). `getCatalog()` é cache de 12h em memória —
  // `cat` do handler não alcança aqui, esta função é chamada de vários pontos.
  const { corpus: catalogo } = await getCatalog();
  const comPonte = suggestEnglishLearning(useful, catalogo);

  const byId = new Map(explanations.map((x) => [Number(x.id), x]));
  const recommendations = comPonte.map((o) => ({
    id: o.id,
    titulo: o.title,
    tipo: o.type ?? null,
    areas: o.areas ?? [],
    nivel: o.level ?? null,
    custo: o.cost ?? null,
    idioma: o.language ?? null,
    local: o.location ?? null,
    formato: o.format ?? null,
    inscricoes: o.inscricoes ?? null,
    prazo: o.deadline ?? null,
    link: o.link ?? null,
    // A ponte não passa pela geração (entra depois), e o motivo é escrito à
    // mão de propósito: ela está na lista por um critério objetivo, não porque
    // um modelo achou que combina com este aluno.
    porQueCombina: o._pontePraIngles
      ? "Pra você que não fala inglês ou quer melhorar: dá uma olhadinha nessa oportunidade."
      : byId.get(Number(o.id))?.why_it_fits ?? structuredReason(o),
    // A dúvida do modelo (Regra 4.5) aparece como ressalva que o aluno lê e
    // julga, em vez de virar uma decisão silenciosa de esconder — ver a nota
    // em filterUseful(). Só acrescenta se o LLM não tiver escrito ressalva
    // própria; quando escreveu, o texto dele é mais específico que o nosso.
    ressalvas: (() => {
      const propria = byId.get(Number(o.id))?.caveats ?? "";
      if (!o._rebaixado) return propria;
      if (propria) return propria;
      return "Vale conferir com atenção se essa combina mesmo com o que você procura — ela apareceu na busca, mas não tenho certeza de que serve pro seu caso.";
    })(),
    _rebaixado: o._rebaixado ?? false,
    _notaJuiz: o.notaJuiz ?? null,
  }));


  return {
    tipo: "recomendacoes",
    intencao,
    coletado,
    texto:
      recommendations.length === 1
        ? "Achei uma que faz sentido pra você. Pode me perguntar sobre ela — prazo, quem pode participar, como se inscrever."
        : `Achei ${recommendations.length} que fazem sentido pra você. Pode me perguntar sobre qualquer uma delas — prazo, quem pode participar, como se inscrever.`,
    recomendacoes: recommendations,
    analise: analysis,
    diagnostico,
    generationDegraded: degraded,
  };
}
