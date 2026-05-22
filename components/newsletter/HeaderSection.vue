<template>
  <header
    class="relative bg-accent-pink pt-32 pb-16 rounded-b-lg overflow-hidden"
  >
    <!-- Animated Background Elements -->
    <div class="absolute inset-0">
      <!-- Floating particles -->
      <div
        class="absolute top-20 left-10 w-4 h-4 bg-white/20 rounded-full animate-bounce"
        style="animation-delay: 0s"
      ></div>
      <div
        class="absolute top-40 right-20 w-3 h-3 bg-white/30 rounded-full animate-bounce"
        style="animation-delay: 1s"
      ></div>
      <div
        class="absolute bottom-32 left-1/4 w-2 h-2 bg-white/25 rounded-full animate-bounce"
        style="animation-delay: 0.5s"
      ></div>
      <div
        class="absolute bottom-20 right-1/3 w-5 h-5 bg-white/15 rounded-full animate-bounce"
        style="animation-delay: 1.5s"
      ></div>

      <!-- Gradient orbs -->
      <div class="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div class="absolute bottom-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
    </div>

    <div
      class="container mx-auto px-6 flex flex-col items-center relative z-10"
    >
      <div
        class="md:text-left text-center flex flex-col items-center md:items-start w-full max-w-4xl"
      >
        <!-- Newsletter Tags -->
        <div
          class="flex flex-wrap gap-3 mb-6"
          data-aos="fade-up"
          data-aos-delay="100"
        >
          <div
            class="bg-gradient-to-r from-white/20 to-white/30 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-semibold border border-white/20"
          >
            <span class="text-yellow-300 font-bold">📅</span>
            Toda quarta-feira
          </div>
          <div
            class="bg-gradient-to-r from-emerald-500/20 to-teal-600/20 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-semibold border border-white/20"
          >
            <span class="text-green-300 font-bold">✨</span>
            100% Gratuito
          </div>
        </div>

        <h1
          class="font-display text-3xl sm:text-4xl md:text-6xl font-black mb-6 leading-tight text-white"
          data-aos="fade-up"
          data-aos-delay="200"
        >
          Newsletter <br />
          <span
            class="block font-medium text-white"
            >Access+</span
          >
        </h1>
        <p
          class="text-base sm:text-lg mb-8 max-w-2xl text-white/90 leading-relaxed"
          data-aos="fade-up"
          data-aos-delay="300"
        >
          Fique por dentro das últimas novidades, dicas e insights sobre
          oportunidades educacionais para jovens. Receba conteúdo exclusivo toda
          quarta-feira, diretamente na sua caixa de entrada.
        </p>

        <!-- Call to Action -->
        <div
          class="flex flex-col sm:flex-row gap-4 mt-4"
          data-aos="fade-up"
          data-aos-delay="400"
        >
          <button
            @click="scrollToSection('newsletter-posts')"
            class="group inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 border border-white/20 hover:border-white/40"
          >
            Ver posts
          </button>
          <button
            @click="scrollToSection('newsletter-subscription')"
            class="group inline-flex items-center gap-2 bg-white hover:bg-white/90 text-[#0D0B1A] font-body px-8 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            Inscrever-se
          </button>
        </div>
      </div>
    </div>

    <!-- Enhanced Decorative elements -->
    <div class="absolute top-10 right-10 opacity-30">
      <img
        src="/images/estrelinhas.png"
        alt=""
        class="w-16 h-16 animate-pulse"
      />
    </div>
    <div class="absolute bottom-10 left-10 opacity-30">
      <img
        src="/images/estrelinhas.png"
        alt=""
        class="w-12 h-12 animate-pulse"
        style="animation-delay: 1s"
      />
    </div>
  </header>
</template>

<script setup>
// Smooth scroll function
const scrollToSection = (sectionId) => {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({
      behavior: "smooth",
      block: "start",
      inline: "nearest",
    });
  }
};
</script>
