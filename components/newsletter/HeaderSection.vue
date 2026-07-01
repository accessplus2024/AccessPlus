<script setup>
const scrollToSection = (sectionId) => {
  document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" })
}
</script>

<template>
  <header class="relative overflow-hidden" style="padding-top: 132px">
    <div class="wrap">
      <div style="max-width: 760px">
        <span class="kicker">
          Newsletter Semanal
        </span>
        <h1 class="mt-4" style="font-size: clamp(40px, 6vw, 84px); text-wrap: balance">
          Novidades <span class="font-body font-light italic">do mês</span>
        </h1>
        <p class="text-ink/72 leading-relaxed mt-6" style="font-size: 19px">
          As melhores oportunidades e dicas para turbinar sua jornada educacional,
          direto no seu e-mail toda quarta-feira. Conteúdo exclusivo, 100% gratuito.
        </p>
        <div class="flex flex-wrap gap-3.5 mt-8">
          <button class="btn btn-ink" @click="scrollToSection('newsletter-posts')">Ver posts</button>
          <button class="btn btn-out" @click="scrollToSection('newsletter-subscription')">Inscrever-se</button>
        </div>
      </div>
    </div>
  </header>
</template>
