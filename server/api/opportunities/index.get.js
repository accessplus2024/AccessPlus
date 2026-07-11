import { getOpportunities } from "../../utils/opportunitiesCache";

export default defineEventHandler(async (event) => {
  try {
    return await getOpportunities();
  } catch (error) {
    console.error("[API] Error fetching opportunities:", error);
    setResponseStatus(event, 500);
    return {
      error: "Failed to fetch opportunities data",
      message: error.message || "Unknown error",
    };
  }
});
