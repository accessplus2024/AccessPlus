<script setup>
import { Mail, Linkedin, Instagram, Youtube } from "@iconoir/vue";
const contacts = [
  {
    icon: Mail,
    label: "E-mail",
    info: "contato@accessplus.com",
  },
  {
    icon: Linkedin,
    label: "LinkedIn",
    info: "linkedin.com/company/accessplus",
  },
  {
    icon: Instagram,
    label: "Instagram",
    info: "@accessplus",
  },
  {
    icon: Youtube,
    label: "YouTube",
    info: "youtube.com/accessplus",
  },
];

useHead({
  title: "Home",
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
  const carousel = document.getElementById("carousel");
  const carouselInner = document.getElementById("carouselInner");
  const cardWidth = carousel.offsetWidth / 3.0 + 20;
  let currentPosition = 0;

  function updateCarouselPosition() {
    carouselInner.style.transform = `translateX(-${currentPosition}px)`;
  }

  document.getElementById("nextBtn").addEventListener("click", () => {
    const maxScrollPosition = carouselInner.scrollWidth - carousel.offsetWidth;
    currentPosition = Math.min(currentPosition + cardWidth, maxScrollPosition);
    updateCarouselPosition();
  });

  document.getElementById("prevBtn").addEventListener("click", () => {
    currentPosition = Math.max(currentPosition - cardWidth, 0);
    updateCarouselPosition();
  });
});
</script>

