import { getOpportunities } from "../../utils/opportunitiesCache";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Opportunity ID is required",
    });
  }

  const result = await getOpportunities();
  const opportunity = result.data.find((opp) => String(opp.id) === String(id));

  if (!opportunity) {
    throw createError({
      statusCode: 404,
      statusMessage: `Opportunity with ID ${id} not found`,
    });
  }

  return { ...result, data: opportunity };
});
