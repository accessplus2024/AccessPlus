<!-- Config da pag -->
<script setup>
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
});
</script>

<template>
  <body class="bg-white text-white">
    <!-- header -->
    <header
      class="relative bg-gradient-to-r from-purple-600 to-pink-600 pb-16 rounded-b-lg bg-cover bg-center"
      style="background-image: url('/images/sobre.png')"
    >
      <div class="container mx-auto px-6 flex flex-col items-center">
        <!-- Navbar -->
        <Navbar transparent="true" />

        <!-- Header content -->
        <div class="text-center w-full max-w-4xl my-24">
          <h1 class="text-8xl font-bold mb-4 leading-none">Sobre nós</h1>
        </div>
      </div>
    </header>

    <!-- texto inicial -->
    <!-- Todo: colocar fotos das meninas-->
    <div
      class="container mx-auto flex flex-col text-center mt-28 mb-14 items-center justify-center px-4"
    >
      <h1 class="text-5xl font-semibold mb-8" style="color: #380f45">
        Como tudo começou
      </h1>
      <div class="max-w-md text-base font-normal">
        <p class="text-gray-800">
          O Access+ nasceu de uma necessidade real e coletiva em 2024. Crescendo
          na periferia, vivenciamos de perto as dificuldades de acesso a
          oportunidades educacionais. Mesmo sendo estudantes dedicados,
          enfrentamos enormes desafios para encontrar atividades
          extracurriculares e programas que pudessem expandir nossos horizontes
          além da sala de aula.
        </p>
        <br />
        <p class="text-gray-800">
          Ao longo dos anos, percebemos que muitos jovens de baixa renda
          compartilhavam das mesmas dificuldades: a falta de informações
          centralizadas e acessíveis sobre oportunidades como olimpíadas
          acadêmicas, programas de mentoria e atividades culturais. Inspirados
          por essas experiências e pelo desejo de democratizar o acesso à
          educação, decidimos criar o Access+.
        </p>
      </div>
    </div>

    <!-- Cards de objetivos -->
    <div
      class="container mx-auto flex flex-row gap-16 items-center justify-center"
    >
      <!-- Card individual-->
      <div
        class="text-white py-12 px-16 rounded-lg h-96 flex flex-col justify-start items-start"
        style="background-color: #3d30a2; width: 32rem"
      >
        <!-- Tag objetivo-->
        <span
          class="text-gray-800 text-center text-sm px-5 py-2 rounded-full mb-9"
          style="background-color: #d9d9d9"
          >NOSSA MISSÃO</span
        >

        <h1 class="text-left text-4xl">
          Democratizar o acesso a oportunidades educacionais e transformar vidas
          por meio da educação.
        </h1>
      </div>

      <!-- Card individual-->
      <div
        class="text-white py-12 px-16 rounded-lg h-96 flex flex-col justify-start items-start"
        style="background-color: #3d30a2; width: 32rem"
      >
        <!-- Tag objetivo-->
        <span
          class="text-gray-800 text-center text-sm px-5 py-2 rounded-full mb-9"
          style="background-color: #f16767"
          >Blank</span
        >

        <h1 class="text-left text-4xl">Some text.</h1>
      </div>
    </div>

    <!-- Footer -->

    <footer class="bg-[#A459D1] py-10 mt-12 rounded-t-3xl">
      <div class="max-w-5xl mx-auto px-[60px] flex justify-between items-start">
        <div class="flex flex-col items-start">
          <div class="flex flex-1 w-full h-full">
            <img src="/images/logo-light-footer.svg" class="mt-7" />
          </div>
          <div class="text-white mt-48">
            <p>Siga nossas redes sociais:</p>
            <div class="flex space-x-4 mt-2">
              <a href="#" class="text-white flex items-center">
                <i class="fab fa-instagram mr-2"></i> Instagram
              </a>
              <a href="#" class="text-white flex items-center">
                <i class="fab fa-linkedin mr-2"></i> LinkedIn
              </a>
            </div>
          </div>
        </div>
        <div class="text-white text-left">
          <h2 class="text-[24px] font-semibold mb-2">Navegação</h2>
          <ul class="flex flex-col space-y-1">
            <li v-for="link in ['Início', 'Sobre nós', 'Oportunidades']">
              <a
                href="#"
                class="text-white text-[14px] hover:text-yellow-500 font-bold"
                >{{ link }}
              </a>
            </li>
            <li
              v-for="category in [
                'Olimpíadas Científicas',
                'Programas de Intercâmbio',
                'Competições de Escrita',
                'Mentorias',
                'Bolsas de Estudo',
                'MUNs',
              ]"
            >
              <a href="#" class="text-white text-[14px] hover:text-yellow-500"
                >{{ category }}
              </a>
            </li>
            <li>
              <a
                href="#"
                class="text-white text-[14px] hover:text-yellow-500 font-bold"
                >Veja Tudo
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  </body>
</template>
