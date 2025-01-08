// composables/useSteinData.js
import { ref } from "vue";
import { steinStore } from "~/utils/steinStore";

export function useSteinData() {
  const data = ref(null);
  const loading = ref(false);
  const error = ref(null);

  // Function to fetch data with optional parameters
  async function fetchSheetData(sheetName, options) {
    loading.value = true;
    error.value = null;

    const response = await steinStore
      .read(sheetName, options)
      .then((res) => {
        data.value = res;
        console.log("[useSteinData] data:", data.value);
      })
      .catch((err) => console.error(err))
      .finally(() => (loading.value = false));
  }

  return {
    data,
    loading,
    error,
    fetchSheetData,
  };
}
