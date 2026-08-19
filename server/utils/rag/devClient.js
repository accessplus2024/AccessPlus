import { createClient } from "@supabase/supabase-js";

const DEV_SUPABASE_URL = process.env.DEV_SUPABASE_URL;
const DEV_SUPABASE_SERVICE_ROLE_KEY = process.env.DEV_SUPABASE_SERVICE_ROLE_KEY;

if (!DEV_SUPABASE_URL || !DEV_SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "[rag] DEV_SUPABASE_URL ou DEV_SUPABASE_SERVICE_ROLE_KEY não configurados no .env"
  );
}

export const devSupabase = createClient(DEV_SUPABASE_URL, DEV_SUPABASE_SERVICE_ROLE_KEY);
