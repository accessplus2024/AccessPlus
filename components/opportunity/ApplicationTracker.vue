<script setup>
import { ref, onMounted } from "vue"
import { Check } from "@iconoir/vue"
import { useAuth } from "~/composables/useAuth"
import { useApplications } from "~/composables/useApplications"

const props = defineProps({
  opportunity: { type: Object, required: true },
})

const { user } = useAuth()
const { fetchStatus, setStatus } = useApplications()

const opcoes = [
  { key: "interesse", label: "Quero aplicar" },
  { key: "aplicado", label: "Já apliquei" },
  { key: "conseguido", label: "Consegui!" },
]

const statusAtual = ref(null)
const salvando = ref(false)
const erro = ref(null)

onMounted(async () => {
  if (!user.value) return
  const registro = await fetchStatus(user.value.id, props.opportunity.id)
  statusAtual.value = registro?.status || null
})

async function marcar(status) {
  if (!user.value || salvando.value) return
  // Clicar de novo no mesmo status não faz nada — não existe "desmarcar" aqui
  // de propósito: o histórico de que ela quis aplicar continua valendo mesmo
  // que ela já tenha ido pro próximo passo.
  if (statusAtual.value === status) return
  erro.value = null
  salvando.value = true
  const anterior = statusAtual.value
  statusAtual.value = status
  const r = await setStatus(user.value, props.opportunity, status)
  if (!r.ok) { statusAtual.value = anterior; erro.value = r.error }
  salvando.value = false
}
</script>

<template>
  <div v-if="user" class="tracker">
    <span class="tracker-label">Acompanhar esta oportunidade</span>
    <div class="tracker-options">
      <button
        v-for="o in opcoes"
        :key="o.key"
        type="button"
        class="tracker-btn"
        :class="{ 'tracker-btn--ativo': statusAtual === o.key }"
        :disabled="salvando"
        @click="marcar(o.key)"
      >
        <Check v-if="statusAtual === o.key" class="w-[15px] h-[15px]" />
        {{ o.label }}
      </button>
    </div>
    <p v-if="erro" class="tracker-erro">{{ erro }}</p>
    <NuxtLink to="/minhas-oportunidades" class="tracker-link">Ver minhas oportunidades</NuxtLink>
  </div>
</template>

<style scoped>
.tracker {
  margin-bottom: 28px;
  padding: 18px 20px;
  border-radius: var(--r-card);
  background: color-mix(in srgb, var(--color-primary) 6%, transparent);
  border: 1.5px solid color-mix(in srgb, var(--color-primary) 14%, transparent);
}

.tracker-label {
  display: block;
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--color-ink) 55%, transparent);
  margin-bottom: 12px;
}

.tracker-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tracker-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: var(--r-pill);
  border: 1.5px solid color-mix(in srgb, var(--color-ink) 16%, transparent);
  background: #fff;
  font-weight: 600;
  font-size: 13.5px;
  color: var(--color-ink);
  transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
}
.tracker-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
}
.tracker-btn:disabled {
  opacity: 0.7;
  cursor: default;
}
.tracker-btn--ativo {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}

.tracker-erro {
  margin-top: 12px;
  font-size: 13px;
  color: #E24444;
}

.tracker-link {
  display: inline-block;
  margin-top: 14px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-primary);
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>
