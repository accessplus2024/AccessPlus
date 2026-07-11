import { createClient } from "@supabase/supabase-js";

let client = null;

export function useSupabase() {
  if (!client) {
    const config = useRuntimeConfig();
    client = createClient(config.supabaseUrl, config.supabaseServiceRoleKey);
  }
  return client;
}
