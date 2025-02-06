<script setup>
import { onMounted } from 'vue';
import { gsap } from 'gsap';
import AOS from 'aos';
import 'aos/dist/aos.css';

import {
  Linkedin,
  Instagram,
  Youtube,
} from '@iconoir/vue';

useHead({
  link: [
    {
      rel: 'icon',
      type: 'image/png',
      href: '/images/estrelinhas.png'
    }
  ]
});

const contacts = [
  {
    icon: Linkedin,
    label: 'LinkedIn',
    link: 'https://www.linkedin.com/company/accesspluseducation/posts/?feedView=all',
  },
  {
    icon: Instagram,
    label: 'Instagram',
    link: 'https://www.instagram.com/accessplusoficial/',
  },
  {
    icon: Youtube,
    label: 'YouTube',
    link: 'https://www.youtube.com/@AccessPlusOficial',
  },
];

useHead({
  title: 'Home',
  meta: [
    { charset: 'UTF-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
    { hid: 'description', name: 'description', content: '' },
  ],
  htmlAttrs: {
    lang: 'pt-br',
  },
});

onMounted(() => {
  // Initialize AOS
  AOS.init({
    duration: 1000,
    once: true,
  });

  // GSAP Animations
  gsap.from('header h1', {
    duration: 1.5,
    y: -50,
    opacity: 0,
    ease: 'power3.out',
  });

  gsap.from('header p', {
    duration: 1.5,
    y: 50,
    opacity: 0,
    ease: 'power3.out',
    delay: 0.5,
  });

  gsap.from('header a', {
    duration: 1.5,
    y: 50,
    opacity: 0,
    ease: 'power3.out',
    delay: 1,
  });

  gsap.from('.card', {
    duration: 1,
    y: 50,
    opacity: 0,
    stagger: 0.2,
    ease: 'power3.out',
    delay: 1.5,
  });
});
</script>

<template>
  <!-- Header Section -->
  <header
    class="relative bg-gradient-to-r from-purple-600 to-pink-600 pb-16 rounded-b-lg bg-cover bg-center"
    style="background-image: url('/images/Fundo.png')">
    <div class="container mx-auto px-6 flex flex-col items-center">
      <!-- Navbar -->
      <Navbar transparent="true" />
      <!-- Heading Content -->
      <div
        class="md:text-left text-center flex flex-col items-center md:items-start w-full max-w-4xl">
        <h1
          class="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-none text-white">
          Procurando <br />
          <span class="block">por oportunidades?</span>
        </h1>
        <p class="text-base sm:text-lg mb-6 max-w-md text-white">
          Access+ é a primeira plataforma gratuita do país focada em trazer
          oportunidades educacionais atualizadas para jovens.
        </p>
        <a
          href="/oportunidades"
          class="bg-yellow-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-300"
          >Ver tudo</a
        >
      </div>
    </div>
  </header>

  <!-- O que você pode encontrar -->
  <div class="text-center mt-12">
    <!-- Title -->
    <h1
      class="text-2xl sm:text-3xl md:text-4xl font-bold flex flex-col gap-4 justify-center items-center text-gray-800 mb-8">
      O que você pode encontrar no &nbsp;<img
        src="/images/logo-dark.svg"
        class="h-8 sm:h-10 md:h-12" />
    </h1>

    <!-- Cards Container -->
    <div class="flex flex-wrap justify-center gap-6 px-4">
      <!-- Opp Card -->
      <div
        class="card bg-cover bg-bottom md:bg-center text-white p-6 rounded-lg w-1/2 sm:w-64 h-48 flex flex-col justify-start items-start relative"
        style="background-image: url('/images/oportunidades.png')">
        <p class="text-2xl font-bold">+140</p>
        <p class="text-lg text-left">oportunidades educacionais</p>
      </div>

      <!-- Guias Card -->
      <div
        data-aos-delay="200"
        class="card bg-cover bg-bottom md:bg-center text-white p-6 rounded-lg w-1/2 sm:w-64 h-48 flex flex-col justify-start items-start relative"
        style="background-image: url('/images/Guias.png')">
        <p class="text-2xl font-bold">Guias</p>
        <p class="text-lg text-left">e informações atualizadas</p>
      </div>

      <!-- Dicas Card -->
      <div
        data-aos-delay="400"
        class="card bg-cover bg-bottom md:bg-center text-white p-6 rounded-lg w-1/2 mx-auto sm:mx-0 sm:w-64 h-48 flex flex-col justify-start items-start relative"
        style="background-image: url('/images/Dicas.png')">
        <p class="text-2xl font-bold">Dicas</p>
        <p class="text-lg text-left">de premiados das mais diversas áreas</p>
      </div>
    </div>
  </div>

  <!-- Oportunidades Section -->
  <section
    class="bg-white py-16 bg-cover bg-no-repeat bg-center"
    style="background-image: url('/images/Estrelas 1.png')">
    <div class="container mx-auto px-6 max-w-4xl text-center">
      <h3 class="text-lg text-gray-700 mb-4 poppins-font">OPORTUNIDADES</h3>
      <h2 class="text-3xl font-bold text-[#1D1128] mb-8">
        Confira nossas categorias
      </h2>
      <div class="grid gap-2 mb-9 grid-cols-2">
        <!-- Categories Buttons -->
        <Category category="Mentorias" icon="mentorship" />
        <Category category="Bolsas de Estudo" icon="scholarship" />
        <Category category="Olimpíadas Científicas" icon="olympiads" />
        <Category category="MUNs" icon="mun" />
        <Category category="Programas Acadêmicos" icon="academic_programs" />
        <Category category="Competições" icon="competitions" />
        <Category category="Intercâmbios" icon="exchanges" />
        <Category category="Competições de Escrita" icon="writing_comp" />
      </div>
      <a
        href="/oportunidades"
        class="bg-yellow-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-300"
        >Ver tudo</a
      >
    </div>
  </section>

  <section class="bg-gray-100 py-16">
    <div class="container mx-auto px-6 max-w-6xl">
      <h2 class="text-3xl font-bold text-left text-[#140E3F] mb-12 pl-6">
        <span class="font-bold">Novidades </span>
        <span class="font-medium">do Mês</span>
      </h2>
      <div class="flex justify-center">
        <iframe style="border-radius:12px" src="https://open.spotify.com/embed/episode/2P4P0YWP6cHk2o3frRVCCw/video?utm_source=generator" width="100%" height="351" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
      </div>
    </div>
  </section>

  <!-- Sobre nós Section -->
  <section
    data-aos="fade-up"
    class="bg-cover bg-center bg-white mx-auto my-16 px-6 p-8 rounded-lg shadow-md max-w-6xl"
    style="background-image: url('/images/bg-about.png')">
    <div class="flex flex-col lg:flex-row items-center justify-between">
      <div class="flex-1">
        <h2 class="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight pl-6 lg:pl-24 text-gray-900">Sobre nós</h2>
      </div>
      <div class="flex-1 text-left mt-8 lg:mt-0">
        <p class="text-base text-gray-800 mb-6 font-poppins px-6 lg:px-0">
          O time do Access+ é formado por pessoas comprometidas com a democratização do acesso à educação no Brasil. Cada membro traz uma combinação única de experiências, habilidades e paixões que impulsionam nosso objetivo de criar um futuro mais justo e igualitário para os estudantes de baixa renda.
        </p>
        <a href="/sobre" class="inline-block bg-yellow-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-300 mx-6 lg:mx-0">Ver tudo</a>
      </div>
    </div>
  </section>

  <!-- Contact Section -->
  <section
    class="max-w-6xl mx-auto my-16 px-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
    <!-- Contact Information -->
    <div
      data-aos="fade-right"
      class="p-8 bg-white rounded-lg">
      <h2 class="text-4xl font-bold leading-tight text-gray-900 mb-6">
        Entre em contato
      </h2>
      <p class="text-base font-light leading-6 text-gray-800 mb-8">
        Nós do Access+ estamos sempre prontos para ouvir você! Se tiver dúvidas,
        sugestões ou quiser saber mais sobre o projeto, entre em contato
        conosco. Estamos aqui para ajudar e colaborar na construção de um futuro
        com mais oportunidades para todos.
      </p>
      <div class="space-y-4">
        <!-- Contact Information Sections -->
        <div
          v-for="(contact, index) in contacts"
          :key="index"
          class="flex items-center space-x-4 bg-gray-100 p-4 rounded-lg">
          <div
            class="bg-purple-100 contact-icon rounded-full p-3 flex-shrink-0">
            <component class="text-[#3d30a2]" :is="contact.icon" />
          </div>
          <a class="text-decoration-none flex-grow" :href="contact.link">
            <div>
              <p class="text-sm font-bold text-gray-700">{{ contact.label }}</p>
              <p v-if="contact.info" class="text-xs text-gray-500">
                {{ contact.info }}
              </p>
            </div>
          </a>
        </div>
      </div>
    </div>

    <!-- Contact Form -->
    <div
      data-aos="fade-left"
      class="bg-[#3D30A2] p-8 rounded-lg shadow-md">
      <h2 class="text-2xl font-semibold leading-tight text-white mb-6">Mande uma Mensagem</h2>
      <form action="https://formspree.io/f/meoekypw" method="POST">
        <div class="mb-6">
          <label for="name" class="block text-white mb-2 text-left">Nome</label>
          <input type="text" id="name" name="name" class="w-full p-3 rounded-lg border border-purple-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-black" placeholder="Nome" />
        </div>
        <div class="mb-6">
          <label for="email" class="block text-white mb-2 text-left">E-mail</label>
          <input type="email" id="email" name="email" class="w-full p-3 rounded-lg border border-purple-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-black" placeholder="E-mail" />
        </div>
        <div class="mb-6">
          <label for="message" class="block text-white mb-2 text-left">Mensagem</label>
          <textarea id="message" name="message" rows="4" class="w-full p-3 rounded-lg border border-purple-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-black" placeholder="Mensagem"></textarea>
        </div>
        <button type="submit" class="bg-[#FAD87E] text-black px-8 py-3 rounded-lg font-semibold hover:bg-yellow-300">Enviar</button>
      </form>
    </div>
  </section>

  <section
    data-aos="fade-up"
    class="bg-red-400 py-10 rounded-xl max-w-5xl mx-auto font-poppins">
    <div class="px-6 md:px-12 lg:px-24">
      <!-- Title -->
      <h2
        class="text-white mb-4 text-center text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight">
        Top 15 e Representante do Brasil
      </h2>
      <!-- Paragraph -->
      <p
        class="text-white mb-8 text-justify text-base sm:text-lg md:text-xl font-light leading-relaxed">
        Participar do BeChangemaker nos permitiu aprimorar nosso projeto com o
        suporte de especialistas globais, desenvolver estratégias de impacto e
        fortalecer nossa visão de criar uma plataforma que transforme vidas. Foi
        um marco importante na nossa jornada, nos conectando com outras
        iniciativas inovadoras ao redor do mundo e nos inspirando a continuar
        expandindo nossos horizontes.
      </p>
      <!-- Logos -->
      <div class="flex flex-wrap justify-center space-x-1">
        <img
          src="/images/BeChangemakaer logo.svg"
          alt="BeChangeMaker Logo"
          class="w-24 md:w-32 lg:w-48 h-auto m-2" />
        <img
          src="/images/Worldskills loog.png"
          alt="WorldSkills Logo"
          class="w-24 md:w-32 lg:w-48 h-auto m-2" />
        <img
          src="/images/HP Foundation.svg"
          alt="HP Foundation Logo"
          class="w-24 md:w-32 lg:w-48 h-auto m-2" />
        <img
          src="/images/UNESCO-UNEVOC.svg"
          alt="UNESCO Logo"
          class="w-24 md:w-32 lg:w-48 h-auto m-2" />
      </div>
    </div>
  </section>
</template>
