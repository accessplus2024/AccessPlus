import SteinStore from "stein-js-client";

// Initialize Stein store
const steinStore = new SteinStore(
  "https://api.steinhq.com/v1/storages/688b7cadc088333365c51e2a"
);

// Shared cache reference (same as in index.get.js)
let cachedData = null;
let lastFetch = 0;
const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Opportunity ID is required'
    });
  }

  try {
    const now = Date.now();
    
    // Check if we have cached data and if it's still valid
    if (cachedData && (now - lastFetch) < CACHE_DURATION) {
      console.log(`[API] Finding opportunity ${id} in cached data`);
      
      // Find the opportunity by ID in cached data
      const opportunity = cachedData.find(opp => opp.id === String(id));
      
      if (opportunity) {
        return {
          data: opportunity,
          cached: true,
          lastUpdated: new Date(lastFetch).toISOString(),
          nextUpdate: new Date(lastFetch + CACHE_DURATION).toISOString()
        };
      } else {
        throw createError({
          statusCode: 404,
          statusMessage: `Opportunity with ID ${id} not found`
        });
      }
    }

    // If no cache, fetch all data and then find the specific opportunity
    console.log(`[API] Fetching fresh data to find opportunity ${id}`);
    
    const freshData = await steinStore.read("All");
    
    // Process the data
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
    
    // Find the specific opportunity
    const opportunity = processedData.find(opp => opp.id === String(id));
    
    if (opportunity) {
      console.log(`[API] Found opportunity ${id}: ${opportunity.Nome}`);
      return {
        data: opportunity,
        cached: false,
        lastUpdated: new Date(lastFetch).toISOString(),
        nextUpdate: new Date(lastFetch + CACHE_DURATION).toISOString()
      };
    } else {
      throw createError({
        statusCode: 404,
        statusMessage: `Opportunity with ID ${id} not found`
      });
    }
    
  } catch (error) {
    console.error(`[API] Error fetching opportunity ${id}:`, error);
    
    // If we have cached data, try to find the opportunity there
    if (cachedData) {
      const opportunity = cachedData.find(opp => opp.id === String(id));
      if (opportunity) {
        return {
          data: opportunity,
          cached: true,
          error: "Failed to fetch fresh data, serving cached version",
          lastUpdated: new Date(lastFetch).toISOString(),
          nextUpdate: new Date(lastFetch + CACHE_DURATION).toISOString()
        };
      }
    }
    
    // If the error was already a createError, re-throw it
    if (error.statusCode) {
      throw error;
    }
    
    // Otherwise, create a generic error
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch opportunity data"
    });
  }
});
