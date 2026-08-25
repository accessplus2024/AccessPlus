// 2026-08-24 (segunda revisão do dia): o núcleo de recuperação desta rota
// passou de `hybridSearch` + SELECT + `rerank` + `reweight` para `search()`
// (server/utils/rag/search.js). O contrato da resposta é o MESMO — nada muda
// para `components/AccessIA.vue`. O cabeçalho de `search.js` tem a tabela de
// medição no golden set que justifica cada peça; em resumo, contra o pipeline
// que estava aqui: recall@10 0.617 → 0.679, NDCG@10 0.522 → 0.618, MRR 0.593
// → 0.767, "programa em inglês nas 3 primeiras posições para quem declarou
// não falar inglês" 0.52 → 0.04.
//
// `reweight` + `classifyViagem` saíram do caminho: a preferência de local
// virou boost estrutural dentro de `search()`, usando os sinais derivados de
// `sinais.js` (que leem título e location) em vez de uma chamada extra de LLM
// por busca só para classificar "requer viagem internacional?". Os arquivos
// continuam no repositório.
import { search, normalizeLevel } from "../../utils/rag/search.js";
import { RERANK_MODEL } from "../../utils/rag/rerank.js";
import { generateRecommendations, GENERATION_MODEL } from "../../utils/rag/generate.js";
import { checkRateLimit, getClientIp } from "../../utils/rateLimit.js";
import { filterByAge } from "../../utils/rag/ageFilter.js";

// Limite básico de abuso por IP. Não há mais cota por aluno (removida em
// 2026-08-25 a pedido da mantenedora — ver docs/decisions.md); isto aqui é a
// única contenção que resta, e existe só pra impedir um loop/bot de esgotar
// o free tier da NIM sozinho, mesmo vindo de contas diferentes.
const RATE_LIMIT = { limit: 15, windowMs: 10 * 60 * 1000 }; // 15 buscas / 10 min / IP

// Usado só quando generateRecommendations() falha por completo (NIM fora do
// ar, timeout etc) — nunca no caminho normal, onde o why_it_fits vem do LLM.
// Monta uma frase específica desta oportunidade a partir do que ela
// realmente tem preenchido, pra nunca cair num texto genérico igual pra
// todo mundo nem em `null`.
function buildFallbackReason(opp) {
  const partes = [];
  const areas = Array.isArray(opp.areas) ? opp.areas.filter(Boolean) : [];
  if (areas.length > 0) {
    partes.push(`É uma oportunidade da área de ${areas.join(", ")}`);
  }
  if (opp.level) {
    const nivel = Array.isArray(opp.level) ? opp.level.join(", ") : opp.level;
    if (nivel) partes.push(`voltada para o nível ${nivel}`);
  }
  if (opp.cost) {
    partes.push(`com custo declarado como "${opp.cost}"`);
  }
  if (partes.length === 0) {
    return "Apareceu na sua busca por combinar com o que você descreveu — não conseguimos gerar uma explicação mais detalhada agora, vale conferir os detalhes na página da oportunidade.";
  }
  return `${partes.join(", ")}. Vale confirmar os outros detalhes na página oficial antes de se inscrever.`;
}

// 2026-08-24, backstop determinístico pro caso "Prep Program e BRASA
// aparecem muitas vezes, por que? se o estudante não quer fazer graduação
// fora ELES NÃO DEVEM APARECER de jeito nenhum" (reclamação da mantenedora,
// repetida). A Regra 4.5 do system prompt (generate.js) pede pro LLM
// marcar "combina":false pra esse tipo de programa quando o aluno não
// pediu isso — testado ao vivo e confirmado inconsistente: o
// meta/llama-3.1-8b-instruct pega uns e deixa passar outros no mesmo lote,
// mesmo com exemplos concretos no prompt (ver docs/decisions.md). Um
// modelo maior (nvidia/llama-3.3-nemotron-super-49b-v1, mesma chave NIM)
// foi testado e é rápido demais pra durar — 5+ oportunidades no mesmo lote
// já passam de 60s. Pra esse padrão específico e bem definido, mesma
// filosofia do ageFilter.js: sinal estruturado > julgamento de LLM.
// Lista curada de oportunidades cujo PROPÓSITO INTEIRO é preparar/levar o
// aluno pra cursar graduação no exterior (não um componente logístico
// dentro de outra coisa — ver Regra 4.5 pra essa distinção). Comparado em
// minúsculas contra o título real do banco.
const DEGREE_ABROAD_PROGRAMS = [
  "prep program",
  "brasa pré fundamentos",
  "brasa pré americas",
  "bolsa crimson",
  "uwc",
  "programa oportunidades acadêmicas",
];

