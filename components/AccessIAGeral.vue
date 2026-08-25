<script setup>
// MODO GERAL (Parte 2 do plano): anônimo, sem login — ao contrário de
// AccessIA.vue (modo match), que fica atrás de <AccessGate>. Fala com
// /api/rag/general, não /api/rag/match. Deliberadamente simples: sem
// wizard de várias etapas, só uma pergunta livre por vez.
import { ref, nextTick } from "vue"
import { ArrowRight } from "@iconoir/vue"
// Sparkle é componente local do projeto (components/Sparkle.vue),
// auto-importado pelo Nuxt — mesmo padrão já usado em AccessIA.vue.

const sessionId = typeof crypto !== "undefined" && crypto.randomUUID
  ? crypto.randomUUID()
  : `${Date.now()}-${Math.random().toString(36).slice(2)}`

const pergunta = ref("")
const enviando = ref(false)
const erro = ref(null)
// Histórico só em memória desta sessão de uso — nunca persistido, e o
// backend não guarda a conversa em banco nenhum.
const mensagens = ref([])
const listaRef = ref(null)

async function rolarParaFinal() {
  await nextTick()
  if (listaRef.value) listaRef.value.scrollTop = listaRef.value.scrollHeight
}

async function enviar() {
  const texto = pergunta.value.trim()
  if (!texto || enviando.value) return

  mensagens.value.push({ tipo: "pergunta", texto })
  pergunta.value = ""
  erro.value = null
  enviando.value = true
  rolarParaFinal()

  try {
    const data = await $fetch("/api/rag/general", {
      method: "POST",
      body: { question: texto, sessionId },
    })

    if (data.type === "opportunity") {
      mensagens.value.push({ tipo: "oportunidade", oportunidade: data.opportunity })
    } else {
      mensagens.value.push({
        tipo: "resposta",
        texto: data.text,
        relacionadas: data.relatedOpportunities || [],
      })
    }
  } catch (e) {
    erro.value = "Não consegui responder agora. Tenta de novo em instantes."
  } finally {
    enviando.value = false
    rolarParaFinal()
  }
}
</script>

<template>
  <div class="geral">
    <p class="geral-intro">
      Pergunte algo geral sobre a AccessPlus ou sobre como funciona uma oportunidade —
      sem precisar entrar na conta. Pra uma busca personalizada, use "Encontrar oportunidades".
    </p>

    <div v-if="mensagens.length" ref="listaRef" class="geral-lista">
      <div v-for="(m, i) in mensagens" :key="i" class="geral-msg" :class="`is-${m.tipo}`">
        <template v-if="m.tipo === 'pergunta'">
          {{ m.texto }}
        </template>

        <template v-else-if="m.tipo === 'resposta'">
          <p>{{ m.texto }}</p>
          <div v-if="m.relacionadas.length" class="geral-related">
            <NuxtLink
              v-for="op in m.relacionadas"
              :key="op.id"
              :to="`/oportunidade/${op.id}`"
              class="geral-related-link"
            >{{ op.title }}</NuxtLink>
          </div>
        </template>

        <template v-else-if="m.tipo === 'oportunidade'">
          <p class="geral-opp-label">Encontrei isto no catálogo:</p>
          <NuxtLink :to="`/oportunidade/${m.oportunidade.id}`" class="geral-opp-card">
            <strong>{{ m.oportunidade.title }}</strong>
            <span v-if="m.oportunidade.deadline">Prazo: {{ m.oportunidade.deadline }}</span>
            <span
              v-if="!m.oportunidade.atualizacaoWeb && m.oportunidade.inscricoes === 'Encerrada'"
              class="geral-opp-encerrada"
            >
              Inscrições encerradas — vale acompanhar pra próxima edição
            </span>
          </NuxtLink>
          <!-- Parte 5 do plano: divergência é sempre uma BANDEIRA anexada à
               resposta curada acima — nunca um segundo cartão competindo em
               peso visual, e nunca sem o link pro site oficial junto. -->
          <p v-if="m.oportunidade.atualizacaoWeb" class="geral-opp-flag">
            🔎 Conferimos agora no site oficial{{ m.oportunidade.atualizacaoWeb.note ? `: ${m.oportunidade.atualizacaoWeb.note}` : '' }}<template v-if="m.oportunidade.atualizacaoWeb.deadline"> (novo prazo: {{ m.oportunidade.atualizacaoWeb.deadline }})</template>.
            <a :href="m.oportunidade.atualizacaoWeb.sourceUrl" target="_blank" rel="noopener noreferrer" class="geral-opp-flag-link">
              Ver no site oficial
            </a>
          </p>
        </template>
      </div>

      <div v-if="enviando" class="geral-msg is-resposta geral-loading">
        <Sparkle :size="16" color="var(--color-primary)" />
        pensando...
      </div>
    </div>

    <p v-if="erro" class="geral-erro">{{ erro }}</p>

    <form class="geral-form" @submit.prevent="enviar">
      <input
        v-model="pergunta"
        type="text"
        placeholder="Ex: como funciona a inscrição na OBMEP?"
        :disabled="enviando"
      />
      <button type="submit" :disabled="enviando || !pergunta.trim()" aria-label="Enviar pergunta">
        <ArrowRight class="w-[16px] h-[16px]" />
      </button>
    </form>
  </div>
