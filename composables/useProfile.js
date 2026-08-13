import { ref } from "vue"
import { useSupabaseBrowser } from "./useSupabaseBrowser"

// Perfil de cadastro (nome, idade, telefone, escola, escolaridade, renda, consentimento LGPD) — tabela `profiles`.
// Estado compartilhado (como em useAuth): um único perfil "atual" para a sessão.
const profile = ref(null)
const carregandoPerfil = ref(true)
const erroPerfil = ref(null)

export function useProfile() {
  // Busca o perfil do usuário logado. `profile` fica `null` se ele ainda não se cadastrou.
  async function fetchProfile(userId) {
    const supabase = useSupabaseBrowser()
    if (!supabase || !userId) {
      profile.value = null
      carregandoPerfil.value = false
      return
    }
    carregandoPerfil.value = true
    erroPerfil.value = null
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle()
      if (error) throw error
      profile.value = data || null
    } catch (e) {
      erroPerfil.value = e?.message || "Não foi possível carregar seu cadastro."
      profile.value = null
    } finally {
      carregandoPerfil.value = false
    }
  }

  // Cria (ou atualiza) o cadastro do usuário logado.
  async function saveProfile(user, dados) {
    const supabase = useSupabaseBrowser()
    if (!supabase) return { ok: false, error: "Supabase indisponível." }
    if (!user) return { ok: false, error: "Você precisa entrar para se cadastrar." }

    const idade = Number.parseInt(dados.age, 10)

    const registro = {
      id: user.id,
      email: user.email || null,
      name: (dados.name || "").trim(),
      age: Number.isFinite(idade) ? idade : null,
      phone: (dados.phone || "").trim(),
      school: (dados.school || "").trim(),
      school_type: dados.schoolType || null,
      education_level: dados.educationLevel || null,
      city: (dados.city || "").trim(),
      state: dados.state || null,
      income: dados.income || null,
      lgpd_consent_at: dados.lgpdConsent ? new Date().toISOString() : null,
    }

    if (
      !registro.name || !registro.phone || !registro.school || !registro.school_type ||
      !registro.education_level || !registro.city || !registro.state
    ) {
      return { ok: false, error: "Preencha todos os campos obrigatórios." }
    }
    if (!registro.age || registro.age < 5 || registro.age > 100) {
      return { ok: false, error: "Preencha uma idade válida." }
    }
    if (!registro.lgpd_consent_at) {
      return { ok: false, error: "Você precisa aceitar o uso dos seus dados para continuar." }
    }

    const { data, error } = await supabase
      .from("profiles")
      .upsert(registro)
      .select()
      .single()

    if (error) return { ok: false, error: error.message }
    profile.value = data
    return { ok: true }
  }

  function resetProfile() {
    profile.value = null
    carregandoPerfil.value = true
  }

  return { profile, carregandoPerfil, erroPerfil, fetchProfile, saveProfile, resetProfile }
}
