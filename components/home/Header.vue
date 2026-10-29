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
const nomesPlaceholder = ["Bolsa de estudo", "Intercâmbio", "Olimpíada", "Ensino Médio"]
const placeholderText = ref("Bolsa de estudo, intercâmbio, olimpíada…")
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

const searchExamples = computed(() => {
  if (!opportunities.value?.length) {
    return ["Harvard", "Yale", "Google"]
  }

  const shuffled = [...opportunities.value].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 3).map((opp) => opp.title || opp.Nome)
})

// Prova social logo abaixo da busca: rostos reais da equipe fundadora
// (as mesmas pessoas de HomeDidYouKnowSection) + o número acumulado.
const avatares = [
  { key: "paula", photo: "/images/founder-paula.jpg" },
  { key: "iza", photo: "/images/founder-iza.jpg" },
  { key: "camilly", photo: "/images/founder-camilly.jpg" },
  { key: "ester", photo: "/images/founder-ester.jpg" },
]

// Números abstratos não convencem ninguém de que ELA pode conseguir.
// Uma história real, concreta, convence. Por isso o espaço nobre da hero
// mostra uma pessoa de verdade em vez de estatística — as outras histórias
// completam a ideia mais abaixo, em HomeDidYouKnowSection.
const spotlight = {
  photo: "/images/founder-ester.jpg",
  alt: "Ester, bolsista da Northwestern University",
  name: "Ester",
  origem: "da periferia carioca à Northwestern",
}
const spotlightQuebrada = ref(false)
</script>

<template>
  <section id="inicio" class="hero-shell">
    <div class="wrap hero-grid">
      <div class="hero-copy">
        <span class="hero-badge" data-aos="fade-up">
          <span class="hero-badge-dot" aria-hidden="true">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C13 7 17 11 24 12C17 13 13 17 12 24C11 17 7 13 0 12C7 11 11 7 12 0Z" /></svg>
          </span>
          100% gratuito · feito por estudantes de escola pública
        </span>

        <h1 class="hero-title" data-aos="fade-up" data-aos-delay="40">
          Procurando por
          <span class="relative inline-block text-primary">
            oportunidades?
            <svg viewBox="0 0 320 24" preserveAspectRatio="none" class="title-mark" aria-hidden="true">
              <path d="M3 16 C 80 6, 240 6, 317 14" stroke="var(--color-lime)" stroke-width="8" fill="none" stroke-linecap="round" />
            </svg>
          </span>
        </h1>

        <p class="hero-subtitle" data-aos="fade-up" data-aos-delay="80">
          A maior plataforma do Brasil para descobrir bolsas, intercâmbios, olimpíadas e programas de estudo em universidades e organizações internacionais.
        </p>

        <div class="search-stack" data-aos="fade-up" data-aos-delay="140">
          <form role="search" class="search-pill" @submit.prevent="buscar()">
            <Search class="search-ico" aria-hidden="true" />
            <label for="busca" class="sr-only">Buscar oportunidades</label>
            <input
              id="busca"
              v-model="searchQuery"
              type="search"
              :placeholder="placeholderText"
              autocomplete="off"
            />
            <button type="submit" class="search-btn">
              Buscar <ArrowRight class="w-[17px] h-[17px]" />
            </button>
          </form>

          <div class="tag-row">
            <span>Experimente:</span>
            <button
              v-for="example in searchExamples"
              :key="example"
              type="button"
              :title="example"
              @click="buscar(example)"
            >
              {{ example }}
            </button>
          </div>
        </div>

        <div class="social-proof" data-aos="fade-up" data-aos-delay="200">
          <div class="avatars" aria-hidden="true">
            <img v-for="a in avatares" :key="a.key" :src="a.photo" alt="" class="avatar" />
          </div>
          <p>
            <strong>R$12 milhões</strong> em bolsas conquistadas pela nossa equipe e comunidade.
          </p>
        </div>
      </div>

      <div class="hero-visual" data-aos="fade-up" data-aos-delay="180">
        <figure class="spotlight">
          <img
            v-if="!spotlightQuebrada"
            :src="spotlight.photo"
            :alt="spotlight.alt"
            class="spotlight-photo"
            @error="spotlightQuebrada = true"
          />
          <div v-else class="spotlight-photo spotlight-photo--fallback">
            {{ spotlight.name.charAt(0) }}
          </div>

          <div class="spotlight-sticker" aria-hidden="true">
            <span class="sticker-small">bolsa de quase</span>
            <span class="sticker-big">R$3 mi</span>
          </div>

          <figcaption class="spotlight-caption">
            <span class="spotlight-tag">Você sabia que…</span>
            <p class="spotlight-text">
              dá pra estudar numa <span class="text-primary">das melhores universidades do mundo</span> com tudo pago?
            </p>
            <div class="spotlight-foot">
              <span><strong>{{ spotlight.name }}</strong> · {{ spotlight.origem }}</span>
              <a href="#historias" class="spotlight-more">
                Mais histórias <ArrowRight class="w-[15px] h-[15px]" />
              </a>
            </div>
          </figcaption>
        </figure>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* A navbar é fixa (76px de altura), então o respiro do topo soma a altura
   dela + o espaço do layout. overflow-x: clip (e não hidden) para o selo e o
   card flutuante da foto poderem "vazar" um pouco sem criar barra de rolagem. */
