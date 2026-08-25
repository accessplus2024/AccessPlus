// Roteador de intencao do chat. Hoje a Accessia tem dois modos (match e
// geral) e nenhum dos dois cobre tres coisas que o aluno faz o tempo todo:
//   - "ainda nao sei o que quero fazer, me ajuda"  -> precisa CONVERSAR
//   - "o que e MUN?" / "o que e a AccessPlus?"     -> precisa EXPLICAR
//   - "me fala da OBMEP"                            -> precisa a FICHA daquela
//
// Ordem deliberada: sinais deterministas primeiro, LLM so no que sobra.
// Nao e economia - e confiabilidade. "o que e MUN" tem uma resposta certa
// escrita a mao no glossario; deixar um 8B decidir se aquilo era uma pergunta
// conceitual e adicionar uma chance de erro onde nao precisava existir.

import { lookupConcept } from "./glossary.js";
import { analyzeQuery } from "./parseQuery.js";
import { normalizeTitle, tokenize } from "./text.js";

export const INTENTS = {
  OPORTUNIDADE: "oportunidade_especifica",
  CONCEITO: "conceito",
  CATEGORIA: "categoria",
  EXPLORACAO: "exploracao",
  RECOMENDACAO: "recomendacao",
  SAUDACAO: "saudacao",
  FORA_ESCOPO: "fora_escopo",
};

const RE = {
  // O `\b` no fim desta regex era um bug silencioso: em JavaScript, letra
  // acentuada NÃO é caractere de palavra, então `\b` depois de "é" exige uma
  // transição que nunca acontece antes de um espaço. Resultado: "o que é MUN?"
  // NÃO casava (e caía em recomendação), enquanto "o que são mentorias" casava
  // (porque "são" termina em "o", que é caractere de palavra). Só apareceu
  // quando o teste passou a mandar um perfil salvo junto — antes, a mensagem
  // caía por sorte no ramo seguinte e dava o mesmo resultado.
  definicional: /(^|[^a-zà-ÿ])(o que (e|é|sao|são|significa)|que (e|é) (um|uma)|como funciona|pra que serve|me (explica|fala sobre)|explica|qual a diferen[çc]a)/i,
  // "que" solto estava aqui e fazia "o que e MUN?" cair em listagem em vez
  // de conceito. Agora exige quantificador/verbo de existencia de verdade.
  listagem: /\b(quais|howMany?|tem|t[êe]m|existe[m]?|h[áa]|lista|listar|mostra|me mostra|quero ver|alguma?|algum)\b[\s\S]*\b(oportunidades?|programas?|olimp[íi]adas?|muns?|mentorias?|est[áa]gios?|bolsas?|competi[çc][õo]es?|concursos?|interc[âa]mbios?)\b/i,
  saudacao: /^\s*(oi+|ol[áa]|e a[íi]|bom dia|boa tarde|boa noite|hey|hi|tudo bem|opa)[\s!.,?]*$/i,
  perguntaSobreItem: /\b(prazo|deadline|inscri[çc][ãa]o|quando (abre|fecha|termina)|quanto custa|[ée] gratuit|posso (participar|me inscrever)|consigo participar|elegibilidade|quem pode|como (me inscrevo|funciona|aplico)|link|site)\b/i,
  // "Tem outras parecidas?" era um dos CHIPS que a própria Accessia oferecia
  // depois de mostrar uma oportunidade — e o roteador não sabia tratá-lo:
  // caía em "mensagem curta sem sinal claro" e abria o funil de exploração,
  // do zero, ignorando a oportunidade que estava em pauta. Oferecer um botão
  // que o próprio sistema não entende é o pior tipo de bug de conversa,
  // porque o aluno fez exatamente o que foi sugerido.
  parecidas: /\b(outras?|mais) (parecidas?|similares?|como (essa|esse|esta|este)|do mesmo tipo|nesse estilo)\b|parecid[ao]s? com (essa|esse|esta|este)|algo (parecido|similar)/i,
};

