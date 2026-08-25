import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// `.env.embedding` traz NVIDIA e o modelo; o `.env` da raiz traz PROD_SUPABASE_*.
// dotenv não sobrescreve variável já definida, então a ordem importa.
dotenv.config({ path: path.join(__dirname, ".env.embedding"), quiet: true });
dotenv.config({ path: path.join(__dirname, "..", ".env"), quiet: true });

// Mesma ordem de server/utils/rag/ragClient.js: quem GERA os chunks e quem os
// LÊ têm que apontar para o mesmo banco.
const SUPABASE_URL =
  process.env.RAG_SUPABASE_URL ?? process.env.PROD_SUPABASE_URL ?? process.env.SUPABASE_URL;
// A chave TEM que ser service_role: o embed escreve em opportunity_chunks, que
// tem RLS. A chave publicável do site falharia sem dizer por quê.
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.RAG_SUPABASE_SERVICE_ROLE_KEY ??
  process.env.PROD_SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Faltam PROD_SUPABASE_URL e PROD_SUPABASE_SERVICE_ROLE_KEY no .env da raiz.");
  process.exit(1);
}

process.env.SUPABASE_URL = SUPABASE_URL;
export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