.hero-shell {
  padding-top: calc(76px + clamp(32px, 5vw, 72px));
  padding-bottom: clamp(56px, 7vw, 96px);
  overflow-x: clip;
}

.hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 400px);
  gap: clamp(40px, 5vw, 72px);
  align-items: center;
}

.hero-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

/* ---- Selo "100% gratuito" ---- */
.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 7px 16px 7px 8px;
  border-radius: var(--r-pill);
  background: var(--color-card);
  border: 1px solid rgba(21, 17, 31, 0.1);
  font-size: 13.5px;
  font-weight: 600;
  line-height: 1.3;
}
.hero-badge-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 22px;
  height: 22px;
  border-radius: var(--r-pill);
  background: var(--color-lime);
  color: var(--color-ink);
}

/* ---- Título ----
   "oportunidades?" é uma palavra só e ocupa ~8,4x o tamanho da fonte. O
   tamanho em vw foi escolhido pra ela SEMPRE caber inteira na coluna — se
   não couber, o hyphens:auto global (main.css) quebra a palavra com hífen
   ("oportuni-dades"). hyphens: manual desliga essa quebra automática aqui. */
.hero-title {
  margin-top: 28px;
  font-size: clamp(44px, 4.6vw, 80px);
  line-height: 0.95;
  letter-spacing: -0.045em;
  text-wrap: balance;
  hyphens: manual;
}

.title-mark {
  position: absolute;
  left: 0;
  width: 100%;
  bottom: -14px;
  height: 18px;
}

.hero-subtitle {
  margin-top: 36px;
  max-width: 540px;
  color: rgba(21, 17, 31, 0.72);
  font-size: 18px;
  line-height: 1.65;
  text-wrap: pretty;
}

/* ---- Busca em formato pílula, com botão "Buscar" dentro ---- */
.search-stack {
  margin-top: 32px;
  width: 100%;
  max-width: 600px;
}

.search-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--color-card);
  border: 1.5px solid rgba(21, 17, 31, 0.12);
  border-radius: var(--r-pill);
  padding: 7px 7px 7px 22px;
  box-shadow: 0 14px 36px rgba(21, 17, 31, 0.07);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
/* :focus-within = o anel de foco aparece na pílula inteira quando o input
   (que fica dentro dela) recebe foco. */
.search-pill:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(75, 63, 228, 0.14), 0 14px 36px rgba(21, 17, 31, 0.07);
}

.search-ico {
  flex: none;
  width: 20px;
  height: 20px;
  color: rgba(21, 17, 31, 0.5);
}

.search-pill input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  font-family: inherit;
  font-size: 16.5px;
  color: var(--color-ink);
  padding: 10px 0;
  outline: none;
}
.search-pill input::placeholder {
  color: rgba(21, 17, 31, 0.5);
}

.search-btn {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 50px;
  padding: 0 24px;
  border: 0;
  border-radius: var(--r-pill);
  background: var(--color-ink);
  color: var(--color-paper);
  font-family: inherit;
  font-size: 15.5px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.25s var(--ease), box-shadow 0.25s var(--ease);
}
.search-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(21, 17, 31, 0.28);
}

.tag-row {
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: rgba(21, 17, 31, 0.66);
}
.tag-row > span {
  margin-right: 4px;
}

/* Os exemplos podem vir do catálogo (títulos longos) — corta com "…"
   pra não quebrar a linha; o título completo fica no tooltip (title). */
