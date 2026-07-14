<script setup>
import { ArrowRight, ArrowLeft, Check, Copy } from "@iconoir/vue"
import { ref, computed, onMounted, onBeforeUnmount } from "vue"

const emit = defineEmits(['resultado'])

const aberto = ref(false)

const step = ref(0)
const totalSteps = 5
const carregando = ref(false)
const erro = ref(null)
const resposta = ref(null)

// Mensagens rotativas enquanto a busca acontece (para o estudante não ficar impaciente).
const mensagensCarregando = [
  'Buscando oportunidades incríveis para você',
  'Analisando suas preferências',
  'Cruzando tudo com a nossa base de dados',
  'Separando as melhores opções pra você',
  'Só mais um instante...',
]
const msgIndex = ref(0)
let msgTimer = null

function iniciarMensagens() {
  msgIndex.value = 0
  pararMensagens()
  msgTimer = setInterval(() => {
    msgIndex.value = (msgIndex.value + 1) % mensagensCarregando.length
  }, 2200)
}
function pararMensagens() {
  if (msgTimer) { clearInterval(msgTimer); msgTimer = null }
}
onBeforeUnmount(pararMensagens)

// Cota diária da IA esgotada?
const cotaEsgotada = ref(false)
const CHAVE_COTA = 'accessia_cota_esgotada' // localStorage: guarda a data "AAAA-MM-DD"

function hojeBR() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" })
}

function marcarCotaEsgotada() {
  cotaEsgotada.value = true
  try { localStorage.setItem(CHAVE_COTA, hojeBR()) } catch (_) {}
}

// Antes mesmo do estudante interagir, checamos se a cota já estourou hoje.
onMounted(async () => {
  try {
    if (localStorage.getItem(CHAVE_COTA) === hojeBR()) {
      cotaEsgotada.value = true
      return
    }
  } catch (_) {}
  try {
    const status = await $fetch('/api/rag/status')
    if (status?.quotaExceeded) cotaEsgotada.value = true
  } catch (_) { /* silencioso: se falhar, seguimos normal */ }
})

// Converte o markdown da resposta em HTML seguro, no estilo do Access+.
function renderMarkdown(texto = '') {
  const escapar = (s) => s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const inline = (s) => escapar(s)
    // links [texto](url)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener" class="md-link">$1</a>')
    // negrito **texto**
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // itálico *texto*
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')

  const linhas = texto.split('\n')
  let html = ''
  let emLista = false
  const fecharLista = () => { if (emLista) { html += '</ul>'; emLista = false } }

  for (const bruta of linhas) {
    const l = bruta.trim()
    if (!l) { fecharLista(); continue }
    if (/^[-*]\s+/.test(l)) {
      if (!emLista) { html += '<ul class="md-list">'; emLista = true }
      html += `<li>${inline(l.replace(/^[-*]\s+/, ''))}</li>`
    } else {
      fecharLista()
      html += `<p>${inline(l)}</p>`
    }
  }
  fecharLista()
  return html
}

const respostaHtml = computed(() =>
  resposta.value?.resposta ? renderMarkdown(resposta.value.resposta) : ''
)

// Cores da marca — cada cartão recebe um acento diferente, ciclando.
const acentos = ['#4B3FE4', '#FF2D8A', '#C8F135', '#7DECE9', '#FF7A45', '#8BC34A']
function acento(i) { return acentos[i % acentos.length] }

// Copiar resultado (título + link de cada oportunidade) para a área de transferência.
const copiado = ref(false)
let copiadoTimer = null
async function copiarResultado() {
  const ops = resposta.value?.oportunidades || []
  if (!ops.length) return
  const base = typeof window !== 'undefined' ? window.location.origin : ''
  const linhas = ops.map(o => `• ${o.title} — ${base}/oportunidade/${o.id}`)
  const texto = `Oportunidades selecionadas pela AccessIA:\n\n${linhas.join('\n')}`
  try {
    await navigator.clipboard.writeText(texto)
    copiado.value = true
    if (copiadoTimer) clearTimeout(copiadoTimer)
    copiadoTimer = setTimeout(() => { copiado.value = false }, 2000)
  } catch (_) { /* navegador sem permissão de clipboard */ }
}

