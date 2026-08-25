import { createClient } from "@supabase/supabase-js";

// Cliente Supabase de todo o pipeline da Accessia (catálogo, chunks).
//
// A URL é a MESMA do site: existe um banco só desde 2026-08-25. O que muda é a
// CHAVE — `opportunity_chunks` tem RLS, então a chave publicável que o site usa
// lê zero linhas ali. A busca precisa de `service_role`.
//
// Por isso a URL cai em SUPABASE_URL e só a chave precisa ser configurada
// à parte no ambiente de deploy.
const URL =
  process.env.RAG_SUPABASE_URL ??
  process.env.PROD_SUPABASE_URL ??
  process.env.SUPABASE_URL;

const KEY =
  process.env.RAG_SUPABASE_SERVICE_ROLE_KEY ??
  process.env.PROD_SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL) {
  console.error("[rag] Falta SUPABASE_URL (ou PROD_SUPABASE_URL).");
} else if (!KEY) {
  // `error` e não `warn`: sem a service_role o site sobe e a busca falha na
  // carga do catálogo, que é onde a RLS morde. A mensagem precisa estar no log
  // da Vercel antes de alguém abrir o chat.
  console.error(
    "[rag] Falta PROD_SUPABASE_SERVICE_ROLE_KEY. A chave publicável do site não " +
      "lê opportunity_chunks (RLS) — a Accessia não vai encontrar nenhum vetor."
  );
} else if (process.env.NODE_ENV !== "production") {
  console.log(`[rag] catálogo e vetores de: ${URL.replace(/^https:\/\//, "").split(".")[0]}`);
}

// Nome antigo mantido para não tocar em ~10 imports.
export const devSupabase = createClient(URL, KEY);
