import { createClient } from "@supabase/supabase-js"

// Cliente Supabase do NAVEGADOR (usa a chave pública/anon).
// Diferente de server/utils/supabaseClient.js, que roda no servidor.
// Mantém a sessão do login (localStorage) e detecta o retorno do OAuth do Google.
let browserClient = null

export function useSupabaseBrowser() {
  if (browserClient) return browserClient

  const config = useRuntimeConfig()
  const url = config.public.supabaseUrl
  const anonKey = config.public.supabaseAnonKey

  if (!url || !anonKey) {
    console.error("Supabase público não configurado (supabaseUrl / supabaseAnonKey).")
    return null
  }

  browserClient = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // PKCE é o fluxo recomendado/mais seguro: o Google volta com "?code=..."
      // (e não com o token direto no #hash da URL). O supabase-js troca esse
      // code por uma sessão automaticamente.
      flowType: "pkce",
    },
  })
  return browserClient
}
