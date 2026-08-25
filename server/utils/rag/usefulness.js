// O que de fato chega ao aluno, depois que a busca já ordenou.
//
// Mora num arquivo só porque `match.post.js` e `chat.post.js` precisam
// concordar sobre "o que é útil": quando o chat nasceu sem estas regras, um
// aluno que pediu pesquisa em história recebeu Prep Program e UWC.

import { generateRecommendations } from "./generate.js";

// Programas cujo PROPÓSITO INTEIRO é levar o aluno a cursar graduação fora —
// não um componente logístico dentro de outra coisa. Comparado em minúsculas
// contra o título do banco.
export const DEGREE_ABROAD_PROGRAMS = [
  "prep program",
  "brasa pré fundamentos",
  "brasa pré americas",
  "brasa pré europa",
  "bolsa crimson",
  "uwc",
  "programa oportunidades acadêmicas",
  "lala university placement",
];

// Exige sinal EXPLÍCITO de graduação completa fora. Não inclui "intercâmbio"
// nem "programa de verão" de propósito: tratá-los como o mesmo objetivo era o
// bug que este backstop existe para evitar.
export const WANTS_DEGREE_ABROAD_REGEX =
  /cursar a gradua[çc][ãa]o inteira fora do brasil|gradua[çc][ãa]o (completa )?(no exterior|fora do brasil)|faculdade (inteira )?(no exterior|fora do brasil|nos eua|nos estados unidos)|quero (estudar|fazer faculdade) (nos eua|nos estados unidos|no exterior)/i;

// Ponte para o inglês: quando a lista traz alguma oportunidade em inglês, o
// GROW Ambassadors entra no fim como caminho para chegar lá.
//
// O gatilho é o RESULTADO, não o cadastro — se apareceu algo em inglês, apareceu
// uma barreira, e faz sentido oferecer a ponte. Isso é deliberado: a alternativa
// seria disparar por `analysis.inglesFraco`, que depende de `profiles.linguas`,
// removido em 2026-08-25. Aquele sinal hoje identifica 2 de 30 perfis; este
// dispara sempre que a barreira de fato existe na tela.
//
// Não é filtro nem reordenação: nada sai da lista e nada muda de posição. É um
// item extra no fim, dito como o que é.
export const ENGLISH_LEARNING_OPPORTUNITY = "grow ambassadors";

const EM_INGLES = /ingl[êe]s/i;

export function suggestEnglishLearning(recommendations, corpus) {
  const temIngles = recommendations.some((o) => EM_INGLES.test(o.language || o.idioma || ""));
  if (!temIngles) return recommendations;

  const jaEsta = recommendations.some((o) =>
    (o.title || o.titulo || "").toLowerCase().includes(ENGLISH_LEARNING_OPPORTUNITY)
  );
  if (jaEsta) return recommendations;

  const ponte = (corpus ?? []).find((o) =>
    (o.title || "").toLowerCase().includes(ENGLISH_LEARNING_OPPORTUNITY)
  );
  if (!ponte) {
    console.warn(`[usefulness] "${ENGLISH_LEARNING_OPPORTUNITY}" não está no catálogo aprovado — ponte não oferecida`);
    return recommendations;
  }

  return [...recommendations, { ...ponte, _pontePraIngles: true }];
}

// Motivo montado das colunas, só quando a geração por LLM falha. Específico
// da oportunidade, nunca um texto genérico igual para todas.
export function structuredReason(o) {
  const parts = [];
  const areas = Array.isArray(o.areas) ? o.areas.filter(Boolean) : [];
  if (areas.length) parts.push(`É da área de ${areas.join(", ")}`);
  const level = Array.isArray(o.level) ? o.level.join(", ") : o.level;
  if (level) parts.push(`voltada para ${level}`);
  if (o.cost) parts.push(`com custo declarado como "${o.cost}"`);
  if (!parts.length) {
    return "Apareceu na sua busca por combinar com o que você descreveu — vale conferir os detalhes na página da oportunidade.";
  }
  return `${parts.join(", ")}. Confirme os outros detalhes na página oficial antes de se inscrever.`;
}

// Geração com isolamento de falha por bissecção.
//
// `generateRecommendations` pede UMA resposta JSON para o lote inteiro, então
// um item ruim derruba as 15 explicações de uma vez. Aqui o lote é dividido em
// metades até o culpado ficar sozinho: só ele cai no motivo estruturado.
export async function generateWithIsolation(freeText, opportunities) {
  if (opportunities.length === 0) return [];
  try {
    return await generateRecommendations(freeText, opportunities);
  } catch (err) {
    if (opportunities.length === 1) {
      console.error(`[usefulness] geração falhou isolada (id ${opportunities[0].id}):`, err.message);
      return [{ id: opportunities[0].id, why_it_fits: structuredReason(opportunities[0]), caveats: "", _fallback: true }];
    }
    console.error(`[usefulness] geração falhou no lote de ${opportunities.length}, dividindo:`, err.message);
    const half = Math.ceil(opportunities.length / 2);
    const [a, b] = await Promise.all([
      generateWithIsolation(freeText, opportunities.slice(0, half)),
      generateWithIsolation(freeText, opportunities.slice(half)),
    ]);
    return [...a, ...b];
  }
}

