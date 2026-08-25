import { createClient } from "@supabase/supabase-js";

// Cliente Supabase de todo o pipeline da Accessia (catálogo, chunks, perfis).
//
// Aponta para PRODUÇÃO desde 2026-08-25. Antes lia o projeto de dev mesmo em
// produção, o que deixava a busca refém de um projeto que o plano gratuito
// pausa por inatividade — e mantinha dois catálogos que precisavam concordar.
//
// Ordem: RAG_* (escolha explícita) → PROD_* (padrão) → DEV_* (compatibilidade).
const URL =
  process.env.RAG_SUPABASE_URL ??
  process.env.PROD_SUPABASE_URL ??
  process.env.DEV_SUPABASE_URL;

const KEY =
  process.env.RAG_SUPABASE_SERVICE_ROLE_KEY ??
  process.env.PROD_SUPABASE_SERVICE_ROLE_KEY ??
  process.env.DEV_SUPABASE_SERVICE_ROLE_KEY;

const usingDevFallback =
  !process.env.RAG_SUPABASE_URL && !process.env.PROD_SUPABASE_URL && !!process.env.DEV_SUPABASE_URL;

if (!URL || !KEY) {
  console.error("[rag] Faltam PROD_SUPABASE_URL e PROD_SUPABASE_SERVICE_ROLE_KEY.");
} else if (usingDevFallback) {
  // `error` e não `warn` de propósito: sem as variáveis PROD_* o site fica NO
  // AR lendo o banco errado, e isso precisa aparecer no log da Vercel.
  console.error("[rag] ATENÇÃO: lendo do banco de DEV por fallback. Configure PROD_SUPABASE_URL e PROD_SUPABASE_SERVICE_ROLE_KEY.");
} else if (process.env.NODE_ENV !== "production") {
  console.log(`[rag] catálogo e vetores de: ${URL.replace(/^https:\/\//, "").split(".")[0]}`);
}

// Nome antigo mantido para não tocar em ~10 imports.
export const devSupabase = createClient(URL, KEY);
