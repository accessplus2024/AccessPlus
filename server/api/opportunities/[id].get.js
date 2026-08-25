import { useSupabase } from "../../utils/supabaseClient";

// Todas as colunas da oportunidade, exceto `embedding` (vetor de 1024
// números usado só pela busca por IA — nunca lido pelo front-end, mas
// pesado o bastante para inflar o tráfego do Supabase sozinho).
//
// 2026-08-24 — schema novo: entram `format` (100% de coverage depois da
// reanotação) e `inscricoes`, a coluna que separa "aprovada" de "aberta".
const DETAIL_COLUMNS =
  "id, title, description, link, deadline, areas, level, location, audience, cost, language, keywords, eligibility, process, applicants, additionals, resources, status, review, created_at, type, format, inscricoes";

// Sem `inscricoes`, para o banco que ainda não recebeu a migração
// (docs/sql/2026-08-25-inscricoes.sql). Ver a mesma nota em
// server/utils/opportunitiesCache.js.
const DETAIL_COLUMNS_LEGADO =
  "id, title, description, link, deadline, areas, level, location, audience, cost, language, keywords, eligibility, process, applicants, additionals, resources, status, review, created_at, type, format";

// "Aprovada" = passou pela curadoria. "Encerrada" só existe no schema antigo,
// em que `status` também carregava o estado da inscrição.
const STATUS_VISIVEIS = ["Aprovada", "Encerrada"];

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Opportunity ID is required",
    });
  }

  const supabase = useSupabase();
  let { data, error } = await supabase
    .from("opportunities")
    .select(DETAIL_COLUMNS)
    .eq("id", id)
    .in("status", STATUS_VISIVEIS)
    .maybeSingle();

  if (error && (error.code === "42703" || /inscricoes/i.test(error.message ?? ""))) {
    ({ data, error } = await supabase
      .from("opportunities")
      .select(DETAIL_COLUMNS_LEGADO)
      .eq("id", id)
      .in("status", STATUS_VISIVEIS)
      .maybeSingle());
  }

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

  const inscricoes =
    data.inscricoes ?? (data.status === "Encerrada" ? "Encerrada" : "Aberta");

  return { data: { ...data, inscricoes, aberta: inscricoes === "Aberta" } };
});
