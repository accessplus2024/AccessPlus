<script setup>
import { Lock } from "@iconoir/vue"
import { CATEGORIES } from "~/utils/categories"
import { useAuth } from "~/composables/useAuth"
import { useOpportunitySubmissions } from "~/composables/useOpportunitySubmissions"

useHead({
  title: "Cadastrar oportunidade",
  meta: [
    { charset: "UTF-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1.0" },
    { name: "description", content: "Sua organização tem uma oportunidade educacional para jovens? Cadastre aqui — nossa equipe revisa e publica." },
  ],
  htmlAttrs: { lang: "pt-br" },
  link: [{ rel: "icon", href: "/favicon.ico" }],
})

const niveis = ["Fundamental", "Ensino Médio", "Gap Year", "Faculdade"]
const areasDisponiveis = ["Meio Ambiente", "Humanas", "STEM", "Linguagens", "Artes"]
const custos = ["Bolsa", "Gratuito", "Totalmente Financiado"]
const formatos = ["Presencial", "Remoto", "Híbrido"]

const { user, init, signInWithGoogle } = useAuth()
const { submeter } = useOpportunitySubmissions()

const form = ref({
  organizationName: "", title: "", link: "", description: "", type: "", deadline: "",
  level: [], areas: [], location: "", cost: "", format: "", eligibility: "",
  submitterName: "", submitterEmail: "", submitterNote: "",
})

const enviando = ref(false)
const erro = ref(null)
const enviado = ref(false)

function toggleLista(lista, valor) {
  const i = lista.indexOf(valor)
  if (i === -1) lista.push(valor)
  else lista.splice(i, 1)
}

// Sugere nome/e-mail de quem está logado — a organização só corrige se
// quiser, em vez de redigitar o que o Google já sabe.
function preencherContato() {
  if (!user.value) return
  if (!form.value.submitterName) form.value.submitterName = user.value.user_metadata?.full_name || user.value.user_metadata?.name || ""
  if (!form.value.submitterEmail) form.value.submitterEmail = user.value.email || ""
}

onMounted(() => {
  init()
  preencherContato()
})
watch(user, (novo) => { if (novo) preencherContato() })

async function enviar() {
  erro.value = null
  enviando.value = true
  const r = await submeter(user.value, form.value)
  enviando.value = false
  if (!r.ok) { erro.value = r.error; return }
  enviado.value = true
}
</script>

<template>
  <main class="wrap" style="padding-top: 120px; padding-bottom: 80px; max-width: 760px">
    <span class="kicker">Para organizações</span>
    <h1 class="mt-4" style="font-size: clamp(30px, 4.5vw, 46px); text-wrap: balance">
      Cadastre uma oportunidade
    </h1>
    <p class="text-ink/70 leading-relaxed mt-4" style="font-size: 17px; max-width: 60ch">
      Sua organização oferece bolsas, olimpíadas, intercâmbios ou outro programa educacional para jovens?
      Preencha o formulário abaixo — nossa equipe revisa e, se aprovado, publicamos no catálogo gratuitamente.
    </p>
    <p class="text-ink/50 mt-2" style="font-size: 13.5px; font-weight: 600">⏱️ Leva cerca de 5 minutos</p>

    <div v-if="!user" class="login-card mt-10">
      <span class="gate-icon"><Lock class="w-[20px] h-[20px]" /></span>
      <h3 class="font-display mt-3" style="font-size: 22px">Entre pra cadastrar sua oportunidade</h3>
      <p class="text-ink/60 mt-2 mx-auto" style="font-size: 15px; max-width: 44ch">
        Só pedimos login pra você conseguir acompanhar o status depois — ver se foi aprovada e editar
        enquanto estiver em análise.
      </p>
      <button class="btn-google mt-6" @click="signInWithGoogle">
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/>
          <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.96v2.33A9 9 0 0 0 9 18z"/>
          <path fill="#FBBC05" d="M3.98 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.02-2.33z"/>
          <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.02 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
        </svg>
        Entrar com Google
      </button>
    </div>

    <div v-else-if="enviado" class="sent-card mt-10">
      <h2 class="font-display" style="font-size: 24px">Recebemos, obrigada!</h2>
      <p class="text-ink/65 mt-2" style="font-size: 15px">
        Nossa equipe vai revisar essa oportunidade. Se for aprovada, ela aparece no catálogo do Access+ em breve.
      </p>
      <NuxtLink to="/minhas-oportunidades-enviadas" class="tracker-link mt-4">Ver minhas oportunidades enviadas</NuxtLink>
    </div>

    <form v-else class="form-grid mt-10" @submit.prevent="enviar">
      <label class="field-label field-label--full">
        Nome da organização
        <span class="text-ink/50" style="font-weight: 500; font-size: 13px">
          Quem oferece a oportunidade — o estudante que ler isso no site pode não conhecer sua organização, então esse nome aparece com destaque na publicação.
        </span>
        <input v-model="form.organizationName" class="field" type="text" placeholder="Ex: Instituto XYZ" />
      </label>

      <label class="field-label field-label--full">
        Nome da oportunidade
        <input v-model="form.title" class="field" type="text" placeholder="Ex: Bolsa de Iniciação Científica XYZ" />
      </label>

      <label class="field-label field-label--full">
        Descrição
        <textarea v-model="form.description" class="field" rows="4" placeholder="Do que se trata, o que a pessoa vai fazer/aprender..." />
      </label>

      <label class="field-label field-label--full">
        Link oficial de inscrição
        <input v-model="form.link" class="field" type="url" placeholder="https://..." />
      </label>

      <label class="field-label">
        Categoria
        <select v-model="form.type" class="field">
          <option value="" disabled>Selecione...</option>
          <option v-for="c in CATEGORIES" :key="c.type" :value="c.type">{{ c.label }}</option>
        </select>
      </label>

      <label class="field-label">
        Prazo de inscrição
        <input v-model="form.deadline" class="field" type="text" placeholder="Ex: 15 de dezembro de 2026" />
      </label>

      <label class="field-label">
        Formato
        <select v-model="form.format" class="field">
          <option value="" disabled>Selecione...</option>
          <option v-for="f in formatos" :key="f" :value="f">{{ f }}</option>
        </select>
      </label>

      <label class="field-label">
        Localização
        <input v-model="form.location" class="field" type="text" placeholder="Ex: São Paulo, SP ou Online" />
      </label>

      <label class="field-label">
        Custo
        <select v-model="form.cost" class="field">
          <option value="" disabled>Selecione...</option>
          <option v-for="c in custos" :key="c" :value="c">{{ c }}</option>
        </select>
      </label>

      <div class="field-label field-label--full">
        Nível de ensino (marque um ou mais)
        <div class="chip-row mt-1">
          <button
            v-for="n in niveis" :key="n" type="button"
            class="chip" :class="{ active: form.level.includes(n) }"
            @click="toggleLista(form.level, n)"
          >{{ n }}</button>
        </div>
      </div>

      <div class="field-label field-label--full">
        Área de interesse (marque uma ou mais)
        <div class="chip-row mt-1">
          <button
            v-for="a in areasDisponiveis" :key="a" type="button"
            class="chip" :class="{ active: form.areas.includes(a) }"
            @click="toggleLista(form.areas, a)"
          >{{ a }}</button>
        </div>
      </div>

      <label class="field-label field-label--full">
        Elegibilidade — quem pode se inscrever
        <textarea v-model="form.eligibility" class="field" rows="3" placeholder="Ex: estudantes de Ensino Médio, entre 15 e 18 anos..." />
      </label>

      <div class="field-label--full form-divider">Seus dados de contato</div>

      <label class="field-label">
        Seu nome
        <input v-model="form.submitterName" class="field" type="text" placeholder="Quem está enviando" />
      </label>

      <label class="field-label">
        Seu e-mail
        <input v-model="form.submitterEmail" class="field" type="email" placeholder="seu@email.com" />
      </label>

      <label class="field-label field-label--full">
        Algo mais que devêssemos saber? <span class="text-ink/45">(opcional)</span>
        <textarea v-model="form.submitterNote" class="field" rows="2" placeholder="Contexto adicional sobre a oportunidade" />
      </label>

      <p v-if="erro" class="field-label--full" style="color: #E24444; font-size: 13.5px">{{ erro }}</p>

      <button class="btn btn-ink field-label--full mt-2" style="justify-self: start" :disabled="enviando" type="submit">
        {{ enviando ? "Enviando..." : "Enviar oportunidade" }}
      </button>
    </form>
  </main>
