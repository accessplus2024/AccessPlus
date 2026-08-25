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

import { lookupConcept } from "./glossary.mjs";
import { analyzeQuery } from "./expand.mjs";
import { normalizeTitle, tokenize } from "./text.mjs";

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
  perguntaSobreItem: /\b(prazo|deadline|inscri[çc][ãa]o|quando (abre|fecha|termina)|quanto custa|[ée] gratuit|posso (participar|me inscrever)|elegibilidade|quem pode|como (me inscrevo|funciona|aplico)|link|site)\b/i,
};

// Palavras de tipo -> rotulo do catalogo, para intencao de CATEGORIA.
const TIPO_POR_PALAVRA = [
  [/\bmuns?\b|simula[çc][ãa]o da onu|model united/i, "MUNs"],
  [/olimp[íi]ada/i, "Olimpíadas Científicas"],
  [/mentoria/i, "Mentorias"],
  [/est[áa]gio/i, "Estágios"],
  [/bolsa/i, "Bolsas de Estudo"],
  [/interc[âa]mbio/i, "Programas de Intercâmbio"],
  [/concurso (literario|de escrita|de reda[çc][ãa]o)|competi[çc][ãa]o de escrita/i, "Competições de Escrita"],
  [/competi[çc][ãa]o|campeonato|torneio|hackathon/i, "Competições"],
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

  // 3. sobreposicao de palavras significativas do titulo
  const queryWordSet = new Set(tokenize(texto));
  const scored = corpus
    .map((o) => {
      const pal = tokenize(o.title);
      if (!pal.length) return null;
      const inter = pal.filter((p) => queryWordSet.has(p)).length;
      return { o, ratio: inter / pal.length, absolute: inter };
    })
    .filter((x) => x && x.ratio >= 0.6 && x.absolute >= 2)
    .sort((a, b) => b.ratio - a.ratio || b.absolute - a.absolute);

  if (scored.length === 1 || (scored.length > 1 && scored[0].ratio - scored[1].ratio > 0.2)) {
    return { candidates: [scored[0].o], via: "sobreposicao", confianca: "alta" };
  }
  if (scored.length > 1) {
    return { candidates: scored.slice(0, 5).map((x) => x.o), via: "sobreposicao", confianca: "ambigua" };
  }
  return { candidates: [], via: null, confianca: "nenhuma" };
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

  // 3. Categoria: pediu a lista do que existe.
  if (RE.listagem.test(mensagem)) {
    const tipo = TIPO_POR_PALAVRA.find(([re]) => re.test(mensagem))?.[1] ?? null;
    return { intencao: INTENTS.CATEGORIA, tipo, analysis, motivo: "pediu lista/categoria" };
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

  // 5. Pergunta sobre prazo/custo/inscricao sem dizer de qual - se a conversa
  // ja falou de uma oportunidade, e sobre ela.
  if (RE.perguntaSobreItem.test(mensagem)) {
    const ultimaOpp = [...historico].reverse().find((h) => h.oportunidadeId)?.oportunidadeId;
    if (ultimaOpp) {
      const o = corpus.find((x) => x.id === ultimaOpp);
      if (o) return { intencao: INTENTS.OPORTUNIDADE, oportunidade: o, via: "contexto-da-conversa", analysis, motivo: "pergunta de detalhe sobre a oportunidade ja em pauta" };
    }
  }

  // 6. Tem sinal de interesse -> recomendacao
  if (messageAnalysis.areas.length || messageAnalysis.tipos.length || mensagem.split(/\s+/).length >= 6) {
    return { intencao: INTENTS.RECOMENDACAO, analysis, motivo: "sinal de interesse ou texto descritivo" };
  }

  // 7. Curto e sem sinal: trata como exploracao em vez de fora de escopo.
  // Errar pra "vou te ajudar a descobrir" e best que errar pra "nao
  // entendi" - o aluno que escreve pouco e justamente quem mais precisa.
  return { intencao: INTENTS.EXPLORACAO, analysis, motivo: "mensagem curta sem sinal claro" };
}