const respostas = ref({
  nivel: null,
  areas: [],
  objetivo: '',
  experiencia: '',
  local: null,
})

const niveis = [
  { key: 'fundamental', label: 'Ensino Fundamental' },
  { key: 'medio', label: 'Ensino Médio' },
  { key: 'gap', label: 'Gap Year' },
]

const areas = [
  { key: 'meio-ambiente', label: 'Meio Ambiente', color: '#8BC34A' },
  { key: 'humanas', label: 'Humanas', color: '#FF2D8A' },
  { key: 'stem', label: 'STEM', color: '#4B3FE4' },
  { key: 'linguagens', label: 'Linguagens', color: '#7DECE9' },
  { key: 'artes', label: 'Artes', color: '#C8F135' },
  { key: 'bio', label: 'Biologia', color: '#FF7A45' },
]

const locais = [
  { key: 'brasil', label: 'No Brasil' },
  { key: 'fora', label: 'Fora do Brasil' },
  { key: 'ambos', label: 'Tanto faz' },
]

function toggleArea(key) {
  const i = respostas.value.areas.indexOf(key)
  if (i === -1) respostas.value.areas.push(key)
  else respostas.value.areas.splice(i, 1)
}

const podeAvancar = computed(() => {
  switch (step.value) {
    case 0: return !!respostas.value.nivel
    case 1: return respostas.value.areas.length > 0
    case 2: return respostas.value.objetivo.trim().length > 0
    case 3: return true
    case 4: return !!respostas.value.local
    default: return false
  }
})

function proximo() {
  if (!podeAvancar.value) return
  if (step.value < totalSteps - 1) step.value++
  else enviar()
}

function voltar() {
  if (step.value > 0) step.value--
}

function construirPergunta() {
  const areasTexto = respostas.value.areas
    .map(key => areas.find(a => a.key === key)?.label)
    .join(', ')

  const localTexto = {
    brasil: 'no Brasil',
    fora: 'fora do Brasil',
    ambos: 'no Brasil ou fora',
  }[respostas.value.local]

  return `Sou estudante do ${niveis.find(n => n.key === respostas.value.nivel)?.label}.
Tenho interesse nas áreas de ${areasTexto}.
Meu objetivo é: ${respostas.value.objetivo}.
${respostas.value.experiencia ? `Já participei de: ${respostas.value.experiencia}.` : ''}
Busco oportunidades ${localTexto}.`
}

async function enviar() {
  carregando.value = true
  erro.value = null
  iniciarMensagens()

  try {
    const data = await $fetch('/api/rag/search', {
      method: 'POST',
      body: { question: construirPergunta() }
    })

    // Cota diária esgotada → mostra a mensagem de cota (sem resposta).
    if (data?.quotaExceeded) { marcarCotaEsgotada(); return }

    // IA sobrecarregada: se as oportunidades foram encontradas, mostramos MESMO ASSIM.
    if (data?.overloaded) {
      if (data.oportunidades?.length) {
        resposta.value = { resposta: '', oportunidades: data.oportunidades, sobrecarga: true }
        emit('resultado', resposta.value)
      } else {
        erro.value = 'A Accessia está a mil por hora agora 🙂 tenta de novo em uns segundos.'
      }
      return
    }

    resposta.value = data
    emit('resultado', data)
  } catch (e) {
    const status = e?.response?.status || e?.status || e?.statusCode
    const payload = e?.data
    if (status === 429 || payload?.quotaExceeded) { marcarCotaEsgotada(); return }
    if (status === 503 || payload?.overloaded) {
      if (payload?.oportunidades?.length) {
        resposta.value = { resposta: '', oportunidades: payload.oportunidades, sobrecarga: true }
      } else {
        erro.value = 'A Accessia está a mil por hora agora 🙂 tenta de novo em uns segundos.'
      }
      return
    }
    // 504 = a busca demorou demais (tempo limite do servidor).
    if (status === 504) {
      erro.value = 'A busca demorou mais que o esperado. Tenta de novo, por favor 🙂'
      return
    }
    console.error('Erro completo:', e)
    erro.value = payload?.error || e?.message || 'Algo deu errado ao buscar suas oportunidades. Tenta de novo?'
  } finally {
    carregando.value = false
    pararMensagens()
  }
}

