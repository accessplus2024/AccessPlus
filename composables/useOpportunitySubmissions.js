import { ref } from "vue"
import { useSupabaseBrowser } from "./useSupabaseBrowser"

// Oportunidades enviadas por uma organização (tabela `opportunity_submissions`,
// RLS: cada organização só vê/edita as próprias, e só edita enquanto
// `status = 'pendente'` — depois de revisada pela curadoria, a linha vira
// somente leitura pro lado do usuário). Mesmo padrão de useApplications.js.

const CAMPOS_OBRIGATORIOS = [
  ["organizationName", "nome da organização"],
  ["title", "nome da oportunidade"],
  ["link", "link"],
  ["description", "descrição"],
  ["type", "categoria"],
  ["deadline", "prazo"],
  ["location", "localização"],
  ["cost", "custo"],
  ["format", "formato"],
  ["eligibility", "elegibilidade"],
  ["submitterName", "seu nome"],
  ["submitterEmail", "seu e-mail"],
]

function validar(dados) {
  const faltando = CAMPOS_OBRIGATORIOS
    .filter(([chave]) => !String(dados[chave] || "").trim())
    .map(([, rotulo]) => rotulo)
  if (!dados.level?.length) faltando.push("nível de ensino")
  if (!dados.areas?.length) faltando.push("área de interesse")

  if (faltando.length) {
    return `Preencha todos os campos obrigatórios (faltando: ${faltando.join(", ")}).`
  }
  if (dados.link && !/^https?:\/\//i.test(dados.link.trim())) {
    return "O link precisa começar com http:// ou https://."
  }
  if (dados.submitterEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.submitterEmail.trim())) {
    return "Confira o e-mail informado."
  }
  return null
}

function registroDe(dados) {
  return {
    organization_name: dados.organizationName.trim(),
    title: dados.title.trim(),
    link: dados.link.trim(),
    description: dados.description.trim(),
    type: dados.type,
    deadline: dados.deadline.trim(),
    level: dados.level,
    areas: dados.areas,
    location: dados.location.trim(),
    cost: dados.cost,
    format: dados.format,
    eligibility: dados.eligibility.trim(),
    submitter_name: dados.submitterName.trim(),
    submitter_email: dados.submitterEmail.trim(),
    submitter_note: (dados.submitterNote || "").trim(),
  }
}

export function useOpportunitySubmissions() {
  const minhas = ref([])
  const carregando = ref(false)
  const erro = ref(null)

  // Lista completa da organização, mais recente primeiro — usada em
  // "Minhas oportunidades enviadas".
  async function fetchMinhas(userId) {
    const supabase = useSupabaseBrowser()
    if (!supabase || !userId) return
    carregando.value = true
    erro.value = null
    try {
      const { data, error } = await supabase
        .from("opportunity_submissions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
      if (error) throw error
      minhas.value = data || []
    } catch (e) {
      erro.value = e?.message || "Não foi possível carregar suas oportunidades enviadas."
    } finally {
      carregando.value = false
    }
  }

  async function submeter(user, dados) {
    if (!user) return { ok: false, error: "Você precisa entrar para enviar uma oportunidade." }
    const erroValidacao = validar(dados)
    if (erroValidacao) return { ok: false, error: erroValidacao }

    const supabase = useSupabaseBrowser()
    if (!supabase) return { ok: false, error: "Supabase indisponível." }

    const { data, error } = await supabase
      .from("opportunity_submissions")
      .insert({ ...registroDe(dados), user_id: user.id })
      .select()
      .single()

    if (error) return { ok: false, error: error.message }
    return { ok: true, data }
  }

  // Só é aceito pelo banco enquanto `status = 'pendente'` (RLS) — depois de
  // revisada, a organização não consegue mais editar mesmo chamando isso.
  async function atualizar(id, dados) {
    const erroValidacao = validar(dados)
    if (erroValidacao) return { ok: false, error: erroValidacao }

    const supabase = useSupabaseBrowser()
    if (!supabase) return { ok: false, error: "Supabase indisponível." }

    const { data, error } = await supabase
      .from("opportunity_submissions")
      .update({ ...registroDe(dados), updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) return { ok: false, error: error.message }
    minhas.value = minhas.value.map((s) => (s.id === id ? data : s))
    return { ok: true, data }
  }

  return { minhas, carregando, erro, fetchMinhas, submeter, atualizar }
}
