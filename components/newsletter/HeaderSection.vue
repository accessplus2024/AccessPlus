<template>
  <header
    class="relative bg-gradient-to-r from-purple-600 to-pink-600 pt-32 pb-16 rounded-b-lg bg-cover bg-center"
    style="background-image: url('/images/Fundo.png')"
  >
    <div class="container mx-auto px-6 flex flex-col items-center">
      <div
        class="md:text-left text-center flex flex-col items-center md:items-start w-full max-w-4xl"
      >
        <h1
          class="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-none text-white"
          data-aos="fade-up"
        >
          Newsletter <br />
          <span class="block font-medium">Access+</span>
        </h1>
        <p class="text-base sm:text-lg mb-6 max-w-md text-white" data-aos="fade-up" data-aos-delay="200">
          Fique por dentro das últimas novidades, dicas e insights sobre 
          oportunidades educacionais para jovens.
        </p>
        
        <!-- Newsletter Stats -->
        <div class="flex flex-col sm:flex-row gap-6 mt-4" data-aos="fade-up" data-aos-delay="400">
          <div class="text-center sm:text-left">
            <div class="text-2xl font-bold text-white">{{ totalPosts }}+</div>
            <div class="text-white/80 text-sm">Artigos publicados</div>
          </div>
          <div class="text-center sm:text-left">
            <div class="text-2xl font-bold text-white">Semanal</div>
            <div class="text-white/80 text-sm">Frequência</div>
          </div>
          <div class="text-center sm:text-left">
            <div class="text-2xl font-bold text-white">Gratuito</div>
            <div class="text-white/80 text-sm">100% gratuito</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Decorative elements -->
    <div class="absolute top-10 right-10 opacity-20">
      <img src="/images/estrelinhas.png" alt="" class="w-16 h-16" />
    </div>
    <div class="absolute bottom-10 left-10 opacity-20">
      <img src="/images/estrelinhas.png" alt="" class="w-12 h-12" />
    </div>
  </header>
</template>

<script setup>
defineProps({
  totalPosts: {
    type: Number,
    default: 50
  }
})
</script>
