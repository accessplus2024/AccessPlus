import { ref } from "vue"
import { useSupabaseBrowser } from "./useSupabaseBrowser"

// Acompanhamento pessoal de oportunidades (tabela `applications`, RLS: cada
// aluno só vê/edita as próprias linhas — mesmo padrão de `profiles` e
// `comments`). Guarda uma CÓPIA de título/link/prazo no momento em que o
// aluno marca o status: se a oportunidade sair do catálogo depois, o
// histórico dele continua legível.
export function useApplications() {
  const minhas = ref([])
  const carregando = ref(false)
  const erro = ref(null)

  // Status já salvo pra uma oportunidade específica (usado na página da
  // oportunidade, pra saber qual botão vem marcado).
  async function fetchStatus(userId, opportunityId) {
    const supabase = useSupabaseBrowser()
    if (!supabase || !userId || !opportunityId) return null
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .eq("user_id", userId)
      .eq("opportunity_id", String(opportunityId))
      .maybeSingle()
    if (error) {
      erro.value = error.message
      return null
    }
    return data
  }

  // Cria ou atualiza o status do aluno pra uma oportunidade (upsert por
  // user_id+opportunity_id — só existe uma linha por par).
  async function setStatus(user, opportunity, status) {
    const supabase = useSupabaseBrowser()
    if (!supabase) return { ok: false, error: "Supabase indisponível." }
    if (!user) return { ok: false, error: "Você precisa entrar para marcar isso." }

    const registro = {
      user_id: user.id,
      opportunity_id: String(opportunity.id),
      opportunity_title: opportunity.title || opportunity.Nome || "Oportunidade",
      opportunity_link: opportunity.link || null,
      opportunity_deadline: opportunity.deadline || null,
      status,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from("applications")
      .upsert(registro, { onConflict: "user_id,opportunity_id" })
      .select()
      .single()

    if (error) return { ok: false, error: error.message }
    return { ok: true, data }
  }

  // Lista completa do aluno, mais recente primeiro — usada na página
  // "Minhas oportunidades".
  async function fetchMinhas(userId) {
    const supabase = useSupabaseBrowser()
    if (!supabase || !userId) return
    carregando.value = true
    erro.value = null
    try {
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
      if (error) throw error
      minhas.value = data || []
    } catch (e) {
      erro.value = e?.message || "Não foi possível carregar suas oportunidades."
    } finally {
      carregando.value = false
    }
  }

  async function removerStatus(id) {
    const supabase = useSupabaseBrowser()
    if (!supabase) return { ok: false }
    const { error } = await supabase.from("applications").delete().eq("id", id)
    if (error) return { ok: false, error: error.message }
    minhas.value = minhas.value.filter((a) => a.id !== id)
    return { ok: true }
  }

  return { minhas, carregando, erro, fetchStatus, setStatus, fetchMinhas, removerStatus }
}
