<script setup>
const parceiros = [
  { key: "bechangemaker", name: "BeChangemaker", logo: "/images/BeChangemaker_logo.svg" },
  { key: "worldskills", name: "WorldSkills", logo: "/images/Worldskills_logo.png" },
  { key: "hp", name: "HP Foundation", logo: "/images/HP_Foundation.svg" },
  { key: "unesco", name: "UNESCO-UNEVOC", logo: "/images/UNESCO_UNEVOC.svg" },
  { key: "brasa", name: "BRASA", logo: "/images/brasa.png" },
  { key: "geg", name: "Instituto G&G", logo: "/images/instituto-geg.png" },
]

const midia = [
  { key: "g1", name: "G1", logo: "/images/g1.png" },
  { key: "tvglobo", name: "TV Globo", logo: "/images/tv-globo.png" },
  { key: "festivaled", name: "Festival LED", logo: "/images/festival-led.png" },
  { key: "tvcultura", name: "TV Cultura", logo: "/images/tv-cultura.png" },
]

const topFinalist = { key: "top15", name: "BeChangemaker — Top 15 Finalist", image: "/images/top15-finalist.jpg" }

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
    <div class="wrap text-center" style="max-width: 860px">
      <span class="kicker" style="justify-content: center; display: flex">Reconhecimento</span>
      <h2 class="mt-4" style="font-size: clamp(30px, 4vw, 50px); text-wrap: balance">
        Top 15 e Representante do Brasil
      </h2>
      <p class="text-ink/72 leading-relaxed mt-6 mx-auto" style="font-size: 18px; max-width: 68ch">
        Participar do BeChangemaker nos permitiu aprimorar nosso projeto com o
        suporte de especialistas globais, desenvolver estratégias de impacto e
        fortalecer nossa visão de criar uma plataforma que transforme vidas.
      </p>

      <div v-if="!quebradas.has(topFinalist.key)" class="mt-10">
        <img
          :src="topFinalist.image"
          :alt="topFinalist.name"
          class="mx-auto rounded-2xl"
          style="max-height: 220px; width: auto"
          @error="marcarQuebrada(topFinalist.key)"
        />
      </div>
      <div v-else class="mt-10 award-fallback">{{ topFinalist.name }}</div>

      <div class="flex flex-wrap items-center justify-center gap-x-14 gap-y-8 mt-12">
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
</style>
