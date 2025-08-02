import SteinStore from "stein-js-client";

// Initialize Stein store
const steinStore = new SteinStore(
  "https://api.steinhq.com/v1/storages/688b7cadc088333365c51e2a"
);

export default defineEventHandler(async (event) => {
  try {
    console.log('Manual refresh triggered')
    
    const response = await steinStore.read("All")
    
    // Process the data
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

    console.log(`Manual refresh completed: ${processedData.length} opportunities`)
    
    return {
      success: true,
      message: `Successfully refreshed ${processedData.length} opportunities`,
      count: processedData.length,
      timestamp: new Date().toISOString()
    }
    
  } catch (error) {
    console.error('Manual refresh error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to refresh opportunities data'
    })
  }
})
