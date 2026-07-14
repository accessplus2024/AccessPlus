// Inicializa a sessão do Supabase em QUALQUER página (no navegador).
// Assim, mesmo que o login volte para a home (ex.: "/?code=..."), o código é
// trocado por uma sessão e o "?code=" é limpo da URL — não fica preso em
// uma única página.
export default defineNuxtPlugin(() => {
  const { init } = useAuth()
  init()
})
