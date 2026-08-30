<script setup>
import { ref, computed, onMounted, watch } from "vue"
import { Lock } from "@iconoir/vue"
import { CATEGORIES } from "~/utils/categories"
import { useAuth } from "~/composables/useAuth"
import { useOpportunitySubmissions } from "~/composables/useOpportunitySubmissions"

useHead({
  title: "Minhas oportunidades enviadas — Access+",
  meta: [{ name: "description", content: "Acompanhe o status das oportunidades que sua organização enviou pro Access+." }],
})

const { user, init, signInWithGoogle } = useAuth()
const { minhas, carregando, erro, fetchMinhas, atualizar } = useOpportunitySubmissions()

onMounted(() => {
  init()
  if (user.value) fetchMinhas(user.value.id)
})
watch(user, (novo) => { if (novo) fetchMinhas(novo.id) })

const colunas = [
  { key: "pendente", label: "Pendente", accent: "var(--color-amber)" },
  { key: "aprovada", label: "Aprovada", accent: "var(--color-lime)" },
  { key: "rejeitada", label: "Rejeitada", accent: "#E24444" },
]

function itensDe(status) {
  return computed(() => minhas.value.filter((s) => s.status === status))
}
const porColuna = colunas.map((c) => ({ ...c, itens: itensDe(c.key) }))

function categoriaLabel(type) {
  return CATEGORIES.find((c) => c.type === type)?.label || type
}

function formatarData(iso) {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
}

// ── Edição (mesmos campos do formulário de cadastro) ────────────────────
const niveis = ["Fundamental", "Ensino Médio", "Gap Year", "Faculdade"]
const areasDisponiveis = ["Meio Ambiente", "Humanas", "STEM", "Linguagens", "Artes"]
const custos = ["Bolsa", "Gratuito", "Totalmente Financiado"]
const formatos = ["Presencial", "Remoto", "Híbrido"]

const editando = ref(false)
const editandoId = ref(null)
const enviandoEdicao = ref(false)
const erroEdicao = ref(null)
const formEdicao = ref({
  organizationName: "", title: "", link: "", description: "", type: "", deadline: "",
  level: [], areas: [], location: "", cost: "", format: "", eligibility: "",
  submitterName: "", submitterEmail: "", submitterNote: "",
})

function toggleLista(lista, valor) {
  const i = lista.indexOf(valor)
  if (i === -1) lista.push(valor)
  else lista.splice(i, 1)
}

function abrirEdicao(item) {
  formEdicao.value = {
    organizationName: item.organization_name,
    title: item.title,
    link: item.link,
    description: item.description,
    type: item.type,
    deadline: item.deadline,
    level: [...(item.level || [])],
    areas: [...(item.areas || [])],
    location: item.location,
    cost: item.cost,
    format: item.format,
    eligibility: item.eligibility,
    submitterName: item.submitter_name,
    submitterEmail: item.submitter_email,
    submitterNote: item.submitter_note || "",
  }
  editandoId.value = item.id
  erroEdicao.value = null
  editando.value = true
}

async function salvarEdicao() {
  erroEdicao.value = null
  enviandoEdicao.value = true
  const r = await atualizar(editandoId.value, formEdicao.value)
  enviandoEdicao.value = false
  if (!r.ok) { erroEdicao.value = r.error; return }
  editando.value = false
}
</script>

