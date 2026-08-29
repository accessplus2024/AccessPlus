<script setup>
import { ref, computed, onMounted, watch } from "vue"
import { NavArrowRight, Xmark, OpenNewWindow } from "@iconoir/vue"
import { useAuth } from "~/composables/useAuth"
import { useApplications } from "~/composables/useApplications"
import AccessGate from "~/components/opportunity/AccessGate.vue"

useHead({
  title: "Minhas oportunidades — Access+",
  meta: [{ name: "description", content: "Acompanhe as oportunidades em que você já está de olho, já aplicou ou já conseguiu." }],
})

const { user, init } = useAuth()
const { minhas, carregando, fetchMinhas, setStatus, removerStatus } = useApplications()

onMounted(() => {
  init()
  if (user.value) fetchMinhas(user.value.id)
})
watch(user, (novo) => { if (novo) fetchMinhas(novo.id) })

const colunas = [
  { key: "interesse", label: "Quero aplicar", accent: "var(--color-primary)" },
  { key: "aplicado", label: "Já apliquei", accent: "var(--color-amber)" },
  { key: "conseguido", label: "Consegui!", accent: "var(--color-lime)" },
]

function itensDe(status) {
  return computed(() => minhas.value.filter((a) => a.status === status))
}
const porColuna = colunas.map((c) => ({ ...c, itens: itensDe(c.key) }))
const naoSelecionados = itensDe("nao_selecionado")

async function avancar(item, novoStatus) {
  await setStatus(user.value, { id: item.opportunity_id, title: item.opportunity_title, link: item.opportunity_link, deadline: item.opportunity_deadline }, novoStatus)
  await fetchMinhas(user.value.id)
}

async function remover(id) {
  await removerStatus(id)
}
</script>

<template>
  <div class="wrap" style="padding-top: 140px; padding-bottom: 100px">
    <ClientOnly>
      <AccessGate>
        <span class="kicker">Organização</span>
        <h1 class="mt-3" style="font-family: var(--font-display); font-size: clamp(30px, 4vw, 46px)">
          Minhas oportunidades
        </h1>
        <p class="text-ink/62 mt-3" style="font-size: 16px; max-width: 56ch">
          Tudo que você marcou como interesse, aplicação ou conquista, num lugar só.
        </p>

        <p v-if="carregando" class="mt-10 text-ink/50" style="font-size: 14px">Carregando...</p>

        <div v-else-if="!minhas.length" class="empty-state mt-10">
          <p style="font-size: 16px">
            Você ainda não marcou nenhuma oportunidade. Abra uma oportunidade e clique em
            <strong>"Quero aplicar"</strong> pra começar a organizar.
          </p>
          <NuxtLink to="/oportunidades" class="btn btn-ink mt-6">Ver oportunidades</NuxtLink>
        </div>

        <template v-else>
          <div class="board mt-10">
            <div v-for="col in porColuna" :key="col.key" class="board-col">
              <div class="board-col-head">
                <span class="dot" :style="{ background: col.accent }" />
                <h3>{{ col.label }}</h3>
                <span class="count">{{ col.itens.value.length }}</span>
              </div>

              <p v-if="!col.itens.value.length" class="board-empty">Nada aqui ainda.</p>

              <article v-for="item in col.itens.value" :key="item.id" class="app-card">
                <button class="app-card-remove" type="button" aria-label="Remover" @click="remover(item.id)">
                  <Xmark class="w-[14px] h-[14px]" />
                </button>
                <NuxtLink :to="`/oportunidade/${item.opportunity_id}`" class="app-card-title">
                  {{ item.opportunity_title }}
                </NuxtLink>
                <p v-if="item.opportunity_deadline" class="app-card-deadline">
                  Prazo: {{ item.opportunity_deadline }}
                </p>
                <div class="app-card-actions">
                  <a v-if="item.opportunity_link" :href="item.opportunity_link" target="_blank" rel="noopener" class="app-card-link">
                    Abrir link <OpenNewWindow class="w-[13px] h-[13px]" />
                  </a>
                  <button v-if="col.key === 'interesse'" type="button" class="app-card-advance" @click="avancar(item, 'aplicado')">
                    Já apliquei <NavArrowRight class="w-[14px] h-[14px]" />
                  </button>
                  <button v-if="col.key === 'aplicado'" type="button" class="app-card-advance" @click="avancar(item, 'conseguido')">
                    Consegui! <NavArrowRight class="w-[14px] h-[14px]" />
                  </button>
                  <button v-if="col.key === 'aplicado'" type="button" class="app-card-muted" @click="avancar(item, 'nao_selecionado')">
                    Não selecionado(a)
                  </button>
                </div>
              </article>
            </div>
          </div>

          <div v-if="naoSelecionados.value.length" class="mt-10">
            <p class="kicker" style="opacity: .5">Não selecionado(a) desta vez</p>
            <div class="nao-selecionado-row mt-4">
              <article v-for="item in naoSelecionados.value" :key="item.id" class="app-card app-card--muted">
                <button class="app-card-remove" type="button" aria-label="Remover" @click="remover(item.id)">
                  <Xmark class="w-[14px] h-[14px]" />
                </button>
                <NuxtLink :to="`/oportunidade/${item.opportunity_id}`" class="app-card-title">
                  {{ item.opportunity_title }}
                </NuxtLink>
              </article>
            </div>
          </div>
        </template>
      </AccessGate>
      <template #fallback>
        <p class="text-ink/50" style="font-size: 14px">Carregando...</p>
      </template>
    </ClientOnly>
  </div>