function recomecar() {
  step.value = 0
  resposta.value = null
  erro.value = null
  respostas.value = { nivel: null, areas: [], objetivo: '', experiencia: '', local: null }
}
</script>

<template>
  <div class="accessia">

    <!-- ================= TOGGLE (fechado) ================= -->
    <button
      class="toggle-bar"
      :class="{ muted: cotaEsgotada }"
      @click="cotaEsgotada ? null : (aberto = !aberto)"
    >
      <span class="flex items-center gap-2">
        <span class="toggle-dot" :class="{ off: cotaEsgotada }" />
        <span class="font-display" style="font-size: 18px">AccessIA</span>
        <span class="badge-beta">versão teste</span>
      </span>
      <ArrowRight v-if="!cotaEsgotada" class="w-[18px] h-[18px] toggle-arrow" :class="{ open: aberto }" />
    </button>

    <!-- ============ COTA ESGOTADA (antes mesmo de abrir) ============ -->
    <div v-if="cotaEsgotada" class="panel panel-quota mt-3">
      <p class="quota-msg">
        Sinto muito, a quota de hoje já foi atingida — volte amanhã para conversar com a Accessia.
      </p>
      <p class="quota-warn">
        Somos um projeto gratuito, por isso nossos limites de IA são gratuitos também.
        <NuxtLink to="/sobre" class="md-link">Contribua para o projeto 💚</NuxtLink>
      </p>
    </div>

    <!-- ================= PAINEL (aberto) ================= -->
    <Transition name="expand">
      <div v-if="aberto && !cotaEsgotada" class="panel mt-3">

        <!-- Carregando: sparkles da marca + mensagens rotativas -->
        <div v-if="carregando" class="loading-wrap">
          <div class="loading-sparks">
            <Sparkle :size="24" color="var(--color-primary)" class="spark s1" />
            <Sparkle :size="34" color="var(--color-magenta)" class="spark s2" />
            <Sparkle :size="24" color="var(--color-lime)" class="spark s3" />
          </div>
          <Transition name="fade-msg" mode="out-in">
            <p :key="msgIndex" class="loading-msg">{{ mensagensCarregando[msgIndex] }}</p>
          </Transition>
        </div>

        <!-- Resultado final -->
        <div v-else-if="resposta">
          <div class="flex items-start justify-between gap-4">
            <h2 class="font-display mt-[2px] flex items-center gap-2.5" style="font-size: clamp(26px, 5vw, 36px)">
              <Sparkle :size="24" color="var(--color-primary)" class="flex-none" />
              Suas oportunidades
            </h2>
            <button
              v-if="resposta.oportunidades?.length"
              class="copy-btn flex-none"
              :class="{ done: copiado }"
              @click="copiarResultado"
            >
              <component :is="copiado ? Check : Copy" class="w-[16px] h-[16px]" />
              {{ copiado ? 'Copiado!' : 'Copiar' }}
            </button>
          </div>

          <div v-if="respostaHtml" class="md-prose mt-[18px]" v-html="respostaHtml" />

          <p v-if="resposta.sobrecarga" class="sobrecarga-nota mt-[18px]">
            A Accessia está a mil por hora agora, então já separei estas oportunidades pra você 💛
          </p>

          <div class="op-list mt-7">
            <NuxtLink
              v-for="(o, i) in resposta.oportunidades"
              :key="o.id"
              :to="`/oportunidade/${o.id}`"
              class="op-card"
              :style="{ '--accent': acento(i) }"
            >
              <span class="op-accent" />
              <div class="op-body">
                <div class="flex items-start justify-between gap-3">
                  <h3 class="op-title font-display">{{ o.title }}</h3>
                  <span class="op-go flex-none">
                    <ArrowRight class="w-[16px] h-[16px]" />
                  </span>
                </div>
                <p class="op-desc">{{ o.description }}</p>
                <span class="op-link">Ver oportunidade</span>
              </div>
            </NuxtLink>
          </div>

          <button class="btn btn-out mt-8" @click="recomecar">
            <ArrowLeft class="w-[18px] h-[18px]" /> Fazer nova busca
          </button>
        </div>

        <!-- Wizard -->
        <div v-else>
          <span class="text-ink/50" style="font-size: 13px; font-weight: 600">
            Etapa {{ step + 1 }} de {{ totalSteps }}
          </span>

          <div class="progress mt-3 mb-8">
            <div class="progress-fill" :style="{ width: `${((step + 1) / totalSteps) * 100}%` }" />
          </div>

          <div v-if="step === 0">
            <h2 class="font-display" style="font-size: clamp(24px, 5vw, 34px)">
              Qual seu <span class="text-primary">nível</span> de ensino?
            </h2>
            <div class="flex flex-col gap-3 mt-6">
              <button
                v-for="n in niveis" :key="n.key"
                class="option-btn" :class="{ active: respostas.nivel === n.key }"
                @click="respostas.nivel = n.key"
              >
                {{ n.label }}
                <Check v-if="respostas.nivel === n.key" class="w-[18px] h-[18px]" />
              </button>
            </div>
          </div>

          <div v-else-if="step === 1">
            <h2 class="font-display" style="font-size: clamp(24px, 5vw, 34px)">
              Quais <span class="text-primary">áreas</span> te interessam?
            </h2>
            <p class="text-ink/60 mt-2" style="font-size: 14px">Pode escolher mais de uma.</p>
            <div class="flex flex-wrap gap-3 mt-6">
              <button
                v-for="a in areas" :key="a.key"
                class="chip"
                :class="{ active: respostas.areas.includes(a.key) }"
                :style="respostas.areas.includes(a.key) ? { background: a.color, borderColor: a.color } : {}"
                @click="toggleArea(a.key)"
              >
                {{ a.label }}
              </button>
            </div>
          </div>

          <div v-else-if="step === 2">
            <h2 class="font-display" style="font-size: clamp(24px, 5vw, 34px)">
              Qual é o seu <span class="text-primary">objetivo</span>?
            </h2>
            <p class="text-ink/60 mt-2" style="font-size: 14px">
              Ex: entrar numa boa faculdade, ganhar experiência em pesquisa, testar uma área nova...
            </p>
            <textarea
              v-model="respostas.objetivo"
              class="field mt-5"
              rows="4"
              placeholder="Escreve com suas palavras..."
            />
          </div>

          <div v-else-if="step === 3">
            <h2 class="font-display" style="font-size: clamp(24px, 5vw, 34px)">
              O que você já <span class="text-primary">fez</span>?
            </h2>
            <p class="text-ink/60 mt-2" style="font-size: 14px">
              Cursos, olimpíadas, projetos, trabalhos voluntários... (opcional)
            </p>
            <textarea
              v-model="respostas.experiencia"
              class="field mt-5"
              rows="4"
              placeholder="Se não tiver nada ainda, pode deixar em branco"
            />
          </div>

          <div v-else-if="step === 4">
            <h2 class="font-display" style="font-size: clamp(24px, 5vw, 34px)">
              Busca oportunidades <span class="text-primary">onde</span>?
            </h2>
            <div class="flex flex-col gap-3 mt-6">
              <button
                v-for="l in locais" :key="l.key"
                class="option-btn" :class="{ active: respostas.local === l.key }"
                @click="respostas.local = l.key"
              >
                {{ l.label }}
                <Check v-if="respostas.local === l.key" class="w-[18px] h-[18px]" />
              </button>
            </div>
          </div>

          <p v-if="erro" class="mt-6" style="color: #E24444; font-size: 14px">{{ erro }}</p>

          <div class="flex gap-3 mt-10">
            <button v-if="step > 0" class="btn btn-out" @click="voltar" :disabled="carregando">
              <ArrowLeft class="w-[18px] h-[18px]" /> Voltar
            </button>
            <button
              class="btn btn-ink"
              :disabled="!podeAvancar || carregando"
              @click="proximo"
            >
              <template v-if="carregando">Buscando...</template>
              <template v-else-if="step === totalSteps - 1">Ver oportunidades <ArrowRight class="w-[18px] h-[18px]" /></template>
              <template v-else>Próximo <ArrowRight class="w-[18px] h-[18px]" /></template>
            </button>
          </div>
        </div>

      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Wrapper embutido no hero: serve de âncora para o painel flutuante. */
