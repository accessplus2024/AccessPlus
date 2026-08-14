<script setup>
const destaques = [
  {
    key: "ashoka",
    logo: "/images/ashoka.png",
    eyebrow: "Parte do",
    title: "Jovens Transformadores 2025",
    org: "da Ashoka",
  },
  {
    key: "top15",
    logo: "/images/top15-finalist.jpg",
    eyebrow: "Parte do",
    title: "Top 15 Finalist",
    org: "do BeChangemaker — Representante do Brasil",
  },
]

const parceiros = [
  { key: "bechangemaker", name: "BeChangemaker", logo: "/images/BeChangemaker_logo.svg" },
  { key: "worldskills", name: "WorldSkills", logo: "/images/Worldskills_logo.png" },
  { key: "hp", name: "HP Foundation", logo: "/images/HP_Foundation.svg" },
  { key: "unesco", name: "UNESCO-UNEVOC", logo: "/images/UNESCO_UNEVOC.svg" },
  { key: "brasa", name: "BRASA", logo: "/images/brasa.png" },
  { key: "geg", name: "Instituto G&G", logo: "/images/instituto-geg.png" },
]

const midia = [
  { key: "g1", name: "G1", logo: "https://upload.wikimedia.org/wikipedia/commons/3/34/Logotipo_g1.svg" },
  { key: "tvglobo", name: "TV Globo", logo: "https://upload.wikimedia.org/wikipedia/commons/c/c9/TV_Globo_2025.svg" },
  { key: "festivaled", name: "Festival LED", logo: "/images/festival-led.png" },
  { key: "tvcultura", name: "TV Cultura", logo: "https://upload.wikimedia.org/wikipedia/commons/8/82/Cultura_logo_2013.svg" },
]

// Enquanto as imagens não existirem em public/images, mostra o nome em
// texto no lugar (some sozinho assim que o arquivo com o nome certo for
// adicionado).
const quebradas = ref(new Set())
function marcarQuebrada(key) {
  quebradas.value = new Set(quebradas.value).add(key)
}
</script>

<template>
  <section class="section" style="padding-top: 0">
    <div class="wrap text-center" style="max-width: 900px">
      <span class="kicker" style="justify-content: center; display: flex">Reconhecimento</span>
      <h2 class="mt-4" style="font-size: clamp(30px, 4vw, 50px); text-wrap: balance">
        Prêmios e reconhecimento
      </h2>

      <div class="destaques-row mt-12">
        <div v-for="d in destaques" :key="d.key" class="destaque-card">
          <img
            v-if="!quebradas.has(d.key)"
            :src="d.logo"
            :alt="d.title"
            class="destaque-logo"
            @error="marcarQuebrada(d.key)"
          />
          <span v-else class="award-fallback">{{ d.title }}</span>
          <div class="destaque-text">
            <span class="destaque-eyebrow">{{ d.eyebrow }}</span>
            <strong class="destaque-title">{{ d.title }}</strong>
            <span class="destaque-org">{{ d.org }}</span>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-center gap-x-14 gap-y-8 mt-14">
        <template v-for="p in parceiros" :key="p.key">
          <img
            v-if="!quebradas.has(p.key)"
            :src="p.logo"
            :alt="p.name"
            class="h-14 md:h-16 w-auto opacity-80"
            @error="marcarQuebrada(p.key)"
          />
          <span v-else class="award-fallback">{{ p.name }}</span>
        </template>
      </div>

      <p class="kicker mt-14" style="justify-content: center; display: flex">Como visto em</p>
      <div class="flex flex-wrap items-center justify-center gap-x-14 gap-y-6 mt-6">
        <template v-for="m in midia" :key="m.key">
          <img
            v-if="!quebradas.has(m.key)"
            :src="m.logo"
            :alt="m.name"
            class="h-10 md:h-11 w-auto opacity-70"
            @error="marcarQuebrada(m.key)"
          />
          <span v-else class="award-fallback">{{ m.name }}</span>
        </template>
      </div>
    </div>
  </section>
</template>

<style scoped>
.award-fallback {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 999px;
  border: 1.5px dashed color-mix(in srgb, var(--color-ink) 25%, transparent);
  color: color-mix(in srgb, var(--color-ink) 55%, transparent);
  font-weight: 600;
  font-size: 13.5px;
}

.destaques-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
}

.destaque-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 26px;
  border-radius: var(--r-card);
  background: #fff;
  border: 1px solid rgba(21, 17, 31, 0.08);
  box-shadow: 0 8px 24px rgba(21, 17, 31, 0.06);
  text-align: left;
}

.destaque-logo {
  height: 48px;
  width: 48px;
  object-fit: contain;
  flex: none;
}

.destaque-text {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}

.destaque-eyebrow {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--color-ink) 50%, transparent);
}

.destaque-title {
  font-size: 19px;
  font-weight: 800;
  color: var(--color-ink);
}

.destaque-org {
  font-size: 13px;
  color: color-mix(in srgb, var(--color-ink) 60%, transparent);
}
</style>