</template>

<style scoped>
.empty-state {
  padding: 40px 32px;
  border-radius: var(--r-card);
  background: color-mix(in srgb, var(--color-ink) 4%, transparent);
  text-align: center;
}

.board {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 22px;
  align-items: start;
}
@media (max-width: 900px) {
  .board { grid-template-columns: 1fr; }
}

.board-col-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}
.board-col-head .dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  flex: none;
}
.board-col-head h3 {
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 15.5px;
}
.board-col-head .count {
  margin-left: auto;
  font-size: 13px;
  font-weight: 600;
  color: color-mix(in srgb, var(--color-ink) 45%, transparent);
}

.board-empty {
  font-size: 13.5px;
  color: color-mix(in srgb, var(--color-ink) 40%, transparent);
  padding: 18px;
  border: 1.5px dashed color-mix(in srgb, var(--color-ink) 14%, transparent);
  border-radius: var(--r-card);
  text-align: center;
}

.app-card {
  position: relative;
  padding: 18px 18px 16px;
  margin-bottom: 14px;
  border-radius: var(--r-card);
  background: #fff;
  border: 1.5px solid color-mix(in srgb, var(--color-ink) 8%, transparent);
  box-shadow: 0 6px 18px rgba(21, 17, 31, 0.05);
}

.app-card-remove {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  color: color-mix(in srgb, var(--color-ink) 40%, transparent);
  transition: background 0.2s ease, color 0.2s ease;
}
.app-card-remove:hover {
  background: color-mix(in srgb, var(--color-ink) 8%, transparent);
  color: var(--color-ink);
}

.app-card-title {
  display: block;
  padding-right: 24px;
  font-weight: 700;
  font-size: 15px;
  color: var(--color-ink);
  line-height: 1.35;
}
.app-card-title:hover {
  color: var(--color-primary);
}

.app-card-deadline {
  margin-top: 8px;
  font-size: 12.5px;
  color: color-mix(in srgb, var(--color-ink) 55%, transparent);
}

.app-card-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 14px;
  margin-top: 14px;
}

.app-card-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12.5px;
  font-weight: 600;
  color: color-mix(in srgb, var(--color-ink) 55%, transparent);
}
.app-card-link:hover {
  color: var(--color-ink);
}

.app-card-advance {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 7px 12px;
  border-radius: var(--r-pill);
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  color: var(--color-primary);
  font-weight: 600;
  font-size: 12.5px;
  transition: background 0.2s ease;
}
.app-card-advance:hover {
  background: color-mix(in srgb, var(--color-primary) 18%, transparent);
}

.app-card-muted {
  font-size: 12px;
  font-weight: 600;
  color: color-mix(in srgb, var(--color-ink) 40%, transparent);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.app-card-muted:hover {
  color: color-mix(in srgb, var(--color-ink) 65%, transparent);
}

.nao-selecionado-row {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}
.nao-selecionado-row .app-card {
  flex: 1 1 260px;
  max-width: 320px;
  margin-bottom: 0;
}
.app-card--muted {
  opacity: 0.6;
  box-shadow: none;
}
</style>