// Marcadores de EXCLUSIVIDADE. "apenas competições de escrita" não é uma
// preferência a ser pesada junto de outras — é um pedido para não ver o resto.
// Respeitar isso é respeitar o aluno, não sobrepor-se a ele.
const RE_EXCLUSIVO = /\b(apenas|s[óo]|somente|exclusivamente|nada al[ée]m de|s[óo] quero|quero s[óo])\b/i;

// "bolsa" fica FORA do escopo rígido de propósito: a palavra é ambígua entre o
// tipo "Bolsas de Estudo" e o sentido financeiro ("quero algo com bolsa"). Um
// escopo rígido disparado por ela esconderia olimpíadas gratuitas de quem só
// queria dizer que não pode pagar.
const TIPOS_AMBIGUOS = new Set(["Bolsas de Estudo"]);

// Palavras de tipo -> rotulo do catalogo, para intencao de CATEGORIA.
// Ordem importa: "Competições de Escrita" tem de ser testado ANTES de
// "Competições", senão a categoria específica nunca é alcançada.
//
// Os padrões toleram plural E ausência de acento, porque é assim que o aluno
// digita. "competicoes de escrita" (plural, sem cedilha, sem til) não casava
// com nada na versão anterior — nem com a categoria específica, nem com a
// genérica — e o pedido explícito "apenas competições de escrita" era tratado
// como uma busca vaga qualquer. Escrever regex de português assumindo acento
// correto é assumir um teclado e uma pressa que o aluno não tem.
const CE = "competi[çc][õo]?[ãa]?[eo]?s?";  // competição / competições / competicao / competicoes
const TIPO_POR_PALAVRA = [
  [/\bmuns?\b|simula[çc][õo]?[ãa]?[eo]?s? da onu|model united/i, "MUNs"],
  [/olimp[íi]adas?/i, "Olimpíadas Científicas"],
  [/mentorias?|mentor\b/i, "Mentorias"],
  [/est[áa]gios?|internships?/i, "Estágios"],
  [/bolsas?\b/i, "Bolsas de Estudo"],
  [/interc[âa]mbios?|exchange/i, "Programas de Intercâmbio"],
  [new RegExp(`concursos? (liter[áa]rios?|de escrita|de reda[çc][ãa]o)|${CE} de escrita|${CE} liter[áa]rias?`, "i"), "Competições de Escrita"],
  [new RegExp(`${CE}|campeonatos?|torneios?|hackathons?`, "i"), "Competições"],
];

/**
 * Casamento de titulo/sigla. Reaproveita a licao ja aprendida em
 * titleMatch.js e no golden set: sigla so casa com BORDA DE PALAVRA e entre
 * parenteses (senao "OBB" casa dentro de "OBBiotec" - bug real de 2026-08-23),
 * e titulo casa por sobreposicao de palavras significativas, nao substring.
 */
