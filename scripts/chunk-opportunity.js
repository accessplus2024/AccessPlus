// Campos que antes existiam só pra exibição (generate.js) e para o filtro de
// palavra-chave (FTS), mas eram INVISÍVEIS pra busca vetorial — um aluno que
// escreve "meu inglês é básico" ou "não quero viajar pra fora" nunca batia
// contra o idioma/local real de uma oportunidade, porque esses dados nunca
// entravam no texto embeddado. Adicionados aqui em 2026-08-19 (auditoria +
// correção do pipeline de RAG) como frases curtas em português — o objetivo
// não é ranquear alto por esses termos sozinhos, é dar ao embedding alguma
// chance de captar "esse programa é em inglês" / "esse programa é remoto" /
// "esse programa prioriza baixa renda" como parte do significado do texto.
function buildContextFragment(opportunity) {
  const partes = [];
  if (opportunity.language) {
    partes.push(`Idioma do programa: ${opportunity.language}.`);
  }
  if (opportunity.location) {
    partes.push(`Local: ${opportunity.location}.`);
  }
  if (Array.isArray(opportunity.audience) && opportunity.audience.length > 0) {
    partes.push(`Público prioritário: ${opportunity.audience.join(", ")}.`);
  }
  if (Array.isArray(opportunity.level) && opportunity.level.length > 0) {
    partes.push(`Nível: ${opportunity.level.join(", ")}.`);
  } else if (typeof opportunity.level === "string" && opportunity.level.trim().length > 0) {
    partes.push(`Nível: ${opportunity.level}.`);
  }
  if (opportunity.cost) {
    partes.push(`Custo: ${opportunity.cost}.`);
  }
  return partes.join(" ");
}

export function buildChunks(opportunity) {
  const chunks = [];

  const core = [
    opportunity.title,
    opportunity.description,
    opportunity.eligibility,
    Array.isArray(opportunity.keywords) ? opportunity.keywords.join(" ") : opportunity.keywords,
    Array.isArray(opportunity.areas) ? opportunity.areas.join(" ") : opportunity.areas,
    buildContextFragment(opportunity),
  ]
    .filter(Boolean)
    .join("\n");

  if (core.trim().length > 0) {
    chunks.push({ opportunity_id: opportunity.id, field_name: "core", chunk_text: core });
  }

  const optionalFields = ["applicants", "process", "additionals"];
  for (const field of optionalFields) {
    const text = opportunity[field];
    if (typeof text === "string" && text.trim().length > 0) {
      chunks.push({ opportunity_id: opportunity.id, field_name: field, chunk_text: text });
    }
  }

  return chunks;
}