// Sinal de que o aluno REALMENTE pediu isso. CORRIGIDO 2026-08-24 (achado
// real testando o cenário de free text puro, mas o bug já existia hoje pro
// wizard guiado também): a versão anterior incluía o chip "Fazer um
// intercâmbio ou programa de verão fora do Brasil" e a palavra solta
// "intercâmbio"/"estudar fora do brasil"/"estudar no exterior" como sinal
// de liberação — errado, porque os 5 programas desta lista (Prep Program,
// BRASA, Bolsa Crimson, UWC, Programa Oportunidades Acadêmicas) são TODOS
// sobre GRADUAÇÃO/FACULDADE INTEIRA no exterior, não sobre um intercâmbio
// curto ou programa de verão — são objetivos diferentes na própria lista de
// `objetivosDisponiveis` (ver AccessIA.vue: 'intercambio-curto' vs
// 'graduacao-exterior'). Com a regex antiga, um aluno que só queria um mês
// de verão fora (ou que nem queria nada — ex: "minha irmã fez intercâmbio",
// "não tenho interesse em intercâmbio") acabava liberando o Prep Program de
// volta, exatamente o bug que esse backstop existe pra evitar. Agora só
// libera com sinal explícito de GRADUAÇÃO/FACULDADE completa fora do Brasil.
const WANTS_DEGREE_ABROAD_REGEX =
  /cursar a gradua[çc][ãa]o inteira fora do brasil|gradua[çc][ãa]o (completa )?(no exterior|fora do brasil)|faculdade (inteira )?(no exterior|fora do brasil|nos eua|nos estados unidos)/i;

// 2026-08-24 (item 2 de `docs/analysis-pipeline-rag-2026-08-24.md`): `reweight.js`
// só reordena por viagem internacional quando `localPreferencia` (campo
// ESTRUTURADO do wizard) veio como "brasil" — se o aluno escreveu isso em
// texto livre puro (sem passar pelo wizard, ou tendo esquecido de marcar o
// botão) o sinal nunca chegava em `reweight()`. Esta regex cobre só a frase
// NEGATIVA e inequívoca ("não quero viajar/sair do Brasil/estudar fora") —
// deliberadamente estreita: um falso positivo aqui só REORDENA (nunca
// filtra, ver reweight.js/Parte 1 do plano), mas um falso positivo capturando
// frases ambíguas ainda desceria oportunidades de intercâmbio que o aluno
// poderia querer, então não vale arriscar padrões genéricos demais.
const NAO_QUER_VIAJAR_REGEX =
  /n[ãa]o (quero|posso|pretendo) (viajar|sair do (brasil|pa[íi]s)|estudar fora|morar fora)|prefiro (ficar|continuar) no brasil|n[ãa]o tenho interesse em (viajar|intercâmbio|estudar fora|morar fora)/i;

// 2026-08-24: achado real de produção — `generateRecommendations()` pede UMA
// resposta JSON pro lote inteiro (8 oportunidades, por eficiência). Se o
// modelo derrapar em UMA (JSON truncado, id inventado, id faltando), o lote
// INTEIRO jogava um erro só, e o catch em cima disso caía pro motivo
// genérico pra TODAS as 8 — inclusive as 7 que teriam saído bem. É
// exatamente o "motivo genérico" que a mantenedora pediu pra nunca acontecer
// (Regra 4.1 do prompt), só que causado pela infraestrutura, não pelo
// prompt. Aqui, em vez de aceitar tudo-ou-nada: tenta o lote inteiro uma vez
// (erro pode ser transiente); se falhar de novo e o lote tiver mais de 1
// item, divide em duas metades e tenta cada uma recursivamente — isola o(s)
// item(ns) realmente problemático(s) em vez de sacrificar o lote todo. Só
// cai no motivo estruturado (`buildFallbackReason`) pro item que ainda falha
// depois de isolado sozinho.
async function generateComFallbackIsolado(freeText, opportunities) {
  if (opportunities.length === 0) return [];
  try {
    return await generateRecommendations(freeText, opportunities);
  } catch (err) {
    if (opportunities.length === 1) {
      console.error(
        `[rag/match] Geração falhou pra oportunidade isolada (id ${opportunities[0].id}), usando motivo padrão:`,
        err.message
      );
      return [{ id: opportunities[0].id, why_it_fits: buildFallbackReason(opportunities[0]), caveats: "", _fallback: true }];
    }
    console.error(
      `[rag/match] Geração falhou pro lote de ${opportunities.length}, tentando de novo em duas metades:`,
      err.message
    );
    const meio = Math.ceil(opportunities.length / 2);
    const [primeiraMetade, segundaMetade] = await Promise.all([
      generateComFallbackIsolado(freeText, opportunities.slice(0, meio)),
      generateComFallbackIsolado(freeText, opportunities.slice(meio)),
    ]);
    return [...primeiraMetade, ...segundaMetade];
  }
}