<template>
  <div class="wrap" style="padding-top: 140px; padding-bottom: 100px">
    <span class="kicker">Para organizações</span>
    <h1 class="mt-3" style="font-family: var(--font-display); font-size: clamp(30px, 4vw, 46px)">
      Minhas oportunidades enviadas
    </h1>
    <p class="text-ink/62 mt-3" style="font-size: 16px; max-width: 56ch">
      Acompanhe o status de tudo que sua organização já enviou pro Access+.
    </p>

    <div v-if="!user" class="login-card mt-10">
      <span class="gate-icon"><Lock class="w-[20px] h-[20px]" /></span>
      <h3 class="font-display mt-3" style="font-size: 22px">Entre pra ver suas oportunidades</h3>
      <p class="text-ink/60 mt-2 mx-auto" style="font-size: 15px; max-width: 40ch">
        Entre com a mesma conta Google que você usou pra enviar.
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

    <template v-else>
      <p v-if="carregando" class="mt-10 text-ink/50" style="font-size: 14px">Carregando...</p>

      <div v-else-if="erro" class="empty-state mt-10">
        <p style="font-size: 16px; color: #E24444">{{ erro }}</p>
      </div>

      <div v-else-if="!minhas.length" class="empty-state mt-10">
        <p style="font-size: 16px">
          Você ainda não enviou nenhuma oportunidade.
          <NuxtLink to="/cadastrar-oportunidade" class="tracker-link">Cadastrar uma agora</NuxtLink>
        </p>
      </div>

      <div v-else class="board mt-10">
        <div v-for="col in porColuna" :key="col.key" class="board-col">
          <div class="board-col-head">
            <span class="dot" :style="{ background: col.accent }" />
            <h3>{{ col.label }}</h3>
            <span class="count">{{ col.itens.value.length }}</span>
          </div>

          <p v-if="!col.itens.value.length" class="board-empty">Nada aqui ainda.</p>

          <article v-for="item in col.itens.value" :key="item.id" class="app-card">
            <h4 class="app-card-title">{{ item.title }}</h4>
            <p class="app-card-org">{{ item.organization_name }} · {{ categoriaLabel(item.type) }}</p>
            <p class="app-card-deadline">Enviada em {{ formatarData(item.created_at) }}</p>
            <div v-if="col.key === 'pendente'" class="app-card-actions">
              <button type="button" class="app-card-advance" @click="abrirEdicao(item)">Editar</button>
            </div>
          </article>
        </div>
      </div>
    </template>

    <!-- Modal de edição — mesmo padrão de UserMenu.vue (cabeçalho e ações
         fixos fora do scroll, container query pro grid responsivo). -->
    <Teleport to="body">
      <div v-if="editando" class="edicao-overlay" @click.self="editando = false">
        <div class="edicao-modal">
          <div class="edicao-cabecalho">
            <h3 class="font-display" style="font-size: 22px">Editar oportunidade</h3>
            <p class="text-ink/60 mt-1" style="font-size: 14px">Só dá pra editar enquanto estiver pendente.</p>
          </div>

          <div class="edicao-corpo">
            <label class="field-label field-label--full">
              Nome da organização
              <input v-model="formEdicao.organizationName" class="field" type="text" />
            </label>
            <label class="field-label field-label--full">
              Nome da oportunidade
              <input v-model="formEdicao.title" class="field" type="text" />
            </label>
            <label class="field-label field-label--full">
              Descrição
              <textarea v-model="formEdicao.description" class="field" rows="4" />
            </label>
            <label class="field-label field-label--full">
              Link oficial de inscrição
              <input v-model="formEdicao.link" class="field" type="url" />
            </label>
            <label class="field-label">
              Categoria
              <select v-model="formEdicao.type" class="field">
                <option v-for="c in CATEGORIES" :key="c.type" :value="c.type">{{ c.label }}</option>
              </select>
            </label>
            <label class="field-label">
              Prazo de inscrição
              <input v-model="formEdicao.deadline" class="field" type="text" />
            </label>
            <label class="field-label">
              Formato
              <select v-model="formEdicao.format" class="field">
                <option v-for="f in formatos" :key="f" :value="f">{{ f }}</option>
              </select>
            </label>
            <label class="field-label">
              Localização
              <input v-model="formEdicao.location" class="field" type="text" />
            </label>
            <label class="field-label">
              Custo
              <select v-model="formEdicao.cost" class="field">
                <option v-for="c in custos" :key="c" :value="c">{{ c }}</option>
              </select>
            </label>
            <div class="field-label field-label--full">
              Nível de ensino
              <div class="chip-row mt-1">
                <button
                  v-for="n in niveis" :key="n" type="button"
                  class="chip" :class="{ active: formEdicao.level.includes(n) }"
                  @click="toggleLista(formEdicao.level, n)"
                >{{ n }}</button>
              </div>
            </div>
            <div class="field-label field-label--full">
              Área de interesse
              <div class="chip-row mt-1">
                <button
                  v-for="a in areasDisponiveis" :key="a" type="button"
                  class="chip" :class="{ active: formEdicao.areas.includes(a) }"
                  @click="toggleLista(formEdicao.areas, a)"
                >{{ a }}</button>
              </div>
            </div>
            <label class="field-label field-label--full">
              Elegibilidade
              <textarea v-model="formEdicao.eligibility" class="field" rows="3" />
            </label>
            <div class="field-label--full form-divider">Seus dados de contato</div>
            <label class="field-label">
              Seu nome
              <input v-model="formEdicao.submitterName" class="field" type="text" />
            </label>
            <label class="field-label">
              Seu e-mail
              <input v-model="formEdicao.submitterEmail" class="field" type="email" />
            </label>
            <label class="field-label field-label--full">
              Algo mais que devêssemos saber? <span class="text-ink/45">(opcional)</span>
              <textarea v-model="formEdicao.submitterNote" class="field" rows="2" />
            </label>

            <p v-if="erroEdicao" class="field-label--full" style="color: #E24444; font-size: 13.5px">{{ erroEdicao }}</p>
          </div>

          <div class="edicao-acoes">
            <button class="edit-btn edit-btn--secundario" :disabled="enviandoEdicao" @click="editando = false">
              Cancelar
            </button>
            <button class="btn btn-ink" :disabled="enviandoEdicao" @click="salvarEdicao">
              {{ enviandoEdicao ? "Salvando..." : "Salvar alterações" }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.login-card {
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
  font-weight: 600;
  color: var(--color-primary);
  text-decoration: underline;
  text-underline-offset: 3px;
}

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
  padding: 18px 18px 16px;
  margin-bottom: 14px;
  border-radius: var(--r-card);
  background: #fff;
  border: 1.5px solid color-mix(in srgb, var(--color-ink) 8%, transparent);
  box-shadow: 0 6px 18px rgba(21, 17, 31, 0.05);
}
.app-card-title {
  font-weight: 700;
  font-size: 15px;
  color: var(--color-ink);
  line-height: 1.35;
}
.app-card-org {
  margin-top: 6px;
  font-size: 12.5px;
  color: color-mix(in srgb, var(--color-ink) 55%, transparent);
}
.app-card-deadline {
  margin-top: 8px;
  font-size: 12.5px;
  color: color-mix(in srgb, var(--color-ink) 55%, transparent);
}
.app-card-actions {
  margin-top: 14px;
}
.app-card-advance {
  display: inline-flex;
  align-items: center;
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

/* Modal de edição — mesma estrutura de UserMenu.vue: cabeçalho e ações fora
   do scroll, só o corpo rola. */
.edicao-overlay {
  position: fixed;
  inset: 0;
  background: rgba(21, 17, 31, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 200;
}
.edicao-modal {
  width: min(760px, 100%);
  max-height: calc(100vh - 40px);
  max-height: calc(100dvh - 40px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
  border-radius: 22px;
  padding: 24px;
  text-align: left;
  box-shadow: 0 30px 60px rgba(21, 17, 31, 0.25);
  container-type: inline-size;
  container-name: edicao;
}
.edicao-cabecalho { flex: none; }
.edicao-corpo {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 12px 2px 2px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  scrollbar-width: thin;
  scrollbar-color: #999999 var(--color-paper);
}
.edicao-acoes {
  flex: none;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 14px;
  margin-top: 14px;
  border-top: 1px solid color-mix(in srgb, var(--color-ink) 8%, transparent);
}
@container edicao (max-width: 520px) {
  .edicao-corpo { grid-template-columns: 1fr; }
}
@supports not (container-type: inline-size) {
  @media (max-width: 560px) {
    .edicao-corpo { grid-template-columns: 1fr; }
  }
}

.field-label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13.5px;
  font-weight: 600;
  color: color-mix(in srgb, var(--color-ink) 75%, transparent);
}
.field-label--full { grid-column: 1 / -1; }
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

.edit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 22px;
  border-radius: 999px;
  border: 2px solid color-mix(in srgb, var(--color-primary) 30%, transparent);
  background: color-mix(in srgb, var(--color-primary) 8%, transparent);
  font-weight: 600;
  font-size: 13.5px;
  color: var(--color-primary);
  transition: border-color 0.2s ease, background 0.2s ease;
}
.edit-btn:hover { border-color: var(--color-primary); background: color-mix(in srgb, var(--color-primary) 14%, transparent); }
.edit-btn--secundario {
  border-color: color-mix(in srgb, var(--color-ink) 12%, transparent);
  background: transparent;
  color: var(--color-ink);
}
.edit-btn--secundario:hover { border-color: var(--color-ink); background: transparent; }

@media (max-width: 560px) {
  .edicao-modal { padding: 18px 16px; }
  .edicao-overlay { padding: 12px; }
  .edicao-acoes { flex-direction: column-reverse; }
  .edicao-acoes .btn,
  .edicao-acoes .edit-btn { width: 100%; }
}
</style>
