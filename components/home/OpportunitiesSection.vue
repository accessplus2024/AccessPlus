<script setup>
import CategoryButton from "./CategoryButton.vue";
</script>

<template>
  <section
    class="bg-white pb-12 md:pt-4 bg-cover bg-no-repeat bg-center overflow-hidden"
    style="background-image: url('/images/Estrelas 1.png')"
  >
    <div
      class="container mx-auto px-4 md:px-6 max-w-4xl text-center overflow-x-hidden"
    >
      <h3 class="text-lg text-gray-700 mb-3 md:mb-4 poppins-font">
        OPORTUNIDADES
      </h3>
      <h2 class="text-2xl md:text-3xl font-bold text-[#1D1128] mb-6 md:mb-8">
        Confira nossas categorias
      </h2>

      <!-- Grid responsivo: 1 coluna no celular, 2 colunas em telas maiores -->
      <div class="grid gap-3 md:gap-4 mb-8 md:mb-9 grid-cols-1 sm:grid-cols-2">
        <!-- Categories Buttons -->
        <CategoryButton category="Mentorias" icon="mentorship" />
        <CategoryButton category="Bolsas de Estudo" icon="scholarship" />
        <CategoryButton category="Olimpíadas Científicas" icon="olympiads" />
        <CategoryButton category="MUNs" icon="mun" />
        <CategoryButton
          category="Programas Acadêmicos"
          icon="academic_programs"
        />
        <CategoryButton category="Competições" icon="competitions" />
        <CategoryButton category="Intercâmbios" icon="exchanges" />
        <CategoryButton category="Competições de Escrita" icon="writing_comp" />
      </div>

      <a
        href="/oportunidades"
        class="inline-block bg-yellow-400 text-black px-5 py-2.5 md:px-6 md:py-3 rounded-lg font-semibold hover:bg-yellow-300"
        >Ver tudo</a
      >
    </div>
  </section>
</template>
