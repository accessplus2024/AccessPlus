// Detecta quando o texto do aluno está, na prática, se referindo a uma
// oportunidade específica do catálogo pelo nome — nesse caso, a resposta
// deve vir do banco de dados (curado, confiável), não de uma busca genérica
// via LLM. Usado principalmente pelo "modo geral" (perguntas gerais).
//
// Estratégia principal: comparar por sobreposição de palavras significativas
// (4+ letras), não por substring exata — um título como "O2" ou "OBB"
// combinaria com qualquer texto que contivesse essas letras por acaso.
// Exigir 60% das palavras significativas do título é uma primeira
// aproximação simples; deve ser recalibrado no gate da Semana 12-13, com
// dado real de uso.
//
// 2026-08-24: adicionado um passo ANTES desse, pro mesmo bug que
// `scripts/eval/run-golden-set.js` já tinha corrigido em 2026-08-23 (achado
// separadamente ali, nunca portado pra cá): siglas de 3 letras ou menos
// ("OBA", "OBB"...) são descartadas pelo filtro de 4+ letras acima, então
// uma pergunta como "qual o prazo da OBA?" nunca batia com nada — caía
// direto pro modo geral sem contexto de catálogo nenhum, mesmo a OBA
// existindo no banco com prazo preenchido. Agora, antes do critério de
// sobreposição, tenta match a sigla EXATA entre parênteses no título (só
// "OBA" bate com um título que tenha "(OBA)" literal, nunca substring solto
// dentro de outra palavra).

import { devSupabase } from "./ragClient.js";

function normalize(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "");
}

function significantWords(text) {
  return normalize(text)
    .split(/[^a-z0-9]+/i)
    .filter((word) => word.length >= 4);
}

// Extrai siglas entre parênteses do título original (não normalizado), ex:
// "Olimpíada Brasileira de Astronomia (OBA)" → ["OBA"].
function siglasEntreParenteses(title) {
  const encontradas = title.match(/\(([A-Za-zÀ-ÿ0-9]{2,8})\)/g) || [];
  return encontradas.map((s) => s.slice(1, -1));
}

function contemComoPalavra(textoNormalizado, sigla) {
  const siglaNormalizada = normalize(sigla);
  const regex = new RegExp(`\\b${siglaNormalizada}\\b`, "i");
  return regex.test(textoNormalizado);
}

export async function matchOpportunityTitle(text) {
  const { data: opportunities, error } = await devSupabase
    .from("opportunities")
    .select("id, title")
    .eq("status", "Aprovada");

  if (error) throw new Error(`Erro ao buscar títulos: ${error.message}`);

  const textoNormalizado = normalize(text);

  // Passo 1: sigla exata entre parênteses (cobre acrônimos curtos que o
  // filtro de 4+ letras do passo 2 descartaria, como "OBA").
  const siglaMatches = opportunities
    .filter((opp) => siglasEntreParenteses(opp.title).some((sigla) => contemComoPalavra(textoNormalizado, sigla)))
    .map((opp) => ({ ...opp, overlapRatio: 1 }));

  if (siglaMatches.length > 0) return siglaMatches;

  // Passo 2 (fallback): sobreposição de palavras significativas, como antes.
  const queryWords = new Set(significantWords(text));
  if (queryWords.size === 0) return [];

  const matches = opportunities
    .map((opp) => {
      const titleWords = significantWords(opp.title);
      if (titleWords.length === 0) return null;
      const overlap = titleWords.filter((w) => queryWords.has(w)).length;
      const overlapRatio = overlap / titleWords.length;
      return { ...opp, overlapRatio };
    })
    .filter((m) => m && m.overlapRatio >= 0.6)
    .sort((a, b) => b.overlapRatio - a.overlapRatio);

  return matches;
}
