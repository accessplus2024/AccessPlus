import { getOpportunities, invalidateOpportunitiesCache } from "../../utils/opportunitiesCache";

export default defineEventHandler(async (event) => {
  try {
    invalidateOpportunitiesCache();
    const result = await getOpportunities();

    return {
      success: true,
      message: `Successfully refreshed ${result.data.length} opportunities`,
      count: result.data.length,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Manual refresh error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to refresh opportunities data",
    });
  }
});
