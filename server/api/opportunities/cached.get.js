import SteinStore from "stein-js-client";

// Initialize Stein store
const steinStore = new SteinStore(
  "https://api.steinhq.com/v1/storages/688b7cadc088333365c51e2a"
);

// Cache storage - in production, this would be stored in a database or Redis
// For Vercel, we'll use runtime storage (resets on cold starts)
let opportunitiesCache = {
  data: null,
  lastFetch: null,
  isLoading: false
}

const CACHE_DURATION = 12 * 60 * 60 * 1000 // 12 hours in milliseconds

async function fetchFromStein() {
  try {
    console.log('Fetching fresh data from Stein API...')
    const response = await steinStore.read("All")
    
    // Process the data similar to how it's done in the frontend
    const processedData = response.map((opp, index) => ({
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
    }))

    opportunitiesCache = {
      data: processedData,
      lastFetch: Date.now(),
      isLoading: false
    }
    
    console.log(`Successfully cached ${processedData.length} opportunities`)
    return processedData
  } catch (error) {
    console.error('Error fetching from Stein API:', error)
    opportunitiesCache.isLoading = false
    throw error
  }
}

function isCacheValid() {
  if (!opportunitiesCache.data || !opportunitiesCache.lastFetch) {
    return false
  }
  
  const now = Date.now()
  const timeSinceLastFetch = now - opportunitiesCache.lastFetch
  return timeSinceLastFetch < CACHE_DURATION
}

export default defineEventHandler(async (event) => {
  try {
    // Check if cache is valid
    if (isCacheValid()) {
      console.log('Returning cached data')
      return {
        data: opportunitiesCache.data,
        cached: true,
        lastFetch: new Date(opportunitiesCache.lastFetch).toISOString(),
        nextRefresh: new Date(opportunitiesCache.lastFetch + CACHE_DURATION).toISOString()
      }
    }

    // If cache is invalid and not currently loading, fetch new data
    if (!opportunitiesCache.isLoading) {
      opportunitiesCache.isLoading = true
      
      // If we have stale data, return it while fetching fresh data in background
      if (opportunitiesCache.data) {
        console.log('Returning stale data while refreshing in background')
        
        // Fetch fresh data in background (don't await)
        fetchFromStein().catch(err => {
          console.error('Background refresh failed:', err)
        })
        
        return {
          data: opportunitiesCache.data,
          cached: true,
          stale: true,
          lastFetch: new Date(opportunitiesCache.lastFetch).toISOString(),
          refreshing: true
        }
      }
    }

    // No cache available, fetch fresh data
    if (opportunitiesCache.isLoading && !opportunitiesCache.data) {
      // Wait for the current fetch to complete
      let attempts = 0
      while (opportunitiesCache.isLoading && attempts < 50) { // 5 second timeout
        await new Promise(resolve => setTimeout(resolve, 100))
        attempts++
      }
    }

    if (!opportunitiesCache.data) {
      const freshData = await fetchFromStein()
      return {
        data: freshData,
        cached: false,
        lastFetch: new Date(opportunitiesCache.lastFetch).toISOString(),
        fresh: true
      }
    }

    return {
      data: opportunitiesCache.data,
      cached: true,
      lastFetch: new Date(opportunitiesCache.lastFetch).toISOString()
    }

  } catch (error) {
    console.error('API Error:', error)
    
    // If we have any cached data, return it even if stale
    if (opportunitiesCache.data) {
      return {
        data: opportunitiesCache.data,
        cached: true,
        error: 'Failed to refresh data, returning cached version',
        lastFetch: new Date(opportunitiesCache.lastFetch).toISOString()
      }
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch opportunities data'
    })
  }
})
