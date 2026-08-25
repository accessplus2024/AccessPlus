import { useSupabase } from "./supabaseClient";

let cachedData = null;
let lastFetch = 0;
const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

// Colunas leves usadas pela listagem/home. NÃO inclui os textos-guia
// (eligibility/process/applicants/additionals/resources) nem o `embedding`
// (vetor de 1024 números usado só pela busca por IA) — esses campos só são
// necessários na página de detalhe, que busca a linha individualmente
// (ver server/api/opportunities/[id].get.js). Buscar tudo aqui multiplicava
// o tráfego do Supabase por ~200x sem necessidade.
//
// 2026-08-24 — schema novo: `format`, `location` e `language` passaram a ter
// 100% de coverage depois da reanotação (docs/metricas-campos-2026-08-24.md)
// e agora alimentam filtros e selos da listagem. `deadline` entra porque o
// card precisa avisar quando o prazo existe. `inscricoes` é a coluna nova que
// separa "aprovada pela curadoria" (status) de "dá pra se inscrever hoje"
// (inscricoes) — os dois sentidos moravam em `status` no schema antigo.
const LIST_COLUMNS =
  "id, title, description, type, level, audience, cost, areas, keywords, status, format, location, language, deadline, inscricoes";

// Mesmo conjunto sem `inscricoes`, para o banco que ainda não recebeu a
// migração (produção antes de rodar docs/sql/2026-08-25-inscricoes.sql).
// Sem este fallback, fazer o deploy do site antes da migração derrubaria a
// listagem inteira com "column opportunities.inscricoes does not exist".
const LIST_COLUMNS_LEGADO =
  "id, title, description, type, level, audience, cost, areas, keywords, status, format, location, language, deadline";

// "Aprovada" = passou pela curadoria. "Encerrada" só aparece aqui pelo schema
// ANTIGO, em que `status` carregava também o estado da inscrição; no schema
// novo toda linha visível é "Aprovada" e quem diz se fechou é `inscricoes`.
// Manter os dois valores faz esta rota funcionar antes e depois da migração.
const STATUS_VISIVEIS = ["Aprovada", "Encerrada"];

// Uma única fonte de verdade para "as inscrições estão abertas?", tolerante
// aos dois schemas: usa a coluna quando ela existe, e deriva do `status`
// antigo quando não existe.
function normalizar(linha) {
  const inscricoes =
    linha.inscricoes ?? (linha.status === "Encerrada" ? "Encerrada" : "Aberta");
  return { ...linha, inscricoes, aberta: inscricoes === "Aberta" };
}

async function fetchFromSupabase() {
  const supabase = useSupabase();

  let { data, error } = await supabase
    .from("opportunities")
    .select(LIST_COLUMNS)
    .in("status", STATUS_VISIVEIS)
    .order("id");

  // 42703 = undefined_column no Postgres. Único caso em que vale reconsultar:
  // o banco ainda não tem `inscricoes`.
  if (error && (error.code === "42703" || /inscricoes/i.test(error.message ?? ""))) {
    ({ data, error } = await supabase
      .from("opportunities")
      .select(LIST_COLUMNS_LEGADO)
      .in("status", STATUS_VISIVEIS)
      .order("id"));
  }

  if (error) throw error;
  return (data ?? []).map(normalizar);
}

function cacheMeta() {
  return {
    lastUpdated: new Date(lastFetch).toISOString(),
    nextUpdate: new Date(lastFetch + CACHE_DURATION).toISOString(),
  };
}

export async function getOpportunities() {
  const now = Date.now();

  if (cachedData && now - lastFetch < CACHE_DURATION) {
    return { data: cachedData, cached: true, ...cacheMeta() };
  }

  try {
    const freshData = await fetchFromSupabase();
    cachedData = freshData;
    lastFetch = now;
    return { data: cachedData, cached: false, ...cacheMeta() };
  } catch (error) {
    if (cachedData) {
      return {
        data: cachedData,
        cached: true,
        error: "Failed to fetch fresh data, serving cached version",
        ...cacheMeta(),
      };
    }
    throw error;
  }
}

export function invalidateOpportunitiesCache() {
  cachedData = null;
  lastFetch = 0;
}
