import { ref } from "vue"
import { useSupabaseBrowser } from "./useSupabaseBrowser"
import { useRoute } from "vue-router"

// Estado de autenticação compartilhado (login com Google via Supabase).
// `user` é null quando deslogado, ou o objeto do usuário do Supabase quando logado.
const user = ref(null)
const carregandoSessao = ref(true)
let inicializado = false

export function useAuth() {
  const supabase = process.client ? useSupabaseBrowser() : null
  const route = useRoute()

  // Inicializa a sessão uma única vez (só no navegador).
  function init() {
    if (inicializado || !supabase) return
    inicializado = true

    supabase.auth.getSession().then(({ data }) => {
      user.value = data.session?.user ?? null
      carregandoSessao.value = false
    })

    // Reage a login/logout (inclusive ao voltar do redirect do Google).
    supabase.auth.onAuthStateChange((event, session) => {
      user.value = session?.user ?? null
      carregandoSessao.value = false
      // Depois do login, limpa o "?code=..." da barra de endereço, deixando a URL limpa.
      if (event === "SIGNED_IN") limparUrlDeAuth()
    })
  }

  // Remove os parâmetros de OAuth (code/state/error) da URL sem recarregar a página.
  function limparUrlDeAuth() {
    if (typeof window === "undefined") return
    const url = new URL(window.location.href)
    let mudou = false
    for (const p of ["code", "state", "error", "error_description"]) {
      if (url.searchParams.has(p)) { url.searchParams.delete(p); mudou = true }
    }
    if (url.hash.includes("access_token") || url.hash.includes("error")) { url.hash = ""; mudou = true }
    if (mudou) window.history.replaceState({}, document.title, url.pathname + url.search + url.hash)
  }

  // Entra com o Google e volta para a MESMA página (URL limpa, sem #hash nem query).
  async function signInWithGoogle() {
    if (!supabase) return
    const destino = window.location.href
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: destino },
    })
  }

  async function signOut() {
    if (!supabase) return
    await supabase.auth.signOut()
    user.value = null
  }

  return { user, carregandoSessao, init, signInWithGoogle, signOut }
}