.accessia {
  position: relative;
  width: 100%;
}

.toggle-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 18px 24px;
  border-radius: 20px;
  border: 2px solid color-mix(in srgb, var(--color-ink) 12%, transparent);
  background: #fff;
  transition: border-color .2s ease;
}
.toggle-bar:hover {
  border-color: var(--color-ink);
}
.toggle-bar.muted {
  cursor: default;
  background: color-mix(in srgb, var(--color-ink) 4%, #fff);
}
.toggle-bar.muted:hover {
  border-color: color-mix(in srgb, var(--color-ink) 12%, transparent);
}
.toggle-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--color-lime);
}
.toggle-dot.off {
  background: color-mix(in srgb, var(--color-ink) 25%, transparent);
}
.toggle-arrow {
  transition: transform .25s ease;
}
.toggle-arrow.open {
  transform: rotate(90deg);
}

.badge-beta {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  background: var(--color-lime);
  color: #15111F;
  font-weight: 700;
  font-size: 11px;
  letter-spacing: .02em;
  text-transform: uppercase;
}

.panel {
  padding: 28px 26px;
  border-radius: 20px;
  border: 2px solid color-mix(in srgb, var(--color-ink) 10%, transparent);
  background: #fff;
}

/* Cartão de cota esgotada: fica visível de cara, no fluxo. */
.panel-quota {
  background: color-mix(in srgb, var(--color-lime) 16%, #fff);
  border-color: color-mix(in srgb, var(--color-ink) 12%, transparent);
}
.quota-msg {
  font-family: var(--font-display, inherit);
  font-size: 17px;
  line-height: 1.35;
  color: var(--color-ink);
}
.quota-warn {
  margin-top: 12px;
  font-size: 13px;
  line-height: 1.45;
  color: color-mix(in srgb, var(--color-ink) 60%, transparent);
}

.expand-enter-active, .expand-leave-active {
  transition: opacity .2s ease, transform .2s ease;
}
.expand-enter-from, .expand-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* ===== Estado de carregamento: sparkles da marca + mensagens rotativas ===== */
.loading-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 22px;
  padding: 40px 10px 46px;
}
.loading-sparks {
  display: flex;
  align-items: center;
  gap: 12px;
}
.spark {
  transform-origin: center;
  animation: spark-bob 1.5s ease-in-out infinite;
}
.spark.s2 { animation-delay: .2s; }
.spark.s3 { animation-delay: .4s; }
@keyframes spark-bob {
  0%, 100% { transform: translateY(2px) rotate(0deg) scale(.82); opacity: .45; }
  50%      { transform: translateY(-8px) rotate(24deg) scale(1.12); opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .spark { animation-duration: 3s; }
}
.loading-msg {
  font-family: var(--font-display, inherit);
  font-size: clamp(18px, 2.4vw, 21px);
  line-height: 1.3;
  color: var(--color-ink);
  max-width: 28ch;
}

/* transição suave entre as mensagens de carregamento */
.fade-msg-enter-active, .fade-msg-leave-active {
  transition: opacity .35s ease, transform .35s ease;
}
.fade-msg-enter-from { opacity: 0; transform: translateY(6px); }
.fade-msg-leave-to   { opacity: 0; transform: translateY(-6px); }

/* nota gentil quando a IA está sobrecarregada mas achamos oportunidades */
.sobrecarga-nota {
  font-size: 14.5px;
  line-height: 1.5;
  color: color-mix(in srgb, var(--color-ink) 70%, transparent);
  background: color-mix(in srgb, var(--color-lime) 18%, #fff);
  border-radius: 14px;
  padding: 12px 16px;
}

/* Resposta em markdown, no estilo Access+ */
.md-prose {
  color: color-mix(in srgb, var(--color-ink) 82%, transparent);
  line-height: 1.6;
  font-size: 15.5px;
}
.md-prose :deep(p) { margin: 0 0 12px; }
.md-prose :deep(p:last-child) { margin-bottom: 0; }
.md-prose :deep(strong) { color: var(--color-ink); font-weight: 700; }
.md-prose :deep(.md-list) { margin: 8px 0 14px; padding-left: 20px; list-style: disc; }
.md-prose :deep(.md-list li) { margin-bottom: 6px; }
.md-prose :deep(.md-link),
.md-link {
  color: var(--color-primary);
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.progress {
  height: 6px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-ink) 8%, transparent);
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: var(--color-lime);
  border-radius: 999px;
  transition: width .3s ease;
}

.option-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px;
  border-radius: 18px;
  border: 2px solid color-mix(in srgb, var(--color-ink) 12%, transparent);
  font-family: var(--font-body, inherit);
  font-weight: 600;
  font-size: 16px;
  text-align: left;
  transition: border-color .2s ease, background .2s ease;
}
.option-btn.active {
  border-color: var(--color-ink);
  background: color-mix(in srgb, var(--color-ink) 6%, transparent);
}