<template>
  <body class="bg-white">
    <!-- Header Section -->
    <header
      class="relative bg-gradient-to-r from-purple-600 to-pink-600 pb-16 rounded-b-lg bg-cover bg-center"
      style="background-image: url('/images/Fundo.png')"
    >
      <div class="container mx-auto px-6 flex flex-col items-center">
        <!-- Navbar -->
        <Navbar transparent="true" />
        <!-- Heading Content -->
        <div
          class="md:text-left text-center flex flex-col items-center md:items-start w-full max-w-4xl"
        >
          <h1
            class="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-none text-white"
          >
            Procurando <br />
            <span class="block">por olimpíadas?</span>
          </h1>
          <p class="text-base sm:text-lg mb-6 max-w-md text-white">
            Access+ é a primeira plataforma gratuita do país focada em trazer
            oportunidades educacionais atualizadas para jovens.
          </p>
          <a
            href="#"
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
        class="text-2xl sm:text-3xl md:text-4xl font-bold flex flex-col gap-4 justify-center items-center text-gray-800 mb-8"
      >
        O que você pode encontrar no &nbsp;<img
          src="/images/logo-dark.svg"
          class="h-8 sm:h-10 md:h-12"
        />
      </h1>

      <!-- Cards Container -->
      <div class="flex flex-wrap justify-center gap-6">
        <!-- Opp Card -->
        <div
          class="bg-cover bg-bottom md:bg-center text-white p-6 rounded-lg w-full sm:w-64 h-48 flex flex-col justify-start items-start relative"
          style="background-image: url('/images/oportunidades.png')"
        >
          <p class="text-2xl font-bold">+140</p>
          <p class="text-lg text-left">oportunidades educacionais</p>
        </div>

        <!-- Guias Card -->
        <div
          class="bg-cover bg-bottom md:bg-center text-white p-6 rounded-lg w-full sm:w-64 h-48 flex flex-col justify-start items-start relative"
          style="background-image: url('/images/Guias.png')"
        >
          <p class="text-2xl font-bold">Guias</p>
          <p class="text-lg text-left">e informações atualizadas</p>
        </div>

        <!-- Dicas Card -->
        <div
          class="bg-cover bg-bottom md:bg-center text-white p-6 rounded-lg w-full sm:w-64 h-48 flex flex-col justify-start items-start relative"
          style="background-image: url('/images/Dicas.png')"
        >
          <p class="text-2xl font-bold">Dicas</p>
          <p class="text-lg text-left">de premiados das mais diversas áreas</p>
        </div>
      </div>
    </div>
    <!-- Oportunidades Section -->
    <section
      class="bg-white py-16 bg-cover bg-no-repeat bg-center"
      style="background-image: url('/images/Estrelas 1.png')"
    >
      <div class="container mx-auto px-6 max-w-4xl text-center">
        <h3 class="text-lg text-gray-700 mb-4 poppins-font">OPORTUNIDADES</h3>
        <h2 class="text-3xl font-bold text-[#1D1128] mb-8">
          Confira nossas categorias
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-9">
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
          href="#"
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
        <div class="flex items-center justify-between">
          <!-- Carousel Left Arrow -->
          <button
            id="prevBtn"
            class="text-purple-600 text-3xl focus:outline-none"
          >
            <i class="fas fa-chevron-left"></i>
          </button>
          <!-- Cards Carousel -->
          <div id="carousel" class="relative w-full overflow-hidden">
            <div
              id="carouselInner"
              class="flex space-x-5 transition-transform duration-300 ease-in-out"
            >
              <!-- Card 1 -->
              <div
                class="bg-white rounded-xl overflow-hidden min-w-full sm:min-w-[35%] border border-gray-200"
              >
                <img
                  src="https://placehold.co/400x200"
                  alt="Image of educational opportunity from Education USA"
                  class="w-full h-48 object-cover"
                />
                <div class="p-6">
                  <div class="flex flex-wrap space-x-2 mb-4">
                    <span
                      class="bg-purple-600 text-white text-xs px-3 py-1 rounded-full"
                      >Categoria</span
                    >
                    <span
                      class="bg-red-500 text-white text-xs px-3 py-1 rounded-full"
                      >Deadline</span
                    >
                    <span
                      class="bg-blue-500 text-white text-xs px-3 py-1 rounded-full"
                      >Nível</span
                    >
                  </div>
                  <h3 class="text-lg font-bold text-gray-800 mb-2">Nome</h3>
                  <p class="text-sm text-gray-600 mb-4">
                    Descrição breve da oportunidade
                  </p>
                  <a href="#" class="text-purple-600 font-semibold"
                    >Veja mais</a
                  >
                </div>
              </div>
              <!-- Card 2 -->
              <!-- Repeat similar structure for other cards -->
            </div>
          </div>
          <!-- Carousel Right Arrow -->
          <button
            id="nextBtn"
            class="text-purple-600 text-3xl focus:outline-none"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </section>

    <!-- Sobre nós Section -->
    <section
      class="bg-cover bg-center bg-white mx-auto my-16 px-6 p-8 rounded-lg shadow-md"
      style="background-image: url('/images/bg-about.png')"
    >
      <div class="flex flex-col lg:flex-row items-center justify-between">
        <div class="flex-1">
          <h2
            class="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight pl-6 lg:pl-24 text-gray-900"
          >
            Sobre nós
          </h2>
        </div>
        <div class="flex-1 text-left mt-8 lg:mt-0">
          <p class="text-base text-gray-800 mb-6 font-poppins px-6 lg:px-0">
            O time do Access+ é formado por pessoas comprometidas com a
            democratização do acesso à educação no Brasil. Cada membro traz uma
            combinação única de experiências, habilidades e paixões que
            impulsionam nosso objetivo de criar um futuro mais justo e
            igualitário para os estudantes de baixa renda.
          </p>
          <a
            href="#"
            class="inline-block bg-yellow-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-300 mx-6 lg:mx-0"
            >Ver tudo</a
          >
        </div>
      </div>
    </section>

    <!-- Contact Section -->
    <section
      class="max-w-6xl mx-auto my-16 px-6 grid grid-cols-1 lg:grid-cols-2 gap-8"
    >
      <!-- Contact Information -->
      <div class="p-8 bg-white rounded-lg">
        <h2 class="text-4xl font-bold leading-tight text-gray-900 mb-6">
          Entre em contato
        </h2>
        <p class="text-base font-light leading-6 text-gray-800 mb-8">
          Nós do Access+ estamos sempre prontos para ouvir você! Se tiver
          dúvidas, sugestões ou quiser saber mais sobre o projeto, entre em
          contato conosco. Estamos aqui para ajudar e colaborar na construção de
          um futuro com mais oportunidades para todos.
        </p>
        <div class="space-y-4">
          <!-- Contact Information Sections -->
          <div
            v-for="(contact, index) in contacts"
            :key="index"
            class="flex items-center space-x-4 bg-gray-100 p-4 rounded-lg"
          >
            <div class="bg-purple-100 contact-icon rounded-full p-3">
              <component class="text-[#3d30a2]" :is="contact.icon" />
            </div>
            <div>
              <p class="text-sm font-bold text-gray-700">{{ contact.label }}</p>
              <p v-if="contact.info" class="text-sm text-gray-500">
                {{ contact.info }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Contact Form -->
      <div class="bg-[#3D30A2] p-8 rounded-lg shadow-md">
        <h2 class="text-2xl font-semibold leading-tight text-white mb-6">
          Mande uma Mensagem
        </h2>
        <form>
          <div class="mb-6">
            <label for="name" class="block text-white mb-2 text-left"
              >Nome</label
            >
            <input
              type="text"
              id="name"
              class="w-full p-3 rounded-lg border border-purple-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Nome"
            />
          </div>
          <div class="mb-6">
            <label for="email" class="block text-white mb-2 text-left"
              >E-mail</label
            >
            <input
              type="email"
              id="email"
              class="w-full p-3 rounded-lg border border-purple-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="E-mail"
            />
          </div>
          <div class="mb-6">
            <label for="message" class="block text-white mb-2 text-left"
              >Mensagem</label
            >
            <textarea
              id="message"
              rows="4"
              class="w-full p-3 rounded-lg border border-purple-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Mensagem"
            ></textarea>
          </div>
          <button
            type="submit"
            class="bg-[#FAD87E] text-black px-8 py-3 rounded-lg font-semibold hover:bg-yellow-300"
          >
            Enviar
          </button>
        </form>
      </div>
    </section>

    <section class="bg-red-400 py-10 rounded-xl max-w-5xl mx-auto font-poppins">
      <div class="px-6 md:px-12 lg:px-24">
        <!-- Title -->
        <h2
          class="text-white mb-4 text-center text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight"
        >
          Top 15 e Representante do Brasil
        </h2>
        <!-- Paragraph -->
        <p
          class="text-white mb-8 text-justify text-base sm:text-lg md:text-xl font-light leading-relaxed"
        >
          Participar do BeChangemaker nos permitiu aprimorar nosso projeto com o
          suporte de especialistas globais, desenvolver estratégias de impacto e
          fortalecer nossa visão de criar uma plataforma que transforme vidas.
          Foi um marco importante na nossa jornada, nos conectando com outras
          iniciativas inovadoras ao redor do mundo e nos inspirando a continuar
          expandindo nossos horizontes.
        </p>
        <!-- Logos -->
        <div class="flex flex-wrap justify-center space-x-1">
          <img
            src="/images/BeChangemakaer logo.svg"
            alt="BeChangeMaker Logo"
            class="w-24 md:w-32 lg:w-48 h-auto m-2"
          />
          <img
            src="/images/Worldskills loog.png"
            alt="WorldSkills Logo"
            class="w-24 md:w-32 lg:w-48 h-auto m-2"
          />
          <img
            src="/images/HP Foundation.svg"
            alt="HP Foundation Logo"
            class="w-24 md:w-32 lg:w-48 h-auto m-2"
          />
          <img
            src="/images/UNESCO-UNEVOC.svg"
            alt="UNESCO Logo"
            class="w-24 md:w-32 lg:w-48 h-auto m-2"
          />
        </div>
      </div>
    </section>

    <Footer />
  </body>
</template>
