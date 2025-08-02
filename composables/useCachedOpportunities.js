export const useCachedOpportunities = () => {
  const data = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const cacheInfo = ref(null)

  const fetchOpportunities = async () => {
    try {
      loading.value = true
      error.value = null
      
      const response = await $fetch('/api/opportunities')
      
      data.value = response.data
      cacheInfo.value = {
        cached: response.cached,
        stale: response.stale,
        refreshing: response.refreshing,
        lastFetch: response.lastFetch,
        nextRefresh: response.nextRefresh,
        fresh: response.fresh
      }
      
      console.log('Opportunities loaded:', {
        count: response.data?.length,
        cached: response.cached,
        stale: response.stale,
        lastFetch: response.lastFetch
      })
      
    } catch (err) {
      console.error('Error fetching cached opportunities:', err)
      error.value = err
    } finally {
      loading.value = false
    }
  }

  const refreshCache = async () => {
    try {
      await $fetch('/api/opportunities/refresh', { method: 'POST' })
      // After successful refresh, fetch the updated data
      await fetchOpportunities()
    } catch (err) {
      console.error('Error refreshing cache:', err)
      throw err
    }
  }

  return {
    data: readonly(data),
    loading: readonly(loading),
    error: readonly(error),
    cacheInfo: readonly(cacheInfo),
    fetchOpportunities,
    refreshCache
  }
}
