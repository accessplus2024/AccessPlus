// Cliente Supabase da bancada. MESMA ordem de resolução de
// server/utils/rag/ragClient.js — se o lab medir um banco e a produção ler
// outro, o número que sai daqui não descreve nada.
//
// Existia uma cópia desta configuração em corpus.mjs, inspect.mjs e
// inspect2.mjs, todas fixas em DEV_SUPABASE_URL. Quando o índice foi para
// produção e a variável saiu do .env, o eval parou de rodar — e, pior, se ela
// tivesse ficado, ele mediria o catálogo antigo em silêncio.
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: new URL("../.env", import.meta.url).pathname, quiet: true });

const URL_DB =
  process.env.RAG_SUPABASE_URL ??
  process.env.PROD_SUPABASE_URL ??
  process.env.SUPABASE_URL;

const KEY_DB =
  process.env.RAG_SUPABASE_SERVICE_ROLE_KEY ??
  process.env.PROD_SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL_DB || !KEY_DB) {
  console.error(
    "[lab] Faltam credenciais. Defina PROD_SUPABASE_URL e PROD_SUPABASE_SERVICE_ROLE_KEY no .env.\n" +
      "      A chave TEM que ser service_role: opportunity_chunks tem RLS."
  );
  process.exit(1);
}

console.log(`[lab] banco: ${URL_DB.replace(/^https:\/\//, "").split(".")[0]}`);

export const db = createClient(URL_DB, KEY_DB);
