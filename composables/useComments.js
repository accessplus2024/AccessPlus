import { ref } from "vue"
import { useSupabaseBrowser } from "./useSupabaseBrowser"

// Comentários de uma oportunidade. Usa a tabela `comments` e as regras (RLS)
// já configuradas no Supabase:
//  - qualquer um LÊ
//  - só logado POSTA (como ele mesmo)
//  - autor apaga o próprio; admin apaga qualquer um
//
// Observação: as RESPOSTAS (comentário de comentário) virão depois, quando a
// coluna `parent_id` existir na tabela. O código já lê `parent_id` se estiver
// presente, para facilitar essa evolução.
export function useComments() {
  const comentarios = ref([])
  const carregando = ref(false)
  const erro = ref(null)

  async function fetchComments(opportunityId) {
    const supabase = useSupabaseBrowser()
    if (!supabase || !opportunityId) return
    carregando.value = true
    erro.value = null
    try {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("opportunity_id", opportunityId)
        .order("created_at", { ascending: false })
      if (error) throw error
      comentarios.value = data || []
    } catch (e) {
      erro.value = e?.message || "Não foi possível carregar os comentários."
    } finally {
      carregando.value = false
    }
  }

  // Posta um comentário ou uma RESPOSTA (precisa estar logado).
  // `parentId` = null para comentário de topo, ou o id do comentário "pai".
  async function addComment(opportunityId, body, user, parentId = null) {
    const supabase = useSupabaseBrowser()
    if (!supabase) return { ok: false, error: "Supabase indisponível." }
    if (!user) return { ok: false, error: "Você precisa entrar para comentar." }
    const texto = (body || "").trim()
    if (!texto) return { ok: false, error: "Escreva algo antes de enviar." }

    const registro = {
      opportunity_id: opportunityId,
      user_id: user.id,
      author_name: user.user_metadata?.full_name || user.user_metadata?.name || "Estudante",
      author_avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
      body: texto,
      parent_id: parentId,
    }

    const { data, error } = await supabase
      .from("comments")
      .insert(registro)
      .select()
      .single()

    if (error) return { ok: false, error: error.message }
    // Adiciona à lista local (a árvore é montada por parent_id no componente).
    comentarios.value = [data, ...comentarios.value]
    return { ok: true }
  }

  async function deleteComment(id) {
    const supabase = useSupabaseBrowser()
    if (!supabase) return { ok: false }
    // No banco, o "on delete cascade" apaga as respostas junto.
    const { error } = await supabase.from("comments").delete().eq("id", id)
    if (error) return { ok: false, error: error.message }

    // Localmente, remove o comentário e TODOS os descendentes (respostas em cadeia).
    const remover = new Set([id])
    let cresceu = true
    while (cresceu) {
      cresceu = false
      for (const c of comentarios.value) {
        if (c.parent_id != null && remover.has(c.parent_id) && !remover.has(c.id)) {
          remover.add(c.id)
          cresceu = true
        }
      }
    }
    comentarios.value = comentarios.value.filter((c) => !remover.has(c.id))
    return { ok: true }
  }

  return { comentarios, carregando, erro, fetchComments, addComment, deleteComment }
}
