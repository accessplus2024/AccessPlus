<script setup>
// Nó recursivo de comentário: mostra o comentário, permite responder e
// renderiza as respostas (que também são CommentNode) — em vários níveis.
defineOptions({ name: "CommentNode" })

import { ref, computed, inject } from "vue"
import { Trash, SendDiagonal, ChatBubble } from "@iconoir/vue"

const props = defineProps({
  node: { type: Object, required: true },
  depth: { type: Number, default: 0 },
})

const ctx = inject("commentsCtx")

const filhos = computed(() => ctx.childrenOf(props.node.id))

const respondendo = ref(false)
const texto = ref("")
const enviando = ref(false)
const erro = ref(null)

const ehAutor = computed(() => ctx.user.value && props.node.user_id === ctx.user.value.id)
const logado = computed(() => !!ctx.user.value)

async function enviarResposta() {
  erro.value = null
  enviando.value = true
  const r = await ctx.reply(props.node.id, texto.value)
  enviando.value = false
  if (r.ok) { texto.value = ""; respondendo.value = false }
  else erro.value = r.error
}

function abrirResposta() {
  if (!logado.value) { ctx.pedirLogin(); return }
  respondendo.value = !respondendo.value
}
</script>

<template>
  <div class="node">
    <div class="flex gap-3">
      <img
        v-if="node.author_avatar && ctx.helpers.avatarOk(node.id)"
        :src="node.author_avatar"
        :alt="node.author_name"
        class="avatar flex-none"
        referrerpolicy="no-referrer"
        @error="ctx.helpers.marcarAvatarQuebrado(node.id)"
      />
      <span v-else class="avatar avatar-fallback flex-none">{{ ctx.helpers.iniciais(node.author_name) }}</span>

      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="font-body font-semibold text-ink" style="font-size: 14.5px">{{ node.author_name }}</span>
          <span class="text-ink/40" style="font-size: 12.5px">· {{ ctx.helpers.tempoRelativo(node.created_at) }}</span>
        </div>
        <p class="text-ink/80 mt-1" style="font-size: 14.5px; line-height: 1.55; white-space: pre-line; word-break: break-word">{{ node.body }}</p>

        <div class="flex items-center gap-4 mt-2">
          <button class="act-btn" @click="abrirResposta">
            <ChatBubble class="w-[14px] h-[14px]" /> Responder
          </button>
          <button v-if="ehAutor" class="act-btn del" @click="ctx.remove(node)">
            <Trash class="w-[14px] h-[14px]" /> Apagar
          </button>
        </div>

        <!-- Formulário de resposta -->
        <div v-if="respondendo" class="reply-form mt-3">
          <textarea
            v-model="texto"
            class="field"
            rows="2"
            maxlength="1500"
            :placeholder="`Respondendo a ${node.author_name}...`"
          />
          <p v-if="erro" class="mt-1.5" style="color: #E24444; font-size: 13px">{{ erro }}</p>
          <div class="flex items-center gap-2 mt-2">
            <button class="btn btn-ink btn-sm" :disabled="enviando || !texto.trim()" @click="enviarResposta">
              <template v-if="enviando">Enviando...</template>
              <template v-else>Responder <SendDiagonal class="w-[15px] h-[15px]" /></template>
            </button>
            <button class="act-btn" @click="respondendo = false; texto = ''">Cancelar</button>
          </div>
        </div>

        <!-- Respostas (recursivo) -->
        <div v-if="filhos.length" class="replies mt-4">
          <CommentNode
            v-for="filho in filhos"
            :key="filho.id"
            :node="filho"
            :depth="depth + 1"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.node { }
.avatar {
  width: 38px;
  height: 38px;
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
  font-size: 15px;
}
.act-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12.5px;
  font-weight: 600;
  color: color-mix(in srgb, var(--color-ink) 50%, transparent);
  transition: color .2s ease;
}
.act-btn:hover { color: var(--color-ink); }
.act-btn.del:hover { color: #E24444; }

.field {
  width: 100%;
  padding: 10px 13px;
  border-radius: 13px;
  border: 2px solid color-mix(in srgb, var(--color-ink) 12%, transparent);
  font-family: var(--font-body, inherit);
  font-size: 14px;
  resize: vertical;
  transition: border-color .2s ease;
}
.field:focus { outline: none; border-color: var(--color-ink); }

.btn-sm { padding: 8px 14px; font-size: 13.5px; }

/* linha de indentação das respostas */
.replies {
  padding-left: 16px;
  border-left: 2px solid color-mix(in srgb, var(--color-ink) 10%, transparent);
  display: flex;
  flex-direction: column;
  gap: 16px;
}
@media (max-width: 560px) {
  .replies { padding-left: 10px; }
}
</style>
