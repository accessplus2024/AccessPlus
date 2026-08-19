import { supabase } from "./supabase-client.js";

export async function getOpportunitiesToEmbed() {
  const { data, error } = await supabase
    .from("opportunities")
    .select(
      "id, title, description, eligibility, keywords, areas, applicants, process, additionals, language, location, audience, level, cost, embedded_at, updated_at")
    .eq("status", "Aprovada");

      if (import.meta.url === `file://${process.argv[1]}`) {
  const rows = await getOpportunitiesToEmbed();
  console.log(`Encontradas ${rows.length} oportunidades aprovadas.`);
  console.log("Exemplo:", rows[0]);
  }

  if (error) {
    throw new Error(`Erro ao buscar opportunities: ${error.message}`);
  }

  return data;
}