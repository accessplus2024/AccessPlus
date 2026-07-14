<script setup>
import { ref, onMounted, computed, provide } from "vue"
import { SendDiagonal } from "@iconoir/vue"
import { useAuth } from "~/composables/useAuth"
import { useComments } from "~/composables/useComments"
import CommentNode from "./CommentNode.vue"

const props = defineProps({
  opportunityId: { type: [String, Number], required: true },
})

const { user, carregandoSessao, init, signInWithGoogle, signOut } = useAuth()
const { comentarios, carregando, erro, fetchComments, addComment, deleteComment } = useComments()

const texto = ref("")
const enviando = ref(false)
const erroForm = ref(null)

const totalLabel = computed(() => {
  const n = comentarios.value.length
  return n === 0 ? "Comentários" : `${n} ${n === 1 ? "comentário" : "comentários"}`
})

onMounted(() => {
  init()
  fetchComments(props.opportunityId)
})

// Novo comentário de TOPO (parent_id = null).
async function enviar() {
  erroForm.value = null
  enviando.value = true
  const r = await addComment(props.opportunityId, texto.value, user.value, null)
  enviando.value = false
  if (r.ok) texto.value = ""
  else erroForm.value = r.error
}

// ---- Montagem da árvore de comentários ----
// childrenOf(null) = comentários de topo (mais recentes primeiro)
// childrenOf(id)   = respostas daquele comentário (mais antigas primeiro, ordem de conversa)
function childrenOf(parentId) {
  const arr = comentarios.value.filter((c) => (c.parent_id ?? null) === parentId)
  arr.sort((a, b) => {
    const da = new Date(a.created_at).getTime()
    const db = new Date(b.created_at).getTime()
    return parentId === null ? db - da : da - db
  })
  return arr
}
const raizes = computed(() => childrenOf(null))

