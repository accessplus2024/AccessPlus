<script setup>
import { onMounted } from "vue"
import { gsap } from "gsap"

onMounted(() => {
  gsap.from("header h1", { duration: 1.5, y: -50, opacity: 0, ease: "power3.out" })
  gsap.from("header p", { duration: 1.5, y: 50, opacity: 0, ease: "power3.out", delay: 0.5 })
  gsap.from("header a", { duration: 1.5, y: 50, opacity: 0, ease: "power3.out", delay: 1 })
})
</script>

<template>
  <header
    class="relative bg-primary pt-32 pb-16 rounded-b-lg bg-cover bg-center"
    style="background-image: url('/images/Fundo.png')"
  >
    <div class="container mx-auto px-6 flex flex-col items-center">
      <div class="md:text-left text-center flex flex-col items-center md:items-start w-full max-w-4xl">
        <h1 class="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-none text-white">
          Procurando <br />
          <span class="block">por oportunidades?</span>
        </h1>
        <p class="font-body text-base sm:text-lg mb-6 max-w-md text-white/90">
          Access+ é a maior plataforma gratuita do país focada em trazer
          oportunidades educacionais atualizadas para jovens.
        </p>
        <a
          href="/oportunidades"
          class="font-body bg-accent-green text-[#0D0B1A] px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
        >Ver tudo</a>
      </div>
    </div>
  </header>
</template>
