import SteinStore from "stein-js-client";

// Initialize Stein store
const steinStore = new SteinStore(
  "https://api.steinhq.com/v1/storages/688b7cadc088333365c51e2a"
);

// In-memory cache
let cachedData = null;
let lastFetch = 0;
const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

export default defineEventHandler(async (event) => {
  const now = Date.now();
  
  // Check if we have cached data and if it's still valid
  if (cachedData && (now - lastFetch) < CACHE_DURATION) {
    console.log("[API] Serving cached opportunities data");
    return {
      data: cachedData,
      cached: true,
      lastUpdated: new Date(lastFetch).toISOString(),
      nextUpdate: new Date(lastFetch + CACHE_DURATION).toISOString()
    };
  }

  try {
    console.log("[API] Fetching fresh opportunities data from Stein");
    
    // Fetch fresh data from Stein API
    const freshData = await steinStore.read("All");
    
    // Process the data (same logic as in your component)
    const processedData = freshData.map((opp, index) => ({
      id: String(index + 1),
      ...opp,
      keywords: opp.keywords
        ? opp.keywords.split(",").map((k) => k.trim().toLowerCase())
        : [],
      audience: opp.audience
        ? opp.audience.split(",").map((a) => a.trim())
        : [],
      fields: opp.fields 
        ? opp.fields.split(",").map((f) => f.trim()) 
        : [],
      tuition: opp.tuition ? opp.tuition.trim() : "",
    }));

    // Update cache
    cachedData = processedData;
    lastFetch = now;
    
    console.log(`[API] Cached ${processedData.length} opportunities`);
    
    return {
      data: processedData,
      cached: false,
      lastUpdated: new Date(lastFetch).toISOString(),
      nextUpdate: new Date(lastFetch + CACHE_DURATION).toISOString()
    };
    
  } catch (error) {
    console.error("[API] Error fetching opportunities:", error);
    
    // If we have cached data but fetch failed, return cached data with error info
    if (cachedData) {
      return {
        data: cachedData,
        cached: true,
        error: "Failed to fetch fresh data, serving cached version",
        lastUpdated: new Date(lastFetch).toISOString(),
        nextUpdate: new Date(lastFetch + CACHE_DURATION).toISOString()
      };
    }
    
    // If no cached data and fetch failed, return error response
    setResponseStatus(event, 500);
    return {
      error: "Failed to fetch opportunities data",
      message: error.message || "Unknown error"
    };
  }
});
