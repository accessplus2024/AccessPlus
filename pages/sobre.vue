<script setup>
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { onMounted } from 'vue';
import AOS from 'aos';
import 'aos/dist/aos.css';

onMounted(() => {
  AOS.init({
    duration: 1000,
    once: true,
  });

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

useHead({
  title: "Sobre",
  meta: [
    { charset: "UTF-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1.0" },
    { hid: "description", name: "description", content: "" },
  ],
  link: [
    {
      rel: "stylesheet",
      href: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css",
    },
  ],
  htmlAttrs: {
    lang: "pt-br",
  },
  link: [
    {
      rel: 'icon',
      type: 'image/png',
      href: '/images/estrelinhas.png'
    }
  ]
});
</script>

<template>
  <!-- Header -->
  <header
    class="relative bg-gradient-to-r from-purple-600 to-pink-600 pb-16 rounded-b-lg bg-cover bg-center"
    style="background-image: url('/images/stanford.svg');"
  >
    <!-- Overlay for background image -->
    <div class="absolute inset-0 bg-[#53366470]" style="z-index: 0; pointer-events: none;"></div>

    <div class="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center relative z-10">
      <!-- Navbar -->
      <Navbar transparent="true" />

      <!-- Header content -->
      <div class="text-center w-full max-w-4xl my-12 md:my-24 header-content">
        <h1 class="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold mb-4 leading-none" data-aos="fade-up">Sobre nós</h1>
      </div>
    </div>
  </header>

  <!-- About/story -->
  <div class="relative container mx-auto flex flex-col text-center mt-16 md:mt-28 mb-14 items-center justify-center px-4 sm:px-6 lg:px-8">
    <!-- Team member images and names -->
    <div class="hidden xl:flex absolute top-0 left-52 flex-col items-center" data-aos="fade-right">
      <img src="/images/paula_pic.png" alt="Paula Borges Frickes" class="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover" />
      <div class="absolute bottom-0 right-0 transform translate-y-1/2 bg-red-400 text-white text-sm font-semibold px-4 py-1 rounded-full text-center">
        PAULA
      </div>
    </div>
    <div class="hidden xl:flex absolute top-0 right-48 -translate-y-1/4 flex-col items-center" data-aos="fade-left">
      <img src="/images/iza_pic.png" alt="Ester Borges Frickes" class="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover" />
      <div class="absolute bottom-0 right-0 transform translate-y-1/2 bg-purple-400 text-white text-sm font-semibold px-4 py-1 rounded-full text-center">
        IZABELI
      </div>
    </div>
    <div class="hidden xl:flex absolute bottom-0 left-64 flex-col items-center" data-aos="fade-right">
      <img src="/images/ester_pic.png" alt="Izabeli Santos" class="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover" />
      <div class="absolute bottom-0 left-0 transform translate-y-1/2 bg-blue-800 text-white text-sm font-semibold px-4 py-1 rounded-full text-center">
        ESTER
      </div>
    </div>
    <div class="hidden xl:flex absolute bottom-10 right-72 translate-y-1/2 flex-col items-center" data-aos="fade-left">
      <img src="/images/camily_pic.png" alt="João Pedro Santos" class="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover" />
      <div class="absolute bottom-0 left-0 transform translate-y-1/2 bg-yellow-400 text-white text-sm font-semibold px-4 py-1 rounded-full text-center">
        CAMILY
      </div>
    </div>

    <h1 class="text-3xl sm:text-4xl md:text-5xl font-semibold mb-8" style="color: #380f45" data-aos="fade-up">
      Como tudo começou
    </h1>
    <div class="max-w-md text-base font-normal" data-aos="fade-up">
      <p class="text-gray-800">
        O Access+ nasceu de uma necessidade real e coletiva em 2024. Crescendo
        na periferia, vivenciamos de perto as dificuldades de acesso a
        oportunidades educacionais. Mesmo sendo estudantes dedicados,
        enfrentamos enormes desafios para encontrar atividades extracurriculares
        e programas que pudessem expandir nossos horizontes além da sala de
        aula.
      </p>
      <br />
      <p class="text-gray-800">
        Ao longo dos anos, percebemos que muitos jovens de baixa renda
        compartilhavam das mesmas dificuldades: a falta de informações
        centralizadas e acessíveis sobre oportunidades como olimpíadas
        acadêmicas, programas de mentoria e atividades culturais. Inspirados por
        essas experiências e pelo desejo de democratizar o acesso à educação,
        decidimos criar o Access+.
      </p>
    </div>
  </div>

  <!-- Values -->
  <div class="mt-16 md:mt-28">
    <h1 class="text-3xl sm:text-4xl md:text-5xl font-medium text-center mb-8" style="color: #380f45" data-aos="fade-up">
      Nossos <span class="font-semibold">Valores</span>
    </h1>
  </div>
  <div class="container mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex flex-col md:flex-row justify-center gap-6">
      <!-- Inclusion Card -->
      <div class="bg-red-400 text-white p-6 rounded-lg w-full md:w-80 h-64 flex flex-col justify-start items-start" data-aos="fade-up">
        <p class="text-2xl font-bold">Inclusão</p>
        <p class="text-base text-left">
          Acreditamos que todos os jovens devem ter as mesmas oportunidades de
          crescer e se desenvolver, independentemente de sua origem ou condição
          financeira.
        </p>
      </div>

      <!-- Innovation Card -->
      <div class="bg-purple-400 text-white p-6 rounded-lg w-full md:w-80 h-64 flex flex-col justify-start items-start" data-aos="fade-up" data-aos-delay="200">
        <p class="text-2xl font-bold">Inovação</p>
        <p class="text-base text-left">
          Através de ferramentas tecnológicas e uma abordagem moderna, nossa
          plataforma oferece uma maneira nova e eficaz de conectar estudantes com
          oportunidades educacionais.
        </p>
      </div>

      <!-- Community Card -->
      <div class="bg-blue-800 text-white p-6 rounded-lg w-full md:w-80 h-64 flex flex-col justify-start items-start" data-aos="fade-up" data-aos-delay="400">
        <p class="text-2xl font-bold">Comunidade</p>
        <p class="text-base text-left">
          Queremos construir uma rede de apoio que valorize o potencial de cada
          estudante, ajudando-os a alcançar seus sonhos e retribuir à sociedade.
        </p>
      </div>
    </div>
  </div>

  <!-- Team Section -->
  <div class="container mx-auto mt-16 md:mt-28 px-4 sm:px-6 lg:px-8">
    <h1 class="text-3xl sm:text-4xl md:text-5xl font-medium mb-8 text-center" style="color: #380f45" data-aos="fade-up">
      Nossos <br />
      <span class="font-semibold">Integrantes</span>
    </h1>

    <!-- Centered Container for Cards -->
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <!-- Cards Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-black">
        <!-- Paula Borges Frickes -->
        <div class="bg-gray-200 shadow-md rounded-lg p-6 flex flex-col justify-start items-start team-member">
          <img src="/images/paula_pic.png" alt="Paula Borges Frickes" class="w-full h-48 object-cover rounded-lg" />
          <div class="p-4">
            <h3 class="text-xl font-semibold mb-2">Paula Borges Frickes</h3>
            <p class="text-gray-700">Co-fundadora e Diretora Executiva</p>
            <p class="text-gray-700">Rio de Janeiro, RJ</p>
          </div>
        </div>

        <!-- Ester Borges Frickes -->
        <div class="bg-gray-200 shadow-md rounded-lg p-6 flex flex-col justify-start items-start team-member" data-aos-delay="100">
          <img src="/images/ester_pic.png" alt="Ester Borges Frickes" class="w-full h-48 object-cover rounded-lg" />
          <div class="p-4">
            <h3 class="text-xl font-semibold mb-2">Ester Borges Frickes</h3>
            <p class="text-gray-700">Co-Fundadora e Diretora de Operações</p>
            <p class="text-gray-700">Rio de Janeiro, RJ</p>
          </div>
        </div>

        <!-- Camily Carvalho Guimarães -->
        <div class="bg-gray-200 shadow-md rounded-lg p-6 flex flex-col justify-start items-start team-member" data-aos-delay="200">
          <img src="/images/camily_pic.png" alt="Camily Carvalho Guimarães" class="w-full h-48 object-cover rounded-lg" />
          <div class="p-4">
            <h3 class="text-xl font-semibold mb-2">Camily Guimarães Carvalho</h3>
            <p class="text-gray-700">Co-Fundadora e Diretora de Tecnologia</p>
            <p class="text-gray-700">Camaçari, BA</p>
          </div>
        </div>

        <!-- Izabeli Santos -->
        <div class="bg-gray-200 shadow-md rounded-lg p-6 flex flex-col justify-start items-start team-member"  data-aos-delay="300">
          <img src="/images/iza_pic.png" alt="Izabeli Santos" class="w-full h-48 object-cover rounded-lg" />
          <div class="p-4">
            <h3 class="text-xl font-semibold mb-2">Izabeli Santos</h3>
            <p class="text-gray-700">Co-fundadora e Diretora de Marketing</p>
            <p class="text-gray-700">Camaçari, BA</p>
          </div>
        </div>

        <!-- João Pedro Santos -->
        <div class="bg-gray-200 shadow-md rounded-lg p-6 flex flex-col justify-start items-start team-member" data-aos-delay="400">
          <img src="/images/joao_pedro_pic.png" alt="João Pedro Santos" class="w-full h-48 object-cover rounded-lg" />
          <div class="p-4">
            <h3 class="text-xl font-semibold mb-2">João Pedro Santos</h3>
            <p class="text-gray-700">Co-fundador e Analista de Tecnologia</p>
            <p class="text-gray-700">Alcobaça, BA</p>
          </div>
        </div>

        <!-- Vinícius Castelli -->
        <div class="bg-gray-200 shadow-md rounded-lg p-6 flex flex-col justify-start items-start team-member" data-aos-delay="500">
          <img src="/images/vinicius_pic.png" alt="Vinícius Castelli" class="w-full h-48 object-cover rounded-lg" />
          <div class="p-4">
            <h3 class="text-xl font-semibold mb-2">Vinícius Castelli</h3>
            <p class="text-gray-700">Co-fundador e Diretor de Expansão</p>
            <p class="text-gray-700">Bauru, SP</p>
          </div>
        </div>

        <!-- Ruan Cordeiro -->
        <div class="bg-gray-200 shadow-md rounded-lg p-6 flex flex-col justify-start items-start team-member" data-aos-delay="600">
          <img src="/images/ruan_pic.png" alt="Ruan Cordeiro" class="w-full h-48 object-cover rounded-lg" />
          <div class="p-4">
            <h3 class="text-xl font-semibold mb-2">Ruan Cordeiro</h3>
            <p class="text-gray-700">Co-fundador e Analista de Tecnologia</p>
            <p class="text-gray-700">São Pedro, RN</p>
          </div>
        </div>

        <!-- Alessandra Sena -->
        <div class="bg-gray-200 shadow-md rounded-lg p-6 flex flex-col justify-start items-start team-member"  data-aos-delay="700">
          <img src="/images/alessandra_pic.png" alt="Alessandra Sena" class="w-full h-48 object-cover rounded-lg" />
          <div class="p-4">
            <h3 class="text-xl font-semibold mb-2">Alessandra Sena</h3>
            <p class="text-gray-700">Co-fundadora e Analista de Tecnologia</p>
            <p class="text-gray-700">Dias d'Ávila, BA</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
