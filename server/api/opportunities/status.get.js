export default defineEventHandler(async (event) => {
  try {
    // This endpoint just returns cache status without fetching data
    const response = await $fetch('/api/opportunities')
    
    return {
      cached: response.cached || false,
      lastUpdated: response.lastUpdated || null,
      nextUpdate: response.nextUpdate || null,
      dataCount: response.data?.length || 0,
      timestamp: new Date().toISOString()
    }
    
  } catch (error) {
    return {
      error: 'Unable to check cache status',
      timestamp: new Date().toISOString()
    }
  }
})
