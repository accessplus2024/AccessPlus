import { useSupabase } from "./supabaseClient";

let cachedData = null;
let lastFetch = 0;
const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

async function fetchFromSupabase() {
  const supabase = useSupabase();
  const { data, error } = await supabase
    .from("opportunities")
    .select("*")
    .eq("status", "Aprovada")
    .order("id");

  if (error) throw error;
  return data;
}

function cacheMeta() {
  return {
    lastUpdated: new Date(lastFetch).toISOString(),
    nextUpdate: new Date(lastFetch + CACHE_DURATION).toISOString(),
  };
}

export async function getOpportunities() {
  const now = Date.now();

  if (cachedData && now - lastFetch < CACHE_DURATION) {
    return { data: cachedData, cached: true, ...cacheMeta() };
  }

  try {
    const freshData = await fetchFromSupabase();
    cachedData = freshData;
    lastFetch = now;
    return { data: cachedData, cached: false, ...cacheMeta() };
  } catch (error) {
    if (cachedData) {
      return {
        data: cachedData,
        cached: true,
        error: "Failed to fetch fresh data, serving cached version",
        ...cacheMeta(),
      };
    }
    throw error;
  }
}

export function invalidateOpportunitiesCache() {
  cachedData = null;
  lastFetch = 0;
}