// Corte por relevância relativa ao primeiro colocado, para não completar a
// lista com cauda: medido em "pesquisa em história", do 9º item em diante nada
// tinha a ver com a pergunta.
//
// LIMITAÇÃO CONHECIDA — o piso é relativo ao TOPO, o que o deixa permissivo em
// assunto raro (topo baixo) e severo em assunto denso (topo alto). Num pedido
// sobre olimpíadas cortou OBMEP, OBA, ONC e IChO. `minimo` subiu de 4 para 8
// como mitigação: só mostra MAIS, então não derruba os pisos de qualidade.
// A correção estrutural — cortar pelo degrau entre itens consecutivos, que
// mede ausência de alternativa em vez da força do 1º — precisa de medição.
export function cutByRelevance(ranked, { floor = 0.78, min = 8, max = 15 } = {}) {
  if (!ranked.length) return { shown: [], cut: [] };
  const top = ranked[0].score ?? 1;
  const aboveFloor = ranked.filter((o) => (o.score ?? 0) / top >= floor);
  const howMany = Math.min(max, Math.max(min, aboveFloor.length));

  // A curva no log: sem os números não dá pra saber se o corte pegou cauda
  // ruim ou uma fila de alternativas boas.
  if (ranked.length > howMany) {
    const ratios = ranked.slice(0, max).map((o) => ((o.score ?? 0) / top).toFixed(2)).join(" ");
    console.log(`[usefulness] curva score/topo: ${ratios} | piso ${floor} | acima ${aboveFloor.length} | mostrando ${howMany}`);
  }

  return { shown: ranked.slice(0, howMany), cut: ranked.slice(howMany) };
}

/**
 * Filtro final. Dois mecanismos com pesos diferentes:
 *
 *   - backstop de graduação no exterior: determinístico e medido, corte duro;
 *   - `combina` do LLM (Regra 4.5): REBAIXA para o fim da lista, não esconde.
 *
 * `combina` deixou de esconder em 2026-08-25 por duas razões independentes: a
 * Parte 1 diz que os únicos cortes duros são `status` e a faixa de idade; e o
 * campo é inconsistente de forma reproduzível (a mesma oportunidade alterna
 * true/false entre chamadas, com o `why_it_fits` positivo mesmo quando marca
 * false). A dúvida do modelo vira ressalva que o aluno lê, não sumiço.
 */
export function filterUseful(candidates, studentText, explanations = []) {
  const wantsAbroad = WANTS_DEGREE_ABROAD_REGEX.test(studentText || "");
  const byId = new Map(explanations.map((e) => [Number(e.id), e]));
  const reasons = [];

  const judged = candidates.map((o) => {
    const exp = byId.get(Number(o.id));
    const title = (o.title || o.titulo || "").toLowerCase();

    // Antes do LLM porque o modelo de 8B aplica esta exceção de forma
    // inconsistente — pega uns e deixa passar outros no mesmo lote.
    if (DEGREE_ABROAD_PROGRAMS.some((n) => title.includes(n)) && !wantsAbroad) {
      reasons.push({ id: o.id, titulo: o.title || o.titulo, motivo: "programa de graduação no exterior, e o aluno não pediu isso" });
      return { ...o, _util: false };
    }

    // Sem explicação gerada (a geração falhou) nunca rebaixa: falha pro lado
    // seguro, porque mostrar demais é reversível e esconder não é.
    if (exp?.combina === false) {
      reasons.push({ id: o.id, titulo: o.title || o.titulo, motivo: "rebaixada: o modelo tem dúvida se serve pro aluno (não escondida)" });
      return { ...o, _util: true, _rebaixado: true };
    }
    return { ...o, _util: true, _rebaixado: false };
  });

  const useful = judged.filter((o) => o._util);

  // Particionar em vez de `sort`: nem toda engine garante ordenação estável, e
  // quem o modelo não questionou precisa manter a ordem da busca.
  const recommendations = [
    ...useful.filter((o) => !o._rebaixado),
    ...useful.filter((o) => o._rebaixado),
  ];

  return { recommendations, hidden: judged.filter((o) => !o._util), reasons };
}
