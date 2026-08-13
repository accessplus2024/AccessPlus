import { useSupabase } from "../../utils/supabaseClient";

// Todas as colunas da oportunidade, exceto `embedding` (vetor de 1024
// números usado só pela busca por IA — nunca lido pelo front-end, mas
// pesado o bastante para inflar o tráfego do Supabase sozinho).
const DETAIL_COLUMNS =
  "id, title, description, link, deadline, areas, level, location, audience, cost, language, keywords, eligibility, process, applicants, additionals, resources, status, review, created_at, type";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Opportunity ID is required",
    });
  }

  const supabase = useSupabase();
  const { data, error } = await supabase
    .from("opportunities")
    .select(DETAIL_COLUMNS)
    .eq("id", id)
    .eq("status", "Aprovada")
    .maybeSingle();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch opportunity data",
    });
  }

  if (!data) {
    throw createError({
      statusCode: 404,
      statusMessage: `Opportunity with ID ${id} not found`,
    });
  }

  return { data };
});
