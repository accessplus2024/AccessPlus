<script setup>
const destaques = [
  {
    key: "ashoka",
    logo: "https://www.ashoka.org/themes/custom/blanco_ashoka_org/logo.svg",
    eyebrow: "Parte do",
    title: "Jovens Transformadores 2025",
    org: "da Ashoka",
  },
  {
    key: "top15",
    logo: "/images/BeChangemaker_logo.svg",
    eyebrow: "Parte do",
    title: "Top 15 Finalist",
    org: "do BeChangemaker — Representante do Brasil",
  },
]

const outrasOrganizacoes = [
  { key: "hp", name: "HP Foundation", logo: "/images/HP_Foundation.svg" },
  { key: "unesco", name: "UNESCO-UNEVOC", logo: "/images/UNESCO_UNEVOC.svg" },
  { key: "worldskills", name: "WorldSkills", logo: "/images/Worldskills_logo.png" },
]

const confiam = [
  { key: "cohere", name: "Cohere Labs", logo: "https://cdn.sanity.io/images/rjtqmwfu/web3-prod/5e656c29ed95afda78d068164a0bea94efed44ed-263x30.svg", invert: true },
  { key: "geg", name: "Instituto G&G", logo: "https://static.wixstatic.com/media/2dee5e_8222e6990afd4f2aadfa291bb9f5cc2a~mv2.png/v1/crop/x_50,y_445,w_1030,h_464/fill/w_366,h_156,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Logo_Instituto%20G%26G.png" },
]

const midia = [
  { key: "g1", name: "G1", logo: "https://upload.wikimedia.org/wikipedia/commons/3/34/Logotipo_g1.svg" },
  { key: "tvglobo", name: "TV Globo", logo: "https://upload.wikimedia.org/wikipedia/commons/c/c9/TV_Globo_2025.svg" },
  { key: "tvcultura", name: "TV Cultura", logo: "https://upload.wikimedia.org/wikipedia/commons/8/82/Cultura_logo_2013.svg" },
  { key: "festivaled", name: "Festival LED", logo: "https://www.cidademarketing.com.br/marketing/wp-content/uploads/2026/08/festival_led_educacao_globo.webp" },
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

      <div class="destaques-row mt-12" data-aos="fade-up">
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

      <p class="kicker mt-14" style="justify-content: center; display: flex">Outras organizações que também nos reconhecem</p>
      <div class="flex flex-wrap items-center justify-center gap-x-14 gap-y-8 mt-6">
        <template v-for="o in outrasOrganizacoes" :key="o.key">
          <img
            v-if="!quebradas.has(o.key)"
            :src="o.logo"
            :alt="o.name"
            class="h-14 md:h-16 w-auto opacity-80"
            @error="marcarQuebrada(o.key)"
          />
          <span v-else class="award-fallback">{{ o.name }}</span>
        </template>
      </div>

      <p class="kicker mt-14" style="justify-content: center; display: flex">Quem confia em nós</p>
      <div class="flex flex-wrap items-center justify-center gap-x-14 gap-y-8 mt-6">
        <template v-for="c in confiam" :key="c.key">
          <img
            v-if="!quebradas.has(c.key)"
            :src="c.logo"
            :alt="c.name"
            class="h-14 md:h-16 w-auto opacity-80"
            :class="{ 'invert-logo': c.invert }"
            @error="marcarQuebrada(c.key)"
          />
          <span v-else class="award-fallback">{{ c.name }}</span>
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

/* Logo original é branco (pensado pra fundo escuro) — inverte pra ficar
   escuro e visível no nosso fundo claro. */
.invert-logo {
  filter: invert(1);
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
