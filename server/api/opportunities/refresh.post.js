import { getOpportunities, invalidateOpportunitiesCache } from "../../utils/opportunitiesCache";

// Este endpoint é chamado pelo cron do Vercel (ver vercel.json) e faz um
// trabalho "caro" (invalida o cache + consulta o Supabase de novo). Sem essa
// checagem, qualquer pessoa na internet poderia chamá-lo repetidamente.
// A Vercel envia automaticamente "Authorization: Bearer <CRON_SECRET>" nas
// chamadas de cron — defina CRON_SECRET nas variáveis de ambiente.
function autorizado(event) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // sem segredo configurado = fecha por padrão
  const auth = getHeader(event, "authorization");
  return auth === `Bearer ${secret}`;
}

export default defineEventHandler(async (event) => {
  if (!autorizado(event)) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

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