// ---- Helpers compartilhados com os nós ----
function iniciais(nome = "") {
  return nome.trim().charAt(0).toUpperCase() || "?"
}
const avatarQuebrado = ref(new Set())
function marcarAvatarQuebrado(id) {
  const s = new Set(avatarQuebrado.value)
  s.add(id)
  avatarQuebrado.value = s
}
function avatarOk(id) {
  return !avatarQuebrado.value.has(id)
}
function tempoRelativo(iso) {
  if (!iso) return ""
  const d = new Date(iso)
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 60) return "agora"
  const m = Math.floor(s / 60)
  if (m < 60) return `há ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `há ${h} h`
  const dias = Math.floor(h / 24)
  if (dias < 30) return `há ${dias} d`
  return d.toLocaleDateString("pt-BR")
}

// Contexto entregue a cada CommentNode (via provide/inject).
provide("commentsCtx", {
  user,
  childrenOf,
  reply: (parentId, corpo) => addComment(props.opportunityId, corpo, user.value, parentId),
  remove: async (c) => {
    if (confirm("Apagar este comentário e suas respostas?")) await deleteComment(c.id)
  },
  pedirLogin: () => signInWithGoogle(),
  helpers: { iniciais, tempoRelativo, avatarOk, marcarAvatarQuebrado },
})
</script>

<template>
  <section class="mt-16">
    <span class="kicker">Comunidade</span>
    <h2 class="mt-3 font-display" style="font-size: clamp(26px, 4vw, 38px)">{{ totalLabel }}</h2>
    <p class="text-ink/60 mt-2" style="font-size: 15px; max-width: 60ch">
      Compartilhe dicas, tire dúvidas, corrija informações e ajude outros estudantes que estão de olho nesta oportunidade.
    </p>

    <ClientOnly>
      <!-- Caixa de novo comentário -->
      <div class="cbox mt-8">
        <!-- Logado: formulário -->
        <div v-if="user" class="flex gap-3">
          <img
            v-if="(user.user_metadata?.avatar_url || user.user_metadata?.picture) && avatarOk('me')"
            :src="user.user_metadata.avatar_url || user.user_metadata.picture"
            :alt="user.user_metadata?.full_name || 'Você'"
            class="avatar flex-none"
            referrerpolicy="no-referrer"
            @error="marcarAvatarQuebrado('me')"
          />
          <span v-else class="avatar avatar-fallback flex-none">
            {{ iniciais(user.user_metadata?.full_name || user.user_metadata?.name) }}
          </span>

          <div class="flex-1 min-w-0">
            <textarea
              v-model="texto"
              class="field"
              rows="3"
              maxlength="1500"
              placeholder="Escreva um comentário..."
            />
            <p v-if="erroForm" class="mt-2" style="color: #E24444; font-size: 13.5px">{{ erroForm }}</p>
            <div class="flex items-center justify-between mt-3">
              <button class="link-muted" @click="signOut">Sair ({{ user.user_metadata?.full_name || user.user_metadata?.name }})</button>
              <button class="btn btn-ink" :disabled="enviando || !texto.trim()" @click="enviar">
                <template v-if="enviando">Enviando...</template>
                <template v-else>Comentar <SendDiagonal class="w-[17px] h-[17px]" /></template>
              </button>
            </div>
          </div>
        </div>

        <!-- Deslogado: convite pra entrar -->
        <div v-else class="login-cta">
          <div>
            <div class="font-display" style="font-size: 18px">Participe da conversa</div>
            <p class="text-ink/60 mt-1" style="font-size: 14px">Entre com o Google para deixar um comentário.</p>
          </div>
          <button class="btn-google" :disabled="carregandoSessao" @click="signInWithGoogle">
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.96v2.33A9 9 0 0 0 9 18z"/>
              <path fill="#FBBC05" d="M3.98 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.02-2.33z"/>
              <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.02 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
            </svg>
            Entrar com Google
          </button>
        </div>
      </div>

      <!-- Árvore de comentários -->
      <div class="mt-8">
        <p v-if="carregando" class="text-ink/50" style="font-size: 14px">Carregando comentários...</p>
        <p v-else-if="erro" style="color: #E24444; font-size: 14px">{{ erro }}</p>
        <p v-else-if="!comentarios.length" class="empty-note">
          Ainda não há comentários. Seja o primeiro a compartilhar! ✦
        </p>

        <div v-else class="flex flex-col gap-6">
          <div v-for="c in raizes" :key="c.id" class="comment">
            <CommentNode :node="c" :depth="0" />
          </div>
        </div>
      </div>

      <template #fallback>
        <p class="text-ink/50 mt-8" style="font-size: 14px">Carregando comentários...</p>
      </template>
    </ClientOnly>
  </section>
</template>

<style scoped>
.cbox {
  padding: 20px 20px;
  border-radius: var(--r-card);
  border: 2px solid color-mix(in srgb, var(--color-ink) 10%, transparent);
  background: #fff;
}
.avatar {
  width: 42px;
  height: 42px;
  border-radius: 999px;
  object-fit: cover;
}
.avatar-fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--color-primary) 14%, transparent);
  color: var(--color-primary);
  font-family: var(--font-display, inherit);
  font-size: 17px;
}
.field {
  width: 100%;
  padding: 12px 14px;
  border-radius: 14px;
  border: 2px solid color-mix(in srgb, var(--color-ink) 12%, transparent);
  font-family: var(--font-body, inherit);
  font-size: 14.5px;
  resize: vertical;
  transition: border-color .2s ease;
}
.field:focus { outline: none; border-color: var(--color-ink); }

.login-cta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.btn-google {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 11px 18px;
  border-radius: 999px;
  border: 2px solid color-mix(in srgb, var(--color-ink) 14%, transparent);
  background: #fff;
  font-weight: 600;
  font-size: 14.5px;
  color: var(--color-ink);
  transition: border-color .2s ease, box-shadow .2s ease;
}
.btn-google:hover { border-color: var(--color-ink); box-shadow: 0 6px 18px color-mix(in srgb, var(--color-ink) 10%, transparent); }
.btn-google:disabled { opacity: .6; }

.link-muted {
  font-size: 13px;
  color: color-mix(in srgb, var(--color-ink) 50%, transparent);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.link-muted:hover { color: var(--color-ink); }

.empty-note {
  padding: 22px;
  border-radius: var(--r-card);
  border: 2px dashed color-mix(in srgb, var(--color-ink) 14%, transparent);
  color: color-mix(in srgb, var(--color-ink) 55%, transparent);
  font-size: 14.5px;
  text-align: center;
}

.comment {
  padding: 16px 18px;
  border-radius: 16px;
  border: 2px solid color-mix(in srgb, var(--color-ink) 8%, transparent);
  background: #fff;
}
</style>
