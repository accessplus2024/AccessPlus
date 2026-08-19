// Detecta quando o texto do aluno está, na prática, se referindo a uma
// oportunidade específica do catálogo pelo nome — nesse caso, a resposta
// deve vir do banco de dados (curado, confiável), não de uma busca genérica
// via LLM. Usado principalmente pelo "modo geral" (perguntas gerais).
//
// Estratégia: comparar por sobreposição de palavras significativas (4+
// letras), não por substring exata — um título como "O2" ou "OBB" combinaria
// com qualquer texto que contivesse essas letras por acaso. Exigir 60% das
// palavras significativas do título é uma primeira aproximação simples;
// deve ser recalibrado no gate da Semana 12-13, com dado real de uso.

import { devSupabase } from "./devClient.js";

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

export async function matchOpportunityTitle(text) {
  const { data: opportunities, error } = await devSupabase
    .from("opportunities")
    .select("id, title")
    .eq("status", "Aprovada");

  if (error) throw new Error(`Erro ao buscar títulos: ${error.message}`);

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