export function matchOpportunity(texto, corpus) {
  const t = normalizeTitle(texto);
  const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // 1. sigla entre parenteses, palavra inteira
  const byAcronym = corpus.filter((o) => {
    const siglas = (o.title.match(/\(([A-Za-zÀ-ÿ0-9]{2,10})\)/g) ?? []).map((s) => normalizeTitle(s.slice(1, -1)));
    return siglas.some((s) => new RegExp(`\\b${escapeRegex(s)}\\b`).test(t));
  });
  if (byAcronym.length) return { candidates: byAcronym, via: "sigla", confianca: byAcronym.length === 1 ? "alta" : "ambigua" };

  // 2. titulo inteiro contido no texto. Compara SEM o parentetico da sigla:
  // o aluno escreve "Olimpiada Brasileira de Biologia", nao
  // "Olimpiada Brasileira de Biologia (OBB)".
  const withoutParenthetical = (titulo) => normalizeTitle(titulo.replace(/\s*\([^)]*\)\s*/g, " "));
  const byFullTitle = corpus.filter((o) => withoutParenthetical(o.title).length >= 8 && t.includes(withoutParenthetical(o.title)));
  if (byFullTitle.length) {
    const maior = byFullTitle.sort((a, b) => b.title.length - a.title.length);
    return { candidates: [maior[0]], via: "titulo-inteiro", confianca: "alta" };
  }

  // 3. sobreposicao de palavras significativas do titulo.
  //
  // Os limiares aqui foram apertados depois de um falso positivo que sequestrou
  // uma busca inteira: "Procuro bolsa ou intercâmbio de verão fora do Brasil"
  // casou com a oportunidade "Bolsa Daqui para Fora" — 2 das 3 palavras
  // significativas do título ("bolsa", "fora"), razão 0,67, acima do limiar
  // antigo de 0,6. O aluno pediu uma BUSCA e recebeu a ficha de UMA
  // oportunidade que ele nunca mencionou.
  //
  // Três exigências novas, cada uma fechando um jeito de errar:
  //  - razão >= 0,8 em vez de 0,6
  //  - pelo menos 3 palavras casadas (título de 2-3 palavras genéricas como
  //    "Bolsa ... Fora" não pode virar match por coincidência)
  //  - o casamento tem de cobrir parte relevante da PERGUNTA também: match 2
  //    palavras de uma pergunta de 6 é coincidência, não referência.
  const queryWords = tokenize(texto);
  const queryWordSet = new Set(queryWords);
  const scored = corpus
    .map((o) => {
      const pal = tokenize(o.title);
      if (!pal.length) return null;
      const inter = pal.filter((p) => queryWordSet.has(p)).length;
      return {
        o,
        ratio: inter / pal.length,
        absolute: inter,
        queryCoverage: inter / Math.max(1, queryWords.length),
      };
    })
    .filter((x) => x && x.ratio >= 0.8 && x.absolute >= 3 && x.queryCoverage >= 0.5)
    .sort((a, b) => b.ratio - a.ratio || b.absolute - a.absolute);

  if (scored.length === 1 || (scored.length > 1 && scored[0].ratio - scored[1].ratio > 0.2)) {
    return { candidates: [scored[0].o], via: "sobreposicao", confianca: "alta" };
  }
  if (scored.length > 1) {
    return { candidates: scored.slice(0, 5).map((x) => x.o), via: "sobreposicao", confianca: "ambigua" };
  }

  // 4. NOME CURTO: trecho contíguo do título dentro da pergunta.
  //
  // A etapa 3 mede `casadas ÷ palavras DO TÍTULO`, ou seja, quanto do nome
  // oficial o aluno escreveu. Mas ninguém cita um programa pelo nome oficial
  // inteiro: "prazo do nyc summer academy" dá razão 0,43 contra
  // "The School of The New York Times - NYC Summer Academy" e não casava.
  //
  // Baixar o limiar seria errado — os 0,80 vêm de "Procuro bolsa ou
  // intercâmbio de verão fora do Brasil" ter casado com "Bolsa Daqui para
  // Fora" a 0,67. O que separa referência de coincidência não é QUANTO casou:
  // é ser trecho CONTÍGUO e conter palavra RARA no catálogo.
  //
  // Roda depois da etapa 3, que fica intacta: só acrescenta casamento.
  // Coberto por `npm run test:roteador`.
  const df = titleWordFrequency(corpus);
  const queryStr = queryWords.join(" ");

  const byShortName = corpus
    .map((o) => {
      const pal = tokenize(o.title);
      const run = longestContiguousRun(pal, queryStr);
      if (run.length < 3) return null;
      const coverage = run.length / Math.max(1, queryWords.length);
      if (coverage < 0.5) return null;
      if (!run.some((p) => (df.get(p) ?? 0) <= 3)) return null;
      return { o, size: run.length, coverage };
    })
    .filter(Boolean)
    .sort((a, b) => b.size - a.size || b.coverage - a.coverage);

  if (byShortName.length === 1 || (byShortName.length > 1 && byShortName[0].size > byShortName[1].size)) {
    return { candidates: [byShortName[0].o], via: "nome-curto", confianca: "alta" };
  }
  if (byShortName.length > 1) {
    return { candidates: byShortName.slice(0, 5).map((x) => x.o), via: "nome-curto", confianca: "ambigua" };
  }

  return { candidates: [], via: null, confianca: "nenhuma" };
}