.tag-row button {
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border: 0;
  border-radius: var(--r-pill);
  background: rgba(200, 241, 53, 0.45);
  color: var(--color-ink);
  padding: 8px 14px;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease;
}
.tag-row button:hover {
  transform: translateY(-1px);
  background: var(--color-lime);
}

/* ---- Prova social: rostos + número ---- */
.social-proof {
  margin-top: 40px;
  display: flex;
  align-items: center;
  gap: 16px;
}
.avatars {
  display: flex;
  flex: none;
}
.avatar {
  width: 44px;
  height: 44px;
  border-radius: var(--r-pill);
  object-fit: cover;
  border: 3px solid var(--color-paper);
}
.avatar + .avatar {
  margin-left: -12px;
}
.social-proof p {
  margin: 0;
  max-width: 34ch;
  font-size: 14.5px;
  line-height: 1.45;
  color: rgba(21, 17, 31, 0.72);
}
.social-proof strong {
  color: var(--color-ink);
}

/* ---- Foto destaque (Ester) ---- */
.hero-visual {
  min-width: 0;
  width: 100%;
  margin-top: 56px;
  padding-bottom: 36px; /* espaço pro card da legenda que "vaza" embaixo */
}

.spotlight {
  position: relative;
  margin: 0;
}

/* Altura com clamp() (não aspect-ratio): mantém o mesmo tamanho em todos os
   navegadores — no Safari do iPhone aspect-ratio dentro de grid já deu
   diferença de altura antes. */
.spotlight-photo {
  display: block;
  width: 100%;
  height: clamp(420px, 44vw, 580px);
  object-fit: cover;
  object-position: 46% 40%;
  border-radius: 34px 34px 34px 120px;
  box-shadow: 0 30px 60px rgba(21, 17, 31, 0.16);
}

.spotlight-photo--fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 96px;
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 12%, var(--color-paper-2));
}

.spotlight-sticker {
  position: absolute;
  top: 22px;
  right: -14px;
  width: 108px;
  height: 108px;
  border-radius: var(--r-pill);
  background: var(--color-lime);
  color: var(--color-ink);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  transform: rotate(10deg);
  box-shadow: 0 10px 24px rgba(21, 17, 31, 0.18);
}
.sticker-small {
  font-size: 11px;
  font-weight: 600;
  line-height: 1.1;
}
.sticker-big {
  margin-top: 3px;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 26px;
  line-height: 1;
  letter-spacing: -0.03em;
  white-space: nowrap;
}

.spotlight-caption {
  position: absolute;
  left: 28px;
  right: -20px;
  bottom: -36px;
  background: var(--color-card);
  border-radius: var(--r-card);
  padding: 20px 22px 18px;
  box-shadow: 0 18px 40px rgba(21, 17, 31, 0.14);
}

.spotlight-tag {
  display: block;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(21, 17, 31, 0.62);
}

.spotlight-text {
  margin-top: 8px;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 19px;
  line-height: 1.25;
  letter-spacing: -0.01em;
  text-wrap: balance;
}

.spotlight-foot {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid rgba(21, 17, 31, 0.08);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 6px 16px;
  font-size: 13.5px;
  line-height: 1.4;
  color: rgba(21, 17, 31, 0.7);
}
.spotlight-foot strong {
  color: var(--color-ink);
}

.spotlight-more {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 32px;
  font-weight: 600;
  color: var(--color-ink);
  text-decoration: none;
  transition: color 0.2s ease;
}
.spotlight-more:hover {
  color: var(--color-primary);
}

/* ---- Responsivo ---- */
@media (max-width: 980px) {
  .hero-grid {
    grid-template-columns: 1fr;
    gap: 40px;
  }
  /* Na versão responsiva (uma coluna só) a foto da Ester sai: empilhada
     embaixo da busca ela empurrava todo o resto da página pra baixo. */
  .hero-visual {
    display: none;
  }
  .hero-title {
    font-size: clamp(34px, 9vw, 72px);
  }
}

@media (max-width: 640px) {
  .hero-subtitle {
    font-size: 17px;
    margin-top: 30px;
  }
  .search-pill {
    padding-left: 16px;
  }
  .search-btn {
    padding: 0 18px;
  }
}

@media (max-width: 380px) {
  .search-ico {
    display: none;
  }
}
</style>
