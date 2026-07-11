<script setup>
import { ArrowRight } from "@iconoir/vue"
import HeaderSection from "~/components/sobre/HeaderSection.vue"
import About from "~/components/sobre/About.vue"
import ValuesGrid from "~/components/sobre/ValuesGrid.vue"
import TeamGrid from "~/components/sobre/TeamGrid.vue"

useHead({
  title: "Sobre nós — Access+",
  meta: [
    { charset: "UTF-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1.0" },
    { name: "description", content: "Conheça o time do Access+ e nossa missão de democratizar o acesso à educação no Brasil." },
  ],
  htmlAttrs: { lang: "pt-br" },
  link: [{ rel: "icon", href: "/favicon.ico" }],
})
</script>

<template>
  <HeaderSection />

  <About>
    <p>
      O Access+ nasceu de uma necessidade real e coletiva em 2024. Crescendo na periferia, vivenciamos de perto as dificuldades de acesso a oportunidades educacionais. Mesmo sendo estudantes dedicados, enfrentamos enormes desafios para encontrar atividades extracurriculares e programas que pudessem expandir nossos horizontes além da sala de aula.
    </p>
    <p>
      Ao longo dos anos, percebemos que muitos jovens de baixa renda compartilhavam das mesmas dificuldades: a falta de informações centralizadas e acessíveis sobre oportunidades como olimpíadas acadêmicas, programas de mentoria e atividades culturais. Inspirados por essas experiências e pelo desejo de democratizar o acesso à educação, decidimos criar o Access+.
    </p>
  </About>

  <section class="section" style="padding-bottom: 0">
    <div class="wrap">
      <div class="mb-[42px]">
        <span class="kicker">No que acreditamos</span>
        <h2 class="mt-3.5" style="font-size: clamp(34px, 4.5vw, 56px)">Nossos valores</h2>
      </div>
      <ValuesGrid />
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <div class="mb-[42px]">
        <span class="kicker">Quem faz acontecer</span>
        <h2 class="mt-3.5" style="font-size: clamp(34px, 4.5vw, 56px)">Nosso time</h2>
      </div>
      <TeamGrid />
    </div>
  </section>

  <section class="wrap" style="padding-bottom: 40px">
    <div class="relative overflow-hidden bg-ink text-paper text-center"
         style="border-radius: var(--r-lg); padding: 60px 48px">
      <h2 class="mx-auto" style="font-size: clamp(30px, 4vw, 48px); max-width: 720px; text-wrap: balance">
        Pronto para encontrar a sua próxima oportunidade?
      </h2>
      <NuxtLink to="/oportunidades" class="btn btn-lime mt-7">
        Explorar oportunidades <ArrowRight class="w-[18px] h-[18px]" />
      </NuxtLink>
    </div>
  </section>
</template>