.chip {
  padding: 10px 20px;
  border-radius: 999px;
  border: 2px solid color-mix(in srgb, var(--color-ink) 15%, transparent);
  font-weight: 600;
  font-size: 14.5px;
  transition: all .2s ease;
}
.chip.active {
  color: #15111F;
  font-weight: 700;
}

.field {
  width: 100%;
  padding: 16px 18px;
  border-radius: 18px;
  border: 2px solid color-mix(in srgb, var(--color-ink) 12%, transparent);
  font-family: var(--font-body, inherit);
  font-size: 15.5px;
  resize: vertical;
  transition: border-color .2s ease;
}
.field:focus {
  outline: none;
  border-color: var(--color-ink);
}

/* ===== Botão copiar ===== */
.copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 15px;
  border-radius: 999px;
  border: 2px solid color-mix(in srgb, var(--color-ink) 12%, transparent);
  background: #fff;
  font-weight: 600;
  font-size: 13.5px;
  color: var(--color-ink);
  transition: border-color .2s ease, background .2s ease, color .2s ease;
}
.copy-btn:hover { border-color: var(--color-ink); }
.copy-btn.done {
  border-color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 10%, #fff);
  color: var(--color-primary);
}

/* ===== Lista de oportunidades (cartões coloridos) ===== */
.op-list {
  display: grid;
  gap: 12px;
}
.op-card {
  position: relative;
  display: flex;
  overflow: hidden;
  border-radius: 18px;
  border: 2px solid color-mix(in srgb, var(--color-ink) 9%, transparent);
  background: #fff;
  transition: border-color .2s ease, box-shadow .25s ease, transform .2s ease;
}
.op-accent {
  flex: none;
  width: 6px;
  align-self: stretch;
  background: var(--accent, var(--color-primary));
}
.op-body {
  flex: 1;
  min-width: 0;
  padding: 16px 18px 15px;
}
.op-title {
  font-size: 17px;
  line-height: 1.2;
  color: var(--color-ink);
}
.op-desc {
  margin-top: 6px;
  font-size: 14px;
  line-height: 1.5;
  color: color-mix(in srgb, var(--color-ink) 65%, transparent);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.op-link {
  display: inline-block;
  margin-top: 10px;
  font-size: 13px;
  font-weight: 700;
  color: var(--accent, var(--color-primary));
}
.op-go {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--accent, var(--color-primary)) 14%, transparent);
  color: var(--accent, var(--color-primary));
  transition: transform .2s ease, background .2s ease;
}
.op-card:hover {
  border-color: var(--accent, var(--color-primary));
  box-shadow: 0 12px 30px color-mix(in srgb, var(--accent, var(--color-primary)) 22%, transparent);
  transform: translateY(-2px);
}
.op-card:hover .op-go {
  transform: translate(2px, -2px);
  background: var(--accent, var(--color-primary));
  color: #fff;
}
</style>