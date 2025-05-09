<script setup>
import Navbar from "./Navbar.vue";
</script>

<template>
  <header
    class="relative bg-gradient-to-r from-purple-600 to-pink-600 pb-16 rounded-b-lg bg-cover bg-center"
    :style="{ backgroundImage: 'url(/images/voluntariado.svg)' }"
  >
    <div class="absolute inset-0 bg-[#C47FEF6B] z-0"></div>

    <div
      class="container mx-auto px-6 flex flex-col items-center relative z-10"
    >
      <Navbar transparent="true" />
      <div class="text-left w-full max-w-4xl mt-12">
        <h1
          class="text-3xl sm:text-4xl lg:text-5xl mb-4 leading-none md:text-left lg:text-left sm:text-center"
        >
          <p class="font-bold">Todas as</p>
          <span class="block font-semibold">Oportunidades</span>
        </h1>
      </div>
    </div>
  </header>
</template>
