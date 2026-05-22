<script setup>
import CategoryButton from "./CategoryButton.vue"
</script>

<template>
  <section
    class="bg-bg pb-12 md:pt-4 bg-cover bg-no-repeat bg-center overflow-hidden"
    style="background-image: url('/images/Estrelas 1.png')"
  >
    <div class="container mx-auto px-4 md:px-6 max-w-4xl text-center overflow-x-hidden">
      <h3 class="font-body text-lg text-text/60 mb-3 md:mb-4 uppercase tracking-widest">
        OPORTUNIDADES
      </h3>
      <h2 class="font-display text-2xl md:text-3xl font-bold text-text mb-6 md:mb-8">
        Confira nossas categorias
      </h2>
      <div class="grid gap-3 md:gap-4 mb-8 md:mb-9 grid-cols-1 sm:grid-cols-2">
        <CategoryButton category="Mentorias" icon="mentorship" />
        <CategoryButton category="Bolsas de Estudo" icon="scholarship" />
        <CategoryButton category="Olimpíadas Científicas" icon="olympiads" />
        <CategoryButton category="MUNs" icon="mun" />
        <CategoryButton category="Programas Acadêmicos" icon="academic_programs" />
        <CategoryButton category="Competições" icon="competitions" />
        <CategoryButton category="Intercâmbios" icon="exchanges" />
        <CategoryButton category="Competições de Escrita" icon="writing_comp" />
      </div>
      <a
        href="/oportunidades"
        class="inline-block bg-accent-green text-[#0D0B1A] px-5 py-2.5 md:px-6 md:py-3 rounded-lg font-body font-semibold hover:opacity-90 transition-opacity"
      >Ver tudo</a>
    </div>
  </section>
</template>