export default defineEventHandler(async (event) => {
  const startedAt = Date.now();

  const ip = getClientIp(event);
  if (!checkRateLimit(`rag-match:${ip}`, RATE_LIMIT)) {
    throw createError({ statusCode: 429, statusMessage: "Muitas buscas em pouco tempo. Tente de novo em alguns minutos." });
  }

  const body = await readBody(event);
  const {
    freeText,
    keywordText,
    userId,
    sessionId,
    // 2026-08-24: subidos de 20/8 pra 30/15 — agora que existe o filtro de
    // utilidade real (Regra 4.5 em generate.js, "combina") escondendo
    // oportunidades que não servem de fato, um pool de entrada estreito
    // pode sobrar com poucos itens depois do filtro (caso real: perfil
    // Fundamental + Biologia trouxe 8 candidates, 5 foram corretamente
    // escondidos por nível incompatível, sobrando só 3 pro aluno ver).
    // Pedido direto da mantenedora: "só apareceram 3, não poderiam
    // aparecer 15?" — a resposta certa não é afrouxar o filtro de
    // utilidade, é dar mais candidates pra ele filtrar. Isso é diferente do
    // teste antigo (RETRIEVAL_COUNT 30/40/60 piorava precision) porque
    // aquele teste era de ANTES do filtro de utilidade existir — sem ele,
    // mostrar tudo sem filtro é que trocava recall por precision; com ele,
    // mais candidates = mais chance do filtro achar itens que realmente
    // servem, não mais ruído chegando até o aluno.
    matchCount = 30,
    finalCount = 15,
    // Sinal estruturado opcional (Parte 4 do plano — reweight nunca
    // implementado até 2026-08-23): 'brasil' | 'fora' | 'ambos' | null,
    // mesmas chaves de `respostas.local` em components/AccessIA.vue. Não
    // filtra nada aqui — só reordena depois do rerank, ver reweight.js.
    localPreferencia = null,
    // Idade do aluno (de `profiles.age`, cadastro real — nunca inferida de
    // série/nível, ver server/utils/rag/ageFilter.js e Parte 3 do plano).
    // Opcional: sem idade, nenhum corte por idade é aplicado (mesma regra
    // de "campo ausente não filtra").
    idade = null,
  } = body || {};

  const idadeAluno = Number.isFinite(Number(idade)) ? Number(idade) : null;

  // Ver DEGREE_ABROAD_PROGRAMS acima — checado uma vez aqui,
  // usado depois na montagem de `recommendacoesComEscondidas`.
  const alunoQuerExterior = WANTS_DEGREE_ABROAD_REGEX.test(freeText);

  // Ver NAO_QUER_VIAJAR_REGEX acima (item 2 da análise 2026-08-24) — só
  // completa `localPreferencia` quando o aluno não marcou nada no campo
  // estruturado; se ele já marcou "fora"/"ambos" explicitamente, isso
  // continua valendo (nunca sobrescreve um sinal estruturado real).
  const localPreferenciaDoTextoLivre = NAO_QUER_VIAJAR_REGEX.test(freeText) ? "brasil" : null;

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

  // 2026-08-24 (a pedido da mantenedora): a cota mensal por aluno (Parte
  // 5.5) deixou de BLOQUEAR a busca — continuamos contando (telemetria útil
  // pra entender uso real), mas nunca devolvemos 429 por isso. Se a
  // contagem falhar por qualquer motivo (ex: tabela indisponível), a busca
  // segue mesmo assim — cota é dado auxiliar, nunca deveria impedir o aluno
  // de usar a Accessia.

  // Uma chamada só: entender a consulta, BM25F + vetor fundidos, boosts
  // estruturados e cross-encoder. Ver search.js.
  const { analysis, results, todosCandidatos, diagnostico } = await search(
    {
      texto: freeText,
      areas: keywordText ? keywordText.split(/[,\s]+/).filter(Boolean) : [],
      nivel: normalizeLevel(body?.nivel ?? null),
      condicaoFinanceira: body?.condicaoFinanceira ?? null,
      local: localPreferencia,
      linguas: body?.linguas ?? null,
    },
    { candidates: matchCount, topK: finalCount }
  );

  // Filtro rígido de idade (Parte 1/3 do plano): só corta quando a
  // oportunidade declara faixa EXPLÍCITA no texto e a idade do aluno cai fora
  // dela — nunca infere de nível/série (ver ageFilter.js).
  const { kept: eligible, excluded: excluidosPorIdade } = filterByAge(results, idadeAluno);
  if (excluidosPorIdade.length > 0) {
    console.log(
      `[rag/match] ${excluidosPorIdade.length} oportunidade(s) fora da faixa de idade declarada (aluno: ${idadeAluno} anos): ${excluidosPorIdade
        .map((o) => `${o.title} (${JSON.stringify(o._idadeExcluidaFaixa)})`)
        .join(", ")}`
    );
  }

  const beforeRerank = (todosCandidatos ?? results).map((o) => ({
    ...o,
    rrf_score: o.fusao,
    vector_rank: o.rankVetor ?? null,
    fts_rank: o.rankLexical ?? null,
  }));

  // Nada elegível sobrou (ex: idade do aluno fora de toda faixa declarada
  // entre os candidatos recuperados) — a pedido da mantenedora, dizemos isso
  // com honestidade em vez de forçar oportunidades sem relação real com o
  // aluno só pra preencher `finalCount`. Nunca chega à geração por LLM nesse
  // caso (não haveria nada real pra ancorar a explicação).
  if (eligible.length === 0) {
    const latencyMsVazio = Date.now() - startedAt;
    return {
      query: { freeText, keywordText, localPreferencia },
      beforeRerank: beforeRerank.map((o) => ({ id: o.id, title: o.title })),
      afterRerank: [],
      noOpportunitiesFound: true,
      mensagem:
        "Não encontramos nenhuma oportunidade pro seu perfil agora — o catálogo muda com frequência, então vale a pena voltar e tentar de novo em algumas semanas.",
      generationDegraded: false,
    };
  }

  // O rerank já aconteceu dentro de search(); aqui só aplicamos o corte de
  // idade e cortamos pro finalCount.
  const afterRerank = eligible.slice(0, finalCount);

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
  // `generateComFallbackIsolado` já faz o retry-e-bisseca por dentro — só
  // cai no motivo estruturado por oportunidade individual, nunca pro lote
  // inteiro (ver comentário na função). `generationDegraded` aqui significa
  // "pelo menos uma oportunidade usou o motivo de fallback", só pra
  // telemetria interna — não afeta o que é mostrado.
  const explanations = await generateComFallbackIsolado(freeText, afterRerank);
  const explanationById = new Map(explanations.map((e) => [e.id, e]));
  const recommendacoesComEscondidas = afterRerank.map((opp) => ({
    ...opp,
    why_it_fits: explanationById.get(opp.id)?.why_it_fits ?? buildFallbackReason(opp),
    caveats: explanationById.get(opp.id)?.caveats ?? "",
    // Regra 4.5 do system prompt (generate.js): o LLM decide "combina" com
    // base em utilidade REAL pro aluno (nível incompatível, área sem
    // relação, já fez essa mesma oportunidade) — nunca por ressalva menor
    // (inscrição encerrada/viagem continuam "combina":true, ver Regras
    // 7/8). O motivo de fallback (quando a geração falha) não tem esse
    // julgamento, então sempre entra como combina:true — falha pro lado
    // seguro (mostrar de mais é reversível, esconder não é).
    combina:
      DEGREE_ABROAD_PROGRAMS.some((nome) => opp.title?.toLowerCase().includes(nome)) && !alunoQuerExterior
        ? false
        : explanationById.get(opp.id)?.combina !== false,
  }));

  // 2026-08-24 (item 5 da análise — `DEGREE_ABROAD_PROGRAMS` só
  // cobre 5 programas curados manualmente, não generaliza pra oportunidade
  // nova com o mesmo padrão). Não dá pra generalizar isso com segurança sem
  // dado — um regex genérico demais erraria pro lado de esconder
  // oportunidade real (o erro mais caro, Parte 1 do plano). Em vez disso,
  // só sinalizamos em log quando uma oportunidade NÃO está na lista curada,
  // o aluno não pediu exterior, mas o título sugere o mesmo padrão (bolsa +
  // graduação/faculdade fora) — vira candidata pra alguém revisar e, se de
  // fato for o mesmo caso, adicionar manualmente à lista.
  const SUSPEITA_GRADUACAO_EXTERIOR_REGEX =
    /(bolsa|programa) .*(gradua[çc][ãa]o|faculdade|bacharelado) .*(exterior|fora do brasil|eua|estados unidos)|(gradua[çc][ãa]o|faculdade|bacharelado) .*(exterior|fora do brasil|eua|estados unidos) .*(bolsa|programa)/i;
  if (!alunoQuerExterior) {
    const suspeitas = recommendacoesComEscondidas.filter(
      (o) =>
        o.combina &&
        !DEGREE_ABROAD_PROGRAMS.some((nome) => o.title?.toLowerCase().includes(nome)) &&
        SUSPEITA_GRADUACAO_EXTERIOR_REGEX.test(`${o.title ?? ""} ${o.description ?? ""}`)
    );
    if (suspeitas.length > 0) {
      console.log(
        `[rag/match] candidata(s) pro backstop OPORTUNIDADES_GRADUACAO_EXTERIOR (título sugere graduação/faculdade completa fora do Brasil, não está na lista, aluno não pediu exterior): ` +
          suspeitas.map((o) => `id=${o.id} "${o.title}"`).join(", ")
      );
    }
  }

  // 2026-08-24, a pedido da mantenedora: "se não tem opp para o estudante,
  // diga que não há, não coloque oportunidades que o estudante não irá
  // usar" — filtra as marcadas combina:false ANTES de devolver. Se sobrar
  // zero depois do filtro, é o mesmo caso "sem oportunidade" de cima (linha
  // ~152), só que descoberto depois da geração em vez de antes do rerank —
  // a decisão de utilidade real só existe depois que o LLM analisa cada
  // oportunidade junto do perfil, não antes.
  const recommendations = recommendacoesComEscondidas.filter((o) => o.combina);
  const escondidasPorNaoServir = recommendacoesComEscondidas.filter((o) => !o.combina);
  if (escondidasPorNaoServir.length > 0) {
    console.log(
      `[rag/match] ${escondidasPorNaoServir.length} oportunidade(s) escondida(s) por não servirem de fato pro aluno: ${escondidasPorNaoServir
        .map((o) => o.title)
        .join(", ")}`
    );
  }

  // "Pelo menos uma oportunidade usou o motivo de fallback" — só telemetria
  // interno, nunca afeta o que é mostrado ao aluno.
  const generationDegraded = afterRerank.some((opp) => explanationById.get(opp.id)?._fallback === true);

  if (recommendations.length === 0) {
    const latencyMs0 = Date.now() - startedAt;
    return {
      query: { freeText, keywordText, localPreferencia },
      beforeRerank: beforeRerank.map((o) => ({ id: o.id, title: o.title })),
      afterRerank: [],
      noOpportunitiesFound: true,
      mensagem:
        "Não encontramos nenhuma oportunidade pro seu perfil agora — o catálogo muda com frequência, então vale a pena voltar e tentar de novo em algumas semanas.",
      generationDegraded,
    };
  }

  const latencyMs = Date.now() - startedAt;


  return {
    query: { freeText, keywordText, localPreferencia },
    beforeRerank: beforeRerank.map((o) => ({ id: o.id, title: o.title })),
    afterRerank: recommendations,
    generationDegraded,
    // Novos campos, aditivos: `analysis` é o que o pipeline entendeu do texto
    // do aluno (áreas, nível, preferências negativas) e `diagnostico` diz qual
    // estratégia rodou e se cada etapa respondeu. Nada no frontend depende
    // deles ainda; existem porque a pergunta "por que ISSO apareceu pra mim?"
    // era impossível de responder sem abrir o log do servidor.
    analise: analysis,
    diagnostico,
  };
});
