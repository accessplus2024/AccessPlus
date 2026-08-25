import { devSupabase } from "./ragClient.js";

export async function ftsSearch(queryText, matchCount = 20) {
  const { data, error } = await devSupabase.rpc("match_opportunities_fts", {
    query_text: queryText,
    match_count: matchCount,
  });

  if (error) throw new Error(`Erro na busca por palavra-chave: ${error.message}`);
  return data;
}
