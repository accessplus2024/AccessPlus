<script setup>
import { ArrowRight, Search } from "@iconoir/vue"

const router = useRouter()
const { data: opportunities, fetchOpportunities } = useCachedOpportunities()

const searchQuery = ref("")

function buscar(termo) {
  const q = (termo ?? searchQuery.value).trim()
  if (!q) return
  router.push(`/oportunidades?q=${encodeURIComponent(q)}`)
}

// Efeito de "digitando e apagando" no placeholder, alternando entre
// níveis de ensino e nomes reais de oportunidades — só roda enquanto
// o campo estiver vazio (pausa assim que o estudante começa a digitar).
const nomesPlaceholder = ["Ensino Fundamental", "Ensino Médio", "Bolsa de estudo", "Intercâmbio"]
const placeholderText = ref("Buscar oportunidades...")
let animacaoTimer = null

const poolPlaceholder = computed(() => {
  const titulos = opportunities.value?.length
    ? [...opportunities.value].sort(() => Math.random() - 0.5).slice(0, 4).map((o) => o.title || o.Nome).filter(Boolean)
    : []
  return [...nomesPlaceholder, ...titulos]
})

function animarPlaceholder() {
  let fraseIndex = 0
  let charIndex = 0
  let apagando = false

  const passo = () => {
    if (searchQuery.value) {
      animacaoTimer = setTimeout(passo, 400)
      return
    }
    const pool = poolPlaceholder.value
    if (!pool.length) {
      animacaoTimer = setTimeout(passo, 600)
      return
    }
    const frase = pool[fraseIndex % pool.length]

    if (!apagando) {
      charIndex++
      placeholderText.value = frase.slice(0, charIndex)
      if (charIndex === frase.length) {
        apagando = true
        animacaoTimer = setTimeout(passo, 1400)
        return
      }
    } else {
      charIndex--
      placeholderText.value = frase.slice(0, charIndex) || " "
      if (charIndex === 0) {
        apagando = false
        fraseIndex++
      }
    }
    animacaoTimer = setTimeout(passo, apagando ? 35 : 70)
  }
  animacaoTimer = setTimeout(passo, 600)
}

onMounted(async () => {
  await fetchOpportunities()
  animarPlaceholder()
})

onBeforeUnmount(() => { if (animacaoTimer) clearTimeout(animacaoTimer) })

const stats = [
  { n: "+290", label: "oportunidades educacionais" },
  { n: "100%", label: "gratuito, para sempre" },
]

const searchExamples = computed(() => {
  if (!opportunities.value?.length) {
    return ["Harvard", "Yale", "Google"]
  }

  const shuffled = [...opportunities.value].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 3).map((opp) => opp.title || opp.Nome)
})

// Números abstratos não convencem ninguém de que ELA pode conseguir.
// Uma história real, concreta, convence. Por isso o espaço nobre da hero
// mostra uma pessoa de verdade em vez de estatística — as outras histórias
// completam a ideia mais abaixo, em HomeDidYouKnowSection.
const spotlight = {
  photo: "/images/founder-ester.jpg",
  name: "Ester",
  before: "é possível estudar em ",
  highlight: "escolas públicas",
  after: " e entrar nas melhores universidades do mundo, com tudo pago?",
  detail: "Ester, de escola pública em Inhaúma, hoje na Northwestern com bolsa de quase R$3 milhões.",
}
const spotlightQuebrada = ref(false)
</script>

<template>
  <section class="relative hero-shell">
    <div class="wrap relative">
      <div class="hero-grid">
        <div class="hero-copy">
          <h1 class="hero-title" data-aos="fade-up" data-aos-delay="0">
            Procurando<br />por
            <span class="relative inline-block text-primary">
              oportunidades?
              <svg viewBox="0 0 320 24" preserveAspectRatio="none" class="title-mark">
                <path d="M3 16 C 80 6, 240 6, 317 14" stroke="var(--color-lime)" stroke-width="8" fill="none" stroke-linecap="round" />
              </svg>
            </span>
          </h1>

          <p class="hero-subtitle" data-aos="fade-up" data-aos-delay="80">
            A maior plataforma do Brasil para descobrir bolsas, intercâmbios, olimpíadas e programas de estudo em universidades e organizações internacionais.
          </p>

          <div class="search-stack" data-aos="fade-up" data-aos-delay="160">
            <div class="search-box">
              <input
                type="text"
                v-model="searchQuery"
                :placeholder="placeholderText"
                @keyup.enter="buscar()"
              />
              <button type="button" class="search-icon-btn" aria-label="Buscar oportunidades" @click="buscar()">
                <Search class="search-icon" />
              </button>
            </div>

            <div class="tag-row">
              <span>Exemplos:</span>
              <button v-for="example in searchExamples" :key="example" type="button" @click="buscar(example)">
                {{ example }}
              </button>
            </div>
          </div>

          <div class="cta-row" data-aos="fade-up" data-aos-delay="220">
            <NuxtLink to="/oportunidades" class="btn btn-ink">
              Encontrar minha oportunidade <ArrowRight class="w-[18px] h-[18px]" />
            </NuxtLink>
          </div>

          <div class="stats-row" data-aos="fade-up" data-aos-delay="280">
            <div v-for="s in stats" :key="s.label">
              <div class="stat-number">{{ s.n }}</div>
              <div class="stat-label">{{ s.label }}</div>
            </div>
          </div>
        </div>

        <div class="hero-visual" data-aos="fade-up" data-aos-delay="200">
          <div class="spotlight-card">
            <div class="spotlight-frame">
              <img
                v-if="!spotlightQuebrada"
                :src="spotlight.photo"
                :alt="spotlight.name"
                class="spotlight-photo"
                @error="spotlightQuebrada = true"
              />
              <div v-else class="spotlight-photo spotlight-photo--fallback">
                {{ spotlight.name.charAt(0) }}
              </div>
            </div>
            <div class="spotlight-caption">
              <span class="spotlight-tag">Você sabia que...</span>
              <p class="spotlight-text">
                {{ spotlight.before }}<span class="text-primary">{{ spotlight.highlight }}</span>{{ spotlight.after }}
              </p>
              <p class="spotlight-detail">{{ spotlight.detail }}</p>
            </div>
          </div>
          <a href="#historias" class="spotlight-more">
            Ver mais histórias reais <ArrowRight class="w-[15px] h-[15px]" />
          </a>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero-shell {
  padding-top: 100px;
  padding-bottom: 50px;
  overflow: hidden;
}

