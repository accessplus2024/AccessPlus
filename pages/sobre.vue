<script setup>
import { onMounted } from 'vue';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import AOS from 'aos';
import 'aos/dist/aos.css';
import HeaderSection from '~/components/sobre/HeaderSection.vue';
import About from '~/components/sobre/About.vue';
import ValuesGrid from '~/components/sobre/ValuesGrid.vue';
import TeamGrid from '~/components/sobre/TeamGrid.vue';

useHead({
  link: [
    {
      rel: "icon",
      type: "image/png",
      href: "/images/estrelinhas.png",
    },
  ],
});

useHead({
  title: "Sobre nós",
  meta: [
    { charset: "UTF-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1.0" },
    { hid: "description", name: "description", content: "" },
  ],
  htmlAttrs: {
    lang: "pt-br",
  },
});

onMounted(() => {
  AOS.init({ duration: 1000, once: true });
  gsap.registerPlugin(ScrollTrigger);

  gsap.from('.header-content', {
    duration: 1.5,
    y: 50,
    opacity: 0,
    ease: 'power3.out',
  });

  gsap.from('.team-member', {
    duration: 1,
    opacity: 0,
    y: 50,
    stagger: 0.2,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.team-member',
      start: 'top 80%',
    },
  });
});
</script>

<template>
  <HeaderSection>
    Sobre nós
  </HeaderSection>

  <About>
    <p class="text-gray-800">
      O Access+ nasceu de uma necessidade real e coletiva em 2024. Crescendo na periferia, vivenciamos de perto as dificuldades de acesso a oportunidades educacionais. Mesmo sendo estudantes dedicados, enfrentamos enormes desafios para encontrar atividades extracurriculares e programas que pudessem expandir nossos horizontes além da sala de aula.
    </p>
    <br />
    <p class="text-gray-800">
      Ao longo dos anos, percebemos que muitos jovens de baixa renda compartilhavam das mesmas dificuldades: a falta de informações centralizadas e acessíveis sobre oportunidades como olimpíadas acadêmicas, programas de mentoria e atividades culturais. Inspirados por essas experiências e pelo desejo de democratizar o acesso à educação, decidimos criar o Access+.
    </p>
  </About>

  <div class="mt-16 md:mt-28">
    <h1 class="text-3xl sm:text-4xl md:text-5xl font-medium text-center mb-8" style="color: #380f45" data-aos="fade-up">
      Nossos <span class="font-semibold">Valores</span>
    </h1>
  </div>
  <ValuesGrid />

  <div class="container mx-auto mt-16 md:mt-28 px-4 sm:px-6 lg:px-8">
    <h1 class="text-3xl sm:text-4xl md:text-5xl font-medium mb-8 text-center" style="color: #380f45" data-aos="fade-up">
      Nossos <br />
      <span class="font-semibold">Integrantes</span>
    </h1>
    <TeamGrid />
  </div>
</template>
