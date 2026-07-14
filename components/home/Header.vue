<script setup>
import { ArrowRight } from "@iconoir/vue"
import { categoryIcon } from "~/utils/categories"

const stats = [
  { n: "+200", label: "oportunidades educacionais" },
  { n: "9", label: "categorias atualizadas" },
  { n: "100%", label: "gratuito, para sempre" },
]

// Decorative floating cluster — one tile per highlighted category.
const cluster = [
  { key: "olympiads",   label: "Olimpíadas",   color: "#4B3FE4", ink: "#fff",     x: "30%", y: "2%",  s: 1 },
  { key: "mun",         label: "MUNs",         color: "#FF2D8A", ink: "#fff",     x: "0%",  y: "34%", s: .85 },
  { key: "scholarship", label: "Bolsas",       color: "#C8F135", ink: "#15111F",  x: "52%", y: "40%", s: 1.1 },
  { key: "mentorship",  label: "Mentorias",    color: "#7DECE9", ink: "#15111F",  x: "16%", y: "70%", s: .8 },
]
</script>

<template>
  <section class="relative" style="padding-top: 132px; padding-bottom: 40px">
    <div class="wrap relative">
      <div class="hero-grid">
        <div>
          <span class="kicker">
            Plataforma gratuita Brasil
          </span>
          <h1 class="mt-[22px]" style="font-size: clamp(28px, 6vw, 72px); text-wrap: balance">
            Procurando<br />por
            <span class="relative inline-block text-primary">
              oportunidades?
              <svg viewBox="0 0 320 24" preserveAspectRatio="none"
                   class="absolute left-0 w-full" style="bottom: -6px; height: 16px">
                <path d="M3 16 C 80 6, 240 6, 317 14" stroke="var(--color-lime)"
                      stroke-width="8" fill="none" stroke-linecap="round" />
              </svg>
            </span>
          </h1>
          <p class="mt-[30px] text-ink/70 leading-relaxed" style="font-size: 19px; max-width: 500px">
            Access+ é a maior plataforma gratuita do país focada em trazer
            oportunidades educacionais atualizadas para jovens.
          </p>
          <div class="flex flex-wrap gap-3.5 mt-[34px]">
            <NuxtLink to="/oportunidades" class="btn btn-ink">
              Ver tudo <ArrowRight class="w-[18px] h-[18px]" />
            </NuxtLink>
            <NuxtLink to="/sobre" class="btn btn-out">Sobre nós</NuxtLink>
          </div>
          <div class="flex flex-wrap gap-12 mt-12">
            <div v-for="s in stats" :key="s.label">
              <div class="font-display" style="font-size: 42px; line-height: 1">{{ s.n }}</div>
              <div class="text-ink/60 mt-1" style="font-size: 14px">{{ s.label }}</div>
            </div>
          </div>
        </div>

        <!-- coluna direita: oportunidades flutuantes + AccessIA logo abaixo -->
        <div class="hero-right">
          <!-- decorative cluster -->
          <div class="hero-art relative" style="height: 500px">
            <div
              v-for="(b, i) in cluster"
              :key="b.key"
              class="floaty absolute"
              :style="{
                left: b.x, top: b.y, animationDelay: `${i * 0.8}s`,
                background: b.color, color: b.ink, borderRadius: '26px',
                padding: '20px 22px', width: `${170 * b.s}px`,
                boxShadow: `0 18px 40px ${b.color}44`,
              }"
            >
              <span class="inline-flex items-center justify-center rounded-full"
                    style="width: 42px; height: 42px; background: rgba(255,255,255,.85)">
                <img :src="categoryIcon(b.key)" alt="" style="width: 24px; height: 24px" />
              </span>
              <div class="font-body font-semibold mt-3" style="font-size: 15px; line-height: 1.15">{{ b.label }}</div>
            </div>
          </div>

          <!-- AccessIA: abaixo das oportunidades flutuantes, ao lado das estatísticas -->
          <div class="accessia-slot">
            <AccessIA />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero-grid {
  display: grid;
  grid-template-columns: 1.15fr .85fr;
  gap: 40px;
  /* topo-alinhado: ao abrir a AccessIA, o texto do hero NÃO se mexe;
     só os componentes abaixo do hero descem. */
  align-items: start;
}

/* coluna direita: cluster no topo, AccessIA logo abaixo */
.hero-right {
  display: flex;
  flex-direction: column;
}
.accessia-slot {
  position: relative;
  z-index: 20; /* garante que o painel flutuante fique acima do resto */
  margin-top: 4px;
}

@media (max-width: 980px) {
  .hero-grid { grid-template-columns: 1fr; }
  .hero-art { display: none; }
  /* no mobile o cluster some, mas a AccessIA continua visível abaixo do conteúdo */
  .accessia-slot { margin-top: 8px; }
}
</style>
