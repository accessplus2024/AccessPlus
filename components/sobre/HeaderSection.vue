<template>
  <header
    class="relative bg-gradient-to-r from-purple-600 to-pink-600 pb-16 rounded-b-lg bg-cover bg-center"
    style="background-image: url('/images/stanford.svg')">
    <div class="absolute inset-0 bg-[#53366470]" style="z-index: 0; pointer-events: none"></div>
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center relative z-10">
      <Navbar transparent="true" />
      <div class="text-center w-full max-w-4xl my-12 md:my-24 header-content">
        <h1 class="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold mb-4 leading-none" data-aos="fade-up">
          <slot>Sobre nós</slot>
        </h1>
      </div>
    </div>
  </header>
</template>

<script setup>
import Navbar from '../Navbar.vue'; 
</script>