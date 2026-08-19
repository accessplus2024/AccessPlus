import { devSupabase } from "./devClient.js";
import { embedTexts } from "./embedText.js";

export async function vectorSearch(queryText, matchCount = 20) {
  const [queryEmbedding] = await embedTexts([queryText], "query");

  const { data, error } = await devSupabase.rpc("match_opportunity_chunks", {
    query_embedding: queryEmbedding,
    match_count: matchCount,
  });

  if (error) throw new Error(`Erro na busca vetorial: ${error.message}`);
  return data;
}