// Em howMany TÍTULOS do catálogo cada palavra aparece. Serve para separar
// palavra distintiva ("nyc", "obmep") de palavra de enchimento comum a dezenas
// de títulos ("summer", "program", "bolsa"). Memoizado por corpus: o catálogo
// é carregado uma vez a cada 12h e não muda entre requisições.
const _dfCache = new WeakMap();
function titleWordFrequency(corpus) {
  const cacheado = _dfCache.get(corpus);
  if (cacheado) return cacheado;
  const df = new Map();
  for (const o of corpus) {
    for (const p of new Set(tokenize(o.title))) df.set(p, (df.get(p) ?? 0) + 1);
  }
  _dfCache.set(corpus, df);
  return df;
}

// Maior sequência CONTÍGUA de palavras do título que aparece, na mesma ordem,
// dentro da pergunta. Compara sobre a string de tokens já normalizados, então
// "New York Times" e "new york times" são a mesma coisa.
function longestContiguousRun(titleTokens, queryStr) {
  let best = [];
  for (let i = 0; i < titleTokens.length; i++) {
    for (let j = titleTokens.length; j > i + best.length; j--) {
      const run = titleTokens.slice(i, j);
      if (queryStr.includes(run.join(" "))) { best = run; break; }
    }
  }
  return best;
}

/**
 * @param {string} mensagem  texto do aluno
 * @param {object[]} corpus  catalogo aprovado
 * @param {object} ctx       { historico: [{papel, texto}], perfil }
 */
