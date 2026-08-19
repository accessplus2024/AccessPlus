import { vectorSearch } from "./vectorSearch.js";
import { ftsSearch } from "./ftsSearch.js";
import { getChunkCount, getOpportunityCount } from "./corpusSize.js";

const RRF_K = 60;

function toRankMap(orderedIds) {
  const rankMap = new Map();
  orderedIds.forEach((id, index) => rankMap.set(Number(id), index + 1));
  return rankMap;
}

function bestChunkPerOpportunity(vectorResults) {
  const best = new Map();
  for (const row of vectorResults) {
    const existing = best.get(row.opportunity_id);
    if (!existing || row.similarity > existing.similarity) {
      best.set(row.opportunity_id, row);
    }
  }
  return [...best.values()].sort((a, b) => b.similarity - a.similarity);
}

export async function hybridSearch(freeText, keywordText, matchCount = 10) {
  const [chunkCount, opportunityCount] = await Promise.all([
    getChunkCount(),
    getOpportunityCount(),
  ]);

  const [vectorResultsRaw, ftsResults] = await Promise.all([
    vectorSearch(freeText, chunkCount),
    ftsSearch(keywordText, opportunityCount),
  ]);

  const vectorResults = bestChunkPerOpportunity(vectorResultsRaw);
  const vectorRanks = toRankMap(vectorResults.map((r) => Number(r.opportunity_id)));
  const ftsRanks = toRankMap(ftsResults.map((r) => Number(r.opportunity_id)));

  const allIds = new Set([...vectorRanks.keys(), ...ftsRanks.keys()]);

  const fused = [...allIds].map((id) => {
    const vRank = vectorRanks.get(id);
    const fRank = ftsRanks.get(id);
    const vScore = vRank ? 1 / (RRF_K + vRank) : 0;
    const fScore = fRank ? 1 / (RRF_K + fRank) : 0;
    return {
      opportunity_id: id,
      rrf_score: vScore + fScore,
      vector_rank: vRank ?? null,
      fts_rank: fRank ?? null,
    };
  });

  fused.sort((a, b) => b.rrf_score - a.rrf_score);
  return fused.slice(0, matchCount);
}