.hero-grid {
  display: grid;
  grid-template-columns: 1.08fr 0.92fr;
  gap: 56px;
  align-items: start;
}

.hero-copy {
  position: relative;
  z-index: 1;
  min-width: 0;
}

.hero-title {
  margin: 0;
  font-size: clamp(34px, 7vw, 76px);
  line-height: 0.96;
  letter-spacing: -0.06em;
  text-wrap: balance;
}

.title-mark {
  position: absolute;
  left: 0;
  width: 100%;
  bottom: -12px;
  height: 18px;
}

.hero-subtitle {
  margin-top: 28px;
  max-width: 560px;
  color: rgba(21, 17, 31, 0.7);
  font-size: 18px;
  line-height: 1.7;
}

.search-stack {
  margin-top: 26px;
  max-width: 640px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.search-box {
  position: relative;
  width: 100%;
}

.search-box input {
  width: 100%;
  border: 1.5px solid rgba(21, 17, 31, 0.12);
  background: rgba(255, 255, 255, 0.9);
  border-radius: 18px;
  padding: 18px 54px 18px 20px;
  font-size: 17px;
  color: var(--color-ink);
  outline: none;
  transition: 0.2s ease;
}

.search-box input:focus {
  border-color: rgba(75, 63, 228, 0.4);
  box-shadow: 0 0 0 4px rgba(75, 63, 228, 0.08);
}

.search-icon-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 999px;
  border: 0;
  background: transparent;
  color: rgba(21, 17, 31, 0.45);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}
.search-icon-btn:hover {
  background: rgba(75, 63, 228, 0.1);
  color: var(--color-primary);
}

.search-icon {
  width: 20px;
  height: 20px;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  color: rgba(21, 17, 31, 0.56);
  font-size: 14px;
}

.tag-row button {
  border: 0;
  border-radius: 999px;
  background: rgba(200, 241, 53, 0.18);
  color: var(--color-ink);
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.tag-row button:hover {
  transform: translateY(-1px);
}

.cta-row {
  margin-top: 28px;
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}

.stats-row {
  margin-top: 30px;
  display: flex;
  flex-wrap: wrap;
  gap: 32px;
}

.stat-number {
  font-size: clamp(28px, 4vw, 42px);
  line-height: 1;
  font-weight: 700;
  letter-spacing: -0.06em;
}

.stat-label {
  margin-top: 8px;
  color: rgba(21, 17, 31, 0.6);
  font-size: 13px;
}

.hero-visual {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.spotlight-card {
  border-radius: var(--r-lg);
  background: var(--color-card);
  box-shadow: 0 20px 44px rgba(21, 17, 31, 0.1);
  overflow: hidden;
}

.spotlight-frame {
  aspect-ratio: 3 / 2;
  max-height: 320px;
  background: var(--color-paper-2);
}

.spotlight-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.spotlight-photo--fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 64px;
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
}

.spotlight-caption {
  padding: 30px 32px 34px;
}

.spotlight-tag {
  display: block;
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--color-ink) 45%, transparent);
  margin-bottom: 12px;
}

.spotlight-text {
  font-family: var(--font-display);
  font-size: clamp(20px, 2vw, 25px);
  line-height: 1.28;
  letter-spacing: -0.01em;
  text-wrap: balance;
}

.spotlight-detail {
  margin-top: 14px;
  font-size: 14.5px;
  color: color-mix(in srgb, var(--color-ink) 60%, transparent);
}

.spotlight-more {
  align-self: center;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-ink);
  opacity: 0.65;
  text-decoration: none;
  transition: opacity 0.2s ease;
}
.spotlight-more:hover {
  opacity: 1;
}

@media (max-width: 980px) {
  .hero-grid {
    grid-template-columns: 1fr;
    gap: 38px;
  }

  .spotlight-frame {
    max-height: 260px;
  }
}

@media (max-width: 640px) {
  .hero-shell {
    padding-top: 72px;
  }

  .title-mark {
    display: none;
  }

  .hero-subtitle {
    font-size: 17px;
  }

  .stats-row {
    gap: 18px 28px;
  }
}
</style>