export function route(mensagem, corpus, ctx = {}) {
  const historico = ctx.historico ?? [];

  // Duas análises, de propósito:
  //  - `analysis` inclui o perfil salvo (áreas marcadas no cadastro, nível) e é
  //    o que a busca vai usar.
  //  - `messageAnalysis` olha SÓ o que o aluno acabou de escrever, e é o que
  //    decide a INTENÇÃO.
  // Sem essa separação, um aluno com "Humanas" salvo no cadastro fazia toda
  // mensagem parecer ter sinal de interesse — e "o que é MUN?" virava
  // recomendação em vez de explicação. Perfil salvo diz o que ele gosta, não
  // o que ele está perguntando agora.
  const analysis = analyzeQuery({
    bio: mensagem,
    areasMarcadas: ctx.perfil?.areas ?? [],
    nivel: ctx.perfil?.nivel ?? null,
    condicaoFinanceira: ctx.perfil?.condicao_financeira ?? null,
    linguas: ctx.perfil?.linguas ?? null,
  });
  const messageAnalysis = analyzeQuery({ bio: mensagem });

  if (RE.saudacao.test(mensagem) && historico.length === 0) {
    return { intencao: INTENTS.SAUDACAO, analysis, motivo: "cumprimento sem conteudo" };
  }

  // 1. Oportunidade especifica. Exige casamento de ALTA confianca - um casamento
  // ambiguo aqui daria a ficha da oportunidade errada, que e pior que nao dar
  // ficha nenhuma.
  const match = matchOpportunity(mensagem, corpus);
  if (match.confianca === "alta") {
    return { intencao: INTENTS.OPORTUNIDADE, oportunidade: match.candidates[0], via: match.via, analysis, motivo: `titulo casou por ${match.via}` };
  }

  // A ordem entre CONCEITO e CATEGORIA e sutil e as duas versoes erradas
  // aconteceram durante o desenvolvimento:
  //   "o que e MUN?"          -> CONCEITO  (quer entender)
  //   "quais MUNs voces tem?" -> CATEGORIA (quer a lista real)
  // As duas frases contem a palavra "MUN". O que separa e a FORMA da
  // pergunta, entao o teste definicional roda primeiro, e a listagem depois.
  const conceitos = lookupConcept(mensagem);
  const ehDefinicional = RE.definicional.test(mensagem);

  // 2. Conceito, quando a pergunta e claramente definicional.
  if (conceitos.length && ehDefinicional) {
    return { intencao: INTENTS.CONCEITO, conceito: conceitos[0], analysis, motivo: "pergunta definicional" };
  }

  // 3. Categoria: pediu a lista do que existe — mas SÓ quando uma categoria
  // concreta é identificada.
  //
  // Antes, bastava match o regex de listagem, e ele aceita "programas?", que
  // aparece em quase qualquer frase. "existe mais algum programa de robótica
  // sem restrições?" virava uma listagem sem categoria, e a resposta era uma
  // amostra do catálogo inteiro — nenhuma robótica entre os 12 itens. O assunto
  // que o aluno pediu ("robótica") era justamente o que se perdia.
  //
  // Sem categoria concreta, isto não é uma pergunta de categoria: é uma busca.
  if (RE.listagem.test(mensagem)) {
    const tipo = TIPO_POR_PALAVRA.find(([re]) => re.test(mensagem))?.[1] ?? null;
    if (tipo) {
      return { intencao: INTENTS.CATEGORIA, tipo, analysis, motivo: `pediu a lista de "${tipo}"` };
    }
    return {
      intencao: INTENTS.RECOMENDACAO,
      analysis,
      motivo: "parecia listagem, mas sem categoria concreta — tratado como busca",
    };
  }

  // 3b. Conceito sem forma definicional: so vale quando nao ha sinal de
  // perfil competindo - senao "quero fazer um MUN" viraria aula sobre MUN em
  // vez de recomendacao de MUNs reais.
  if (conceitos.length) {
    const temSinalDePerfil = messageAnalysis.areas.length > 0 || /\b(quero|gosto|procuro|busco|tenho|estudo|fa[çc]o)\b/i.test(mensagem);
    if (!temSinalDePerfil) {
      return { intencao: INTENTS.CONCEITO, conceito: conceitos[0], analysis, motivo: "gatilho de glossario sem sinal de perfil" };
    }
  }

  // 4. Nao sabe o que quer -> conversa guiada
  if (messageAnalysis.naoSabeOQueQuer) {
    return { intencao: INTENTS.EXPLORACAO, analysis, motivo: "declarou nao saber o que quer" };
  }

  // 5. "Tem outras parecidas?" - recomendacao SEMEADA pela oportunidade que
  // esta em pauta, nao uma busca do zero. Pega as areas e o tipo dela e usa
  // como consulta, que e o que "parecida" significa na pratica.
  if (RE.parecidas.test(mensagem)) {
    const ultimaId = [...historico].reverse().find((h) => h.oportunidadeId)?.oportunidadeId;
    const base = ultimaId ? corpus.find((x) => x.id === ultimaId) : null;
    if (base) {
      const areas = Array.isArray(base.areas) ? base.areas.filter(Boolean) : [];
      return {
        intencao: INTENTS.RECOMENDACAO,
        analysis,
        semente: {
          oportunidadeId: base.id,
          titulo: base.title,
          areas,
          tipos: base.type ? [base.type] : [],
          texto: [
            areas.length ? `Quero algo na area de ${areas.join(", ")}.` : "",
            base.type ? `Do tipo ${base.type}.` : "",
            `Parecido com ${base.title}.`,
          ].filter(Boolean).join(" "),
          excluirId: base.id,
        },
        motivo: `pediu parecidas com "${base.title}"`,
      };
    }
    // Sem oportunidade em pauta, "parecidas com o que?" nao tem resposta - ai
    // sim vale perguntar, em vez de search no escuro.
    return { intencao: INTENTS.EXPLORACAO, analysis, motivo: "pediu parecidas, mas nenhuma oportunidade estava em pauta" };
  }

  // 6. Pergunta sobre prazo/custo/inscricao sem dizer de qual - se a conversa
  // ja falou de uma oportunidade, e sobre ela.
  if (RE.perguntaSobreItem.test(mensagem)) {
    const ultimaOpp = [...historico].reverse().find((h) => h.oportunidadeId)?.oportunidadeId;
    if (ultimaOpp) {
      const o = corpus.find((x) => x.id === ultimaOpp);
      if (o) return { intencao: INTENTS.OPORTUNIDADE, oportunidade: o, via: "contexto-da-conversa", analysis, motivo: "pergunta de detalhe sobre a oportunidade ja em pauta" };
    }
  }

  // 7. Tipo do catálogo pedido EXPLICITAMENTE -> escopo rígido.
  //
  // Este é o único filtro por preferência do aluno em todo o pipeline, e existe
  // por um caso concreto: "e se eu quiser apenas competições de escrita?"
  // devolvia 15 itens com Programa Oportunidades Acadêmicas em 4º e vários
  // Programas Acadêmicos no meio. O boost de tipo é suave por bom motivo (o
  // catálogo tem categorias minúsculas, e ceder no tipo é best que ceder na
  // área) — mas quando o aluno diz "apenas", ele não está expressando
  // preferência, está pedindo para não ver o resto.
  //
  // Exige DOIS sinais para não disparar por engano: um tipo do catálogo
  // nomeado E um marcador de exclusividade.
  const tipoPedido = TIPO_POR_PALAVRA.find(([re]) => re.test(mensagem))?.[1] ?? null;
  if (tipoPedido && !TIPOS_AMBIGUOS.has(tipoPedido) && RE_EXCLUSIVO.test(mensagem)) {
    return {
      intencao: INTENTS.RECOMENDACAO,
      analysis,
      escopoTipo: tipoPedido,
      motivo: `pediu explicitamente apenas "${tipoPedido}"`,
    };
  }

  // 8. Tem sinal de interesse -> recomendacao
  if (messageAnalysis.areas.length || messageAnalysis.tipos.length || mensagem.split(/\s+/).length >= 6) {
    return { intencao: INTENTS.RECOMENDACAO, analysis, motivo: "sinal de interesse ou texto descritivo" };
  }

  // 9. Curto e sem sinal claro. Aqui a resposta certa depende de UMA coisa: a
  // conversa já começou?
  //
  // Se já começou, a mensagem é um REFINAMENTO da busca anterior, não um
  // assunto novo. Caso real que revelou isso: depois de receber uma lista, a
  // aluna escreveu "existe alguma nos estados unidos" — cinco palavras, nenhum
  // rótulo de área, nenhum tipo, nenhum título. O roteador abriu o funil de
  // exploração do zero e respondeu "não consegui entender, deixa eu fazer três
  // perguntas", quando o contexto para entender estava todo ali: ela queria a
  // MESMA busca, filtrada por país. `textForSearch()` no endpoint já junta
  // cadastro + todas as mensagens anteriores + a atual, então a busca tem tudo
  // de que precisa — faltava só o roteador não jogar isso fora.
  //
  // O funil existe para quem não nos deu nada. Quem está no meio de uma
  // conversa já deu muito.
  const conversaJaComecou =
    historico.some((h) => h.papel === "aluno" && h.texto) || historico.some((h) => h.oportunidadeId);
  if (conversaJaComecou) {
    return { intencao: INTENTS.RECOMENDACAO, analysis, refinamento: true, motivo: "mensagem curta, mas a conversa já tem contexto: refinamento da busca anterior" };
  }

  // Primeira mensagem e sem sinal: aí sim o funil. Errar pra "vou te ajudar a
  // descobrir" e best que errar pra "nao entendi" - o aluno que escreve
  // pouco e justamente quem mais precisa.
  return { intencao: INTENTS.EXPLORACAO, analysis, motivo: "primeira mensagem, sem sinal claro" };
}
