<script setup>
import { ArrowRight, Search } from "@iconoir/vue"

const { data: opportunities, fetchOpportunities } = useCachedOpportunities()

onMounted(async () => {
  await fetchOpportunities()
})

const stats = computed(() => {
  const oppCount = opportunities.value?.length || 0
  return [
    { n: `+${oppCount}`, label: "oportunidades educacionais" },
    { n: "9", label: "categorias atualizadas" },
    { n: "100%", label: "gratuito, para sempre" },
  ]
})

const searchExamples = computed(() => {
  if (!opportunities.value?.length) {
    return ["Harvard", "Yale", "Google"]
  }

  const shuffled = [...opportunities.value].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 3).map((opp) => opp.title || opp.Nome)
})

const partnerLogos = [
  { name: "BeChangemaker", logo: "/images/BeChangemaker_logo.svg" },
  { name: "WorldSkills", logo: "/images/Worldskills_logo.png" },
  { name: "Fundação HP", logo: "/images/HP_Foundation.svg" },
  { name: "UNESCO-UNEVOC", logo: "/images/UNESCO_UNEVOC.svg" },
]

const mediaMentions = ["TV Globo", "G1", "TV Cultura", "Festival LED"]

const heroImage = {
  url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80",
  label: "Estudantes brasileiros em intercâmbio internacional",
}
</script>

<template>
  <section class="relative hero-shell">
    <div class="wrap relative">
      <div class="hero-grid">
        <div class="hero-copy">
          <h1 class="hero-title">
            Procurando<br />por
            <span class="relative inline-block text-primary">
              oportunidades?
              <svg viewBox="0 0 320 24" preserveAspectRatio="none" class="title-mark">
                <path d="M3 16 C 80 6, 240 6, 317 14" stroke="var(--color-lime)" stroke-width="8" fill="none" stroke-linecap="round" />
              </svg>
            </span>
          </h1>

          <p class="hero-subtitle">
            A maior plataforma do Brasil para descobrir bolsas, intercâmbios, olimpíadas e programas de estudo em universidades e organizações internacionais.
          </p>

          <div class="search-stack">
            <div class="search-box">
              <input type="text" placeholder="Buscar oportunidades..." />
              <Search class="search-icon" />
            </div>

            <div class="tag-row">
              <span>Exemplos:</span>
              <button v-for="example in searchExamples" :key="example" type="button">
                {{ example }}
              </button>
            </div>
          </div>

          <div class="cta-row">
            <NuxtLink to="/oportunidades" class="btn btn-ink">
              Ver tudo <ArrowRight class="w-[18px] h-[18px]" />
            </NuxtLink>
            <NuxtLink to="/sobre" class="btn btn-out">Sobre nós</NuxtLink>
          </div>

          <div class="stats-row">
            <div v-for="s in stats" :key="s.label">
              <div class="stat-number">{{ s.n }}</div>
              <div class="stat-label">{{ s.label }}</div>
            </div>
          </div>

          <div class="brand-band">
            <div class="brand-band__inner">
              <div class="brand-row">
                <span v-for="(brand, i) in [...partnerLogos, ...partnerLogos]" :key="`${brand.name}-${i}`" class="brand-pill">
                  <img :src="brand.logo" :alt="brand.name" loading="lazy" />
                </span>
              </div>
            </div>
          </div>

          <div class="media-band">
            <div class="media-band__inner">
              <div class="media-row">
                <span v-for="item in [...mediaMentions, ...mediaMentions]" :key="item" class="media-pill">
                  {{ item }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="hero-visual">
          <div class="visual-card">
            <div class="visual-photo" :style="{ backgroundImage: `url('${heroImage.url}')` }" />
            <div class="visual-badge badge-one">+270 oportunidades</div>
            <div class="visual-badge badge-two">100% grátis</div>
            <span class="visual-caption">{{ heroImage.label }}</span>
          </div>

          <div class="accessia-slot">
            <AccessIA />
          </div>
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
  align-items: center;
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

.search-icon {
  position: absolute;
  right: 18px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  color: rgba(21, 17, 31, 0.45);
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

.brand-band,
.media-band {
  overflow: hidden;
  margin-top: 26px;
  width: min(100%, 620px);
}

.brand-band__inner,
.media-band__inner {
  position: relative;
  overflow: hidden;
  white-space: nowrap;
}

.brand-row,
.media-row {
  display: inline-flex;
  align-items: center;
  gap: 16px;
  min-width: max-content;
  padding-right: 20px;
  animation: marquee 26s linear infinite;
}

.brand-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 54px;
  padding: 0 26px;
  border-radius: 999px;
  background: #fff;
  border: 1px solid rgba(21, 17, 31, 0.08);
  box-shadow: 0 8px 24px rgba(21, 17, 31, 0.06);
}

.brand-pill img {
  height: 22px;
  width: auto;
  max-width: 120px;
  object-fit: contain;
}

.media-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 11px 18px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  box-shadow: 0 8px 24px rgba(21, 17, 31, 0.08);
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(21, 17, 31, 0.06);
  color: rgba(21, 17, 31, 0.8);
}

.hero-visual {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-width: 0;
}

.visual-card {
  position: relative;
  min-height: 540px;
  border-radius: 32px;
  background-color: rgba(75, 63, 228, 0.1);
  border: 1px solid rgba(21, 17, 31, 0.06);
  box-shadow: 0 24px 60px rgba(21, 17, 31, 0.08);
  overflow: hidden;
}

.visual-photo {
  position: absolute;
  inset: -12px;
  background-size: cover;
  background-position: center;
  animation: drift 18s ease-in-out infinite alternate;
}

.visual-card::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(21, 17, 31, 0.02) 45%, rgba(21, 17, 31, 0.5));
}

.visual-caption {
  position: absolute;
  left: 26px;
  right: 26px;
  bottom: 24px;
  z-index: 1;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #fff;
}

.visual-badge {
  position: absolute;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 10px 16px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(21, 17, 31, 0.08);
  color: var(--color-ink);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  box-shadow: 0 12px 28px rgba(21, 17, 31, 0.08);
}

.badge-one {
  top: 20px;
  left: 20px;
}

.badge-two {
  right: 20px;
  bottom: 20px;
}

.accessia-slot {
  position: relative;
  z-index: 20;
}

@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

@keyframes drift {
  0% { transform: translate3d(0, 0, 0) scale(1); }
  100% { transform: translate3d(10px, -8px, 0) scale(1.03); }
}

@media (max-width: 980px) {
  .hero-grid {
    grid-template-columns: 1fr;
    gap: 38px;
  }

  .hero-visual {
    order: -1;
  }

  .visual-card {
    min-height: 420px;
  }

  .brand-band,
  .media-band {
    width: 100%;
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

  .visual-caption {
    right: 120px;
  }
}
</style>
