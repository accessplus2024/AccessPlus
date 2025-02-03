// composables/useSteinData.js
import { ref } from "vue";
import { steinStore } from "~/utils/steinStore";

export function useOpportunity() {
  const data = ref(null);
  const loading = ref(false);
  const error = ref(null);

  // Function to fetch data with optional parameters
  async function fetchRow(id) {
    loading.value = true;
    error.value = null;

    const response = await steinStore
      .read("All", { limit: 1, offset: id - 1 })
      .then((res) => {
        data.value = res;
      })
      .catch((err) => console.error(err))
      .finally(() => (loading.value = false));
  }

  return {
    data,
    loading,
    error,
    fetchRow,
  };
}
