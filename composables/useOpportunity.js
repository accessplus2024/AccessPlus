// composables/useOpportunity.js
import { ref } from "vue";

export function useOpportunity() {
  const data = ref(null);
  const loading = ref(false);
  const error = ref(null);

  // Function to fetch data with optional parameters
  async function fetchRow(id) {
    loading.value = true;
    error.value = null;

    try {
      // Fetch specific opportunity from our cached API
      const response = await $fetch(`/api/opportunities/${id}`);
      
      if (response.data) {
        data.value = [response.data]; // Keep the same format as before (array with single item)
        console.log(`Found opportunity with ID ${id}:`, response.data.Nome || response.data.name);
        
        // Log cache info
        if (response.cached) {
          console.log('Served from cache, last updated:', response.lastUpdated);
        } else {
          console.log('Served fresh data');
        }
      } else {
        console.error(`Opportunity with ID ${id} not found`);
        error.value = new Error(`Opportunity with ID ${id} not found`);
        data.value = [];
      }
    } catch (err) {
      console.error('Error fetching opportunity:', err);
      error.value = err;
      data.value = [];
    } finally {
      loading.value = false;
    }
  }

  return {
    data,
    loading,
    error,
    fetchRow,
  };
}
