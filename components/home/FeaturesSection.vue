<script setup>
const features = [
  { big: "+170", label: "oportunidades educacionais", color: "var(--color-primary)", ink: "#fff" },
  { big: "Guias", label: "e informações atualizadas", color: "var(--color-lime)", ink: "#15111F" },
  { big: "Dicas", label: "de premiados das mais diversas áreas", color: "var(--color-magenta)", ink: "#fff" },
]
</script>

<template>
  <section class="section" style="padding-top: 0">
    <div class="wrap">
      <div class="mb-[42px]">
        <span class="kicker">O que tem aqui</span>
        <h2 class="mt-3.5 flex flex-wrap items-baseline gap-x-3" style="font-size: clamp(34px, 4.5vw, 56px); text-wrap: balance">
          O que você encontra no
          <img src="/images/icons/logo-longo.svg" alt="Access+" class="h-60 md:h-12 translate-y-1" />
        </h2>
      </div>
      <div class="feat-grid">
        <div
          v-for="f in features"
          :key="f.label"
          class="relative flex flex-col justify-between overflow-hidden"
          :style="{ background: f.color, color: f.ink, borderRadius: 'var(--r-card)', padding: '32px 30px', minHeight: '210px' }"
        >
          <div class="font-display" style="font-size: 52px; line-height: .95">{{ f.big }}</div>
          <p class="font-body" style="font-size: 18px; line-height: 1.35; max-width: 90%">{{ f.label }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.feat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}
@media (max-width: 900px) { .feat-grid { grid-template-columns: 1fr; } }
</style>
