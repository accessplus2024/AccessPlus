import { devSupabase } from "./devClient.js";

export async function getChunkCount() {
  const { count, error } = await devSupabase
    .from("opportunity_chunks")
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(`Erro ao contar chunks: ${error.message}`);
  return count;
}

export async function getOpportunityCount() {
  const { count, error } = await devSupabase
    .from("opportunities")
    .select("*", { count: "exact", head: true })
    .eq("status", "Aprovada");
  if (error) throw new Error(`Erro ao contar oportunidades: ${error.message}`);
  return count;
}
