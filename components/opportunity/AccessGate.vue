<script setup>
import { ref, watch, onMounted } from "vue"
import { Lock, ArrowRight } from "@iconoir/vue"
import { useAuth } from "~/composables/useAuth"
import { useProfile } from "~/composables/useProfile"

const { user, carregandoSessao, init, signInWithGoogle } = useAuth()
const { profile, carregandoPerfil, erroPerfil, fetchProfile, saveProfile, resetProfile } = useProfile()

const niveis = [
  { key: "fundamental", label: "Ensino Fundamental" },
  { key: "medio", label: "Ensino Médio" },
  { key: "superior_cursando", label: "Ensino Superior (cursando)" },
  { key: "superior_completo", label: "Ensino Superior (completo)" },
  { key: "pos", label: "Pós-graduação" },
]

const faixasRenda = [
  { key: "ate_1", label: "Até 1 salário mínimo" },
  { key: "1_2", label: "De 1 a 2 salários mínimos" },
  { key: "2_3", label: "De 2 a 3 salários mínimos" },
  { key: "3_5", label: "De 3 a 5 salários mínimos" },
  { key: "acima_5", label: "Acima de 5 salários mínimos" },
]

const form = ref({ name: "", phone: "", school: "", educationLevel: "", income: "" })
const enviando = ref(false)
const erroForm = ref(null)

function preencherNomeSugerido() {
  if (!form.value.name && user.value) {
    form.value.name = user.value.user_metadata?.full_name || user.value.user_metadata?.name || ""
  }
}

watch(user, (novo) => {
  if (novo) {
    fetchProfile(novo.id)
    preencherNomeSugerido()
  } else {
    resetProfile()
  }
})

onMounted(() => {
  init()
  if (user.value) {
    fetchProfile(user.value.id)
    preencherNomeSugerido()
  } else {
    carregandoPerfil.value = false
  }
})

async function enviar() {
  erroForm.value = null
  enviando.value = true
  const r = await saveProfile(user.value, form.value)
  enviando.value = false
  if (!r.ok) erroForm.value = r.error
}
</script>

<template>
  <div>
    <div v-if="carregandoSessao || (user && carregandoPerfil)" class="gate-card">
      <p class="text-ink/50" style="font-size: 14px">Carregando...</p>
    </div>

    <!-- Deslogado: convite para entrar -->
    <div v-else-if="!user" class="gate-card">
      <span class="gate-icon"><Lock class="w-[22px] h-[22px]" /></span>
      <h3 class="font-display mt-4" style="font-size: 24px">Crie sua conta gratuita para ver os detalhes</h3>
      <p class="text-ink/60 mt-2 mx-auto" style="font-size: 15px; max-width: 46ch">
        Guia de aplicação, elegibilidade, link de inscrição e comentários da comunidade ficam disponíveis depois de um cadastro rápido e 100% gratuito.
      </p>
      <button class="btn-google mt-6" :disabled="carregandoSessao" @click="signInWithGoogle">
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/>
          <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.96v2.33A9 9 0 0 0 9 18z"/>
          <path fill="#FBBC05" d="M3.98 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.02-2.33z"/>
          <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.02 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
        </svg>
        Entrar com Google
      </button>
    </div>

    <!-- Logado sem cadastro: formulário -->
    <div v-else-if="!profile" class="gate-card gate-card--form">
      <h3 class="font-display" style="font-size: 24px">Só mais um passo</h3>
      <p class="text-ink/60 mt-2" style="font-size: 15px">
        Complete seu cadastro para liberar os detalhes desta oportunidade.
      </p>

      <div class="form-grid mt-6">
        <label class="field-label">
          Nome completo
          <input v-model="form.name" class="field" type="text" placeholder="Seu nome" />
        </label>
        <label class="field-label">
          Telefone (com DDD)
          <input v-model="form.phone" class="field" type="tel" placeholder="(11) 91234-5678" />
        </label>
        <label class="field-label">
          Escola
          <input v-model="form.school" class="field" type="text" placeholder="Nome da sua escola" />
        </label>
        <label class="field-label">
          Escolaridade
          <select v-model="form.educationLevel" class="field">
            <option value="" disabled>Selecione...</option>
            <option v-for="n in niveis" :key="n.key" :value="n.key">{{ n.label }}</option>
          </select>
        </label>
        <label class="field-label field-label--full">
          Renda familiar <span class="text-ink/45">(opcional)</span>
          <select v-model="form.income" class="field">
            <option value="">Prefiro não informar</option>
            <option v-for="f in faixasRenda" :key="f.key" :value="f.key">{{ f.label }}</option>
          </select>
        </label>
      </div>

      <p v-if="erroForm" class="mt-4" style="color: #E24444; font-size: 13.5px">{{ erroForm }}</p>

      <button class="btn btn-ink mt-6" :disabled="enviando" @click="enviar">
        <template v-if="enviando">Enviando...</template>
        <template v-else>Concluir cadastro <ArrowRight class="w-[18px] h-[18px]" /></template>
      </button>
    </div>

    <!-- Logado e cadastrado: libera o conteúdo -->
    <slot v-else />
  </div>
</template>

<style scoped>
.gate-card {
  text-align: center;
  padding: 56px 32px;
  border-radius: var(--r-card);
  border: 2px solid color-mix(in srgb, var(--color-ink) 10%, transparent);
  background: #fff;
}
.gate-card--form {
  text-align: left;
  padding: 36px 32px;
}
.gate-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  color: var(--color-primary);
}
.btn-google {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 13px 22px;
  border-radius: 999px;
  border: 2px solid color-mix(in srgb, var(--color-ink) 14%, transparent);
  background: #fff;
  font-weight: 600;
  font-size: 15px;
  color: var(--color-ink);
  transition: border-color .2s ease, box-shadow .2s ease;
}
.btn-google:hover { border-color: var(--color-ink); box-shadow: 0 8px 20px color-mix(in srgb, var(--color-ink) 10%, transparent); }
.btn-google:disabled { opacity: .6; }

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}
.field-label--full {
  grid-column: 1 / -1;
}
.field-label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13.5px;
  font-weight: 600;
  color: color-mix(in srgb, var(--color-ink) 75%, transparent);
}
.field {
  padding: 13px 14px;
  border-radius: 14px;
  border: 2px solid color-mix(in srgb, var(--color-ink) 12%, transparent);
  font-family: var(--font-body, inherit);
  font-size: 14.5px;
  font-weight: 500;
  color: var(--color-ink);
  background: #fff;
  transition: border-color .2s ease;
}
.field:focus { outline: none; border-color: var(--color-ink); }

@media (max-width: 640px) {
  .form-grid { grid-template-columns: 1fr; }
  .gate-card { padding: 40px 22px; }
}
</style>
