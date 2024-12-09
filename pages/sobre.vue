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

  <!-- About/story -->
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
  <div class="mt-28">
    <h1 class="text-5xl font-medium text-center mb-8" style="color: #380f45">
      Nossos <span class="font-semibold">Valores</span>
    </h1>
  </div>
  <div class="flex justify-center gap-6">
    <!-- Inclusion Card -->
    <div
      class="bg-red-400 text-white p-6 rounded-lg w-80 h-64 flex flex-col justify-start items-start relative"
    >
      <p class="text-2xl font-bold">Inclusão</p>
      <p class="text-base text-left">
        Acreditamos que todos os jovens devem ter as mesmas oportunidades de
        crescer e se desenvolver, independentemente de sua origem ou condição
        financeira.
      </p>
    </div>

    <!-- Innovation Card -->
    <div
      class="bg-purple-400 text-white p-6 rounded-lg w-80 h-64 flex flex-col justify-start items-start relative"
    >
      <p class="text-2xl font-bold">Inovação</p>
      <p class="text-base text-left">
        Através de ferramentas tecnológicas e uma abordagem moderna, nossa
        plataforma oferece uma maneira nova e eficaz de conectar estudantes com
        oportunidades educacionais.
      </p>
    </div>

    <!-- Community Card -->
    <div
      class="bg-blue-800 text-white p-6 rounded-lg w-80 h-64 flex flex-col justify-start items-start relative"
    >
      <p class="text-2xl font-bold">Comunidade</p>
      <p class="text-base text-left">
        Queremos construir uma rede de apoio que valorize o potencial de cada
        estudante, ajudando-os a alcançar seus sonhos e retribuir à sociedade.
      </p>
    </div>
  </div>

  <!-- Team -->
  <div class="container mx-auto mt-28">
    <h1 class="text-5xl font-medium mb-8" style="color: #380f45">
      Nossos <br />
      <span class="font-semibold">Integrantes</span>
    </h1>

    <!-- Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-black">
      <div
        class="bg-gray-200 shadow-md rounded-lg p-6 flex flex-col justify-start items-start"
      >
        <img
          src="/images/perfil_linkedin_1.png"
          alt="Paula Borges Frickes"
          class="w-full object-cover"
        />
        <div class="p-6">
          <h3 class="text-xl font-semibold mb-2">Paula Borges Frickes</h3>
          <p class="text-gray-700">Co-fundadora e Diretora Executiva</p>
          <p class="text-gray-700">Rio de Janeiro, RJ</p>
        </div>
      </div>

      <div
        class="bg-gray-200 shadow-md rounded-lg p-6 flex flex-col justify-start items-start"
      >
        <img
          src="/images/perfil_linkedin_1.png"
          alt="Paula Borges Frickes"
          class="w-full object-cover"
        />
        <div class="p-6">
          <h3 class="text-xl font-semibold mb-2">Ester Borges Frickes</h3>
          <p class="text-gray-700">Co-Fundadora e Diretora de Operações</p>
          <p class="text-gray-700">Rio de Janeiro, RJ</p>
        </div>
      </div>

      <div
        class="bg-gray-200 shadow-md rounded-lg p-6 flex flex-col justify-start items-start"
      >
        <img
          src="/images/perfil_linkedin_1.png"
          alt="Paula Borges Frickes"
          class="w-full object-cover"
        />
        <div class="p-6">
          <h3 class="text-xl font-semibold mb-2">Camily Guimarães</h3>
          <p class="text-gray-700">Co-fundadora e Diretora de X</p>
          <p class="text-gray-700">X, MG</p>
        </div>
      </div>
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
</template>