</template>

<style scoped>
.login-card {
  position: relative;
  text-align: center;
  padding: 56px 32px;
  border-radius: var(--r-card);
  border: 2px solid color-mix(in srgb, var(--color-ink) 10%, transparent);
  background: #fff;
}
.gate-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  color: var(--color-primary);
}
.btn-google {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 26px;
  border-radius: var(--r-pill);
  border: 2px solid color-mix(in srgb, var(--color-ink) 14%, transparent);
  background: #fff;
  font-family: var(--font-body, inherit);
  font-weight: 600;
  font-size: 15px;
  color: var(--color-ink);
  transition: border-color .2s ease, box-shadow .2s ease, transform .25s var(--ease, ease);
}
.btn-google:hover {
  border-color: var(--color-primary);
  box-shadow: 0 10px 24px color-mix(in srgb, var(--color-primary) 20%, transparent);
  transform: translateY(-2px);
}

.tracker-link {
  display: inline-block;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-primary);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.sent-card {
  padding: 32px;
  border-radius: var(--r-card);
  background: color-mix(in srgb, var(--color-lime) 16%, #fff);
  border: 2px solid color-mix(in srgb, var(--color-ink) 10%, transparent);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.field-label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13.5px;
  font-weight: 600;
  color: color-mix(in srgb, var(--color-ink) 75%, transparent);
}
.field-label--full {
  grid-column: 1 / -1;
}

.field {
  padding: 14px 16px;
  border-radius: 14px;
  border: 2px solid color-mix(in srgb, var(--color-ink) 12%, transparent);
  font-family: var(--font-body, inherit);
  font-size: 15px;
  font-weight: 500;
  color: var(--color-ink);
  background: #fff;
  resize: vertical;
  transition: border-color 0.2s ease;
}
.field:focus { outline: none; border-color: var(--color-ink); }

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.chip {
  padding: 9px 16px;
  border-radius: 999px;
  border: 2px solid color-mix(in srgb, var(--color-ink) 15%, transparent);
  font-weight: 600;
  font-size: 13.5px;
  color: var(--color-ink);
  transition: all 0.2s ease;
}
.chip.active {
  background: var(--color-ink);
  border-color: var(--color-ink);
  color: var(--color-paper);
}

.form-divider {
  margin-top: 12px;
  padding-top: 24px;
  border-top: 1px solid color-mix(in srgb, var(--color-ink) 10%, transparent);
  font-family: var(--font-display, inherit);
  font-size: 19px;
  font-weight: 700;
  color: var(--color-ink);
}

@media (max-width: 640px) {
  .form-grid { grid-template-columns: 1fr; }
}
</style>