</template>

<style scoped>
.geral {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.geral-intro {
  font-size: 13px;
  color: rgba(21, 17, 31, 0.6);
  line-height: 1.5;
}

.geral-lista {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 320px;
  overflow-y: auto;
  padding-right: 2px;
}

.geral-msg {
  font-size: 14px;
  line-height: 1.5;
  padding: 10px 14px;
  border-radius: 14px;
  max-width: 92%;
}

.geral-msg.is-pergunta {
  align-self: flex-end;
  background: var(--color-ink);
  color: #fff;
}

.geral-msg.is-resposta,
.geral-msg.is-oportunidade {
  align-self: flex-start;
  background: color-mix(in srgb, var(--color-primary) 8%, transparent);
}

.geral-loading {
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(21, 17, 31, 0.5);
  font-size: 13px;
}

.geral-related {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.geral-related-link {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-primary);
  text-decoration: underline;
}

.geral-opp-label {
  font-size: 12px;
  color: rgba(21, 17, 31, 0.5);
  margin: 0 0 4px;
}

.geral-opp-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: var(--color-ink);
}

.geral-opp-card strong {
  font-size: 15px;
}

.geral-opp-card span {
  font-size: 12px;
  color: rgba(21, 17, 31, 0.6);
}

.geral-opp-encerrada {
  color: #b45309 !important;
  font-weight: 600;
}

/* Bandeira de divergência externa (Parte 5) — propositalmente discreta:
   texto menor e sem fundo colorido, pra nunca competir visualmente com o
   cartão curado acima dela. */
.geral-opp-flag {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.5;
  color: rgba(21, 17, 31, 0.55);
}

.geral-opp-flag-link {
  font-weight: 600;
  text-decoration: underline;
  color: rgba(21, 17, 31, 0.7);
}

.geral-erro {
  font-size: 13px;
  color: #b91c1c;
}

.geral-form {
  display: flex;
  gap: 8px;
}

.geral-form input {
  flex: 1;
  border: 1.5px solid rgba(21, 17, 31, 0.12);
  border-radius: 14px;
  padding: 10px 14px;
  font-size: 14px;
  outline: none;
}

.geral-form input:focus {
  border-color: rgba(75, 63, 228, 0.4);
}

.geral-form button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: 0;
  background: var(--color-primary);
  color: #fff;
  cursor: pointer;
  flex: none;
}

.geral-form button:disabled {
  opacity: 0.4;
  cursor: default;
}
</style>
