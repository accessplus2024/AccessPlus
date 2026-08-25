import { supabase } from "./supabase-client.js";

// Colunas que `buildPassage()` (chunk-opportunity.js) precisa. `type`, `format`
// e `inscricoes` são obrigatórias: sem elas a passagem sai sem o tipo da
// oportunidade, e "quero fazer um MUN" não encontra MUN nenhum.
const COLUMNS =
  "id, title, description, eligibility, keywords, areas, applicants, process, additionals, type, format, inscricoes, language, location, audience, level, cost";

export async function getOpportunitiesToEmbed() {
  const { data, error } = await supabase
    .from("opportunities")
    .select(COLUMNS)
    .eq("status", "Aprovada");

  if (error) throw new Error(`Erro ao buscar opportunities: ${error.message}`);
  return data;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const rows = await getOpportunitiesToEmbed();
  console.log(`Encontradas ${rows.length} oportunidades aprovadas.`);
  console.log("Exemplo:", rows[0]);
}
