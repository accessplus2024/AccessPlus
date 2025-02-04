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
        <h1 class="text-5xl md:text-8xl font-bold mb-4 leading-none">Sobre nós</h1>
      </div>
    </div>
  </header>

  <!-- About/story -->
  <div class="relative container mx-auto flex flex-col text-center mt-28 mb-14 items-center justify-center px-4">
    
    <!-- Team member images and names -->
    <div class="hidden md:flex absolute top-0 left-72 flex-col items-center">
      <img src="/images/paula_pic.png" alt="Paula Borges Frickes" class="w-32 h-32 rounded-full object-cover" />
      <div class="absolute bottom-0 right-0 transform translate-y-1/2 bg-red-400 text-white text-sm font-semibold px-4 py-1 rounded-full text-center">
        PAULA
      </div>
    </div>
    <div class="hidden md:flex absolute top-0 right-64  -translate-y-1/4 flex-col items-center">
      <img src="/images/iza_pic.png" alt="Ester Borges Frickes" class="w-32 h-32 rounded-full object-cover" />
      <div class="absolute bottom-0 right-0 transform translate-y-1/2 bg-purple-400 text-white text-sm font-semibold px-4 py-1 rounded-full text-center">
        IZABELI
      </div>
    </div>
    <div class="hidden md:flex absolute bottom-0 left-64 flex-col items-center">
      <img src="/images/ester_pic.png" alt="Izabeli Santos" class="w-32 h-32 rounded-full object-cover" />
      <div class="absolute bottom-0 left-0 transform translate-y-1/2 bg-blue-800 text-white text-sm font-semibold px-4 py-1 rounded-full text-center">
        ESTER
      </div>
    </div>
    <div class="hidden md:flex absolute bottom-10 right-72 translate-y-1/2 flex-col items-center">
      <img src="/images/camily_pic.png" alt="João Pedro Santos" class="w-32 h-32 rounded-full object-cover" />
      <div class="absolute bottom-0 left-0 transform translate-y-1/2 bg-yellow-400 text-white text-sm font-semibold px-4 py-1 rounded-full text-center">
        CAMILY
      </div>
    </div>

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
  <div class="flex flex-col md:flex-row justify-center gap-6 px-4">
    <!-- Inclusion Card -->
    <div
      class="bg-red-400 text-white p-6 rounded-lg w-full md:w-80 h-64 flex flex-col justify-start items-start relative"
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
      class="bg-purple-400 text-white p-6 rounded-lg w-full md:w-80 h-64 flex flex-col justify-start items-start relative"
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
      class="bg-blue-800 text-white p-6 rounded-lg w-full md:w-80 h-64 flex flex-col justify-start items-start relative"
    >
      <p class="text-2xl font-bold">Comunidade</p>
      <p class="text-base text-left">
        Queremos construir uma rede de apoio que valorize o potencial de cada
        estudante, ajudando-os a alcançar seus sonhos e retribuir à sociedade.
      </p>
    </div>
  </div>

  <!-- Team -->
  <div class="container mx-auto mt-28 px-4">
    <h1 class="text-5xl font-medium mb-8 text-left" style="color: #380f45">
      Nossos <br />
      <span class="font-semibold">Integrantes</span>
    </h1>

    <!-- Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-black">
      <div
        class="bg-gray-200 shadow-md rounded-lg p-6 flex flex-col justify-start items-start"
      >
        <img
          src="/images/paula_pic.png"
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
          src="/images/ester_pic.png"
          alt="Ester Borges Frickes"
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
          src="/images/camily_pic.png"
          alt="Camily Carvalho Guimarães"
          class="w-full object-cover"
        />
        <div class="p-6">
          <h3 class="text-xl font-semibold mb-2">Camily Carvalho Guimarães</h3>
          <p class="text-gray-700">Co-Fundadora e Diretora de Tecnologia</p>
          <p class="text-gray-700">Bahia</p>
        </div>
      </div>

      <div
        class="bg-gray-200 shadow-md rounded-lg p-6 flex flex-col justify-start items-start"
      >
        <img
          src="/images/iza_pic.png"
          alt="Izabeli Santos"
          class="w-full object-cover"
        />
        <div class="p-6">
          <h3 class="text-xl font-semibold mb-2">Izabeli Santos</h3>
          <p class="text-gray-700">Co-fundadora e Diretora de Marketing</p>
          <p class="text-gray-700">Bahia</p>
        </div>
      </div>

      <div
        class="bg-gray-200 shadow-md rounded-lg p-6 flex flex-col justify-start items-start"
      >
        <img
          src="/images/joao_pedro_pic.png"
          alt="João Pedro Santos"
          class="w-full object-cover"
        />
        <div class="p-6">
          <h3 class="text-xl font-semibold mb-2">João Pedro Santos</h3>
          <p class="text-gray-700">Co-fundador e Analista de Tecnologia</p>
          <p class="text-gray-700">Bahia</p>
        </div>
      </div>

      <div
        class="bg-gray-200 shadow-md rounded-lg p-6 flex flex-col justify-start items-start"
      >
        <img
          src="/images/vinicius_pic.png"
          alt="Vinícius Castelli"
          class="w-full object-cover"
        />
        <div class="p-6">
          <h3 class="text-xl font-semibold mb-2">Vinícius Castelli</h3>
          <p class="text-gray-700">Co-fundador e Diretora de Expansão</p>
          <p class="text-gray-700">São Paulo</p>
        </div>
      </div>

      <div
        class="bg-gray-200 shadow-md rounded-lg p-6 flex flex-col justify-start items-start"
      >
        <img
          src="/images/renzo_pic.png"
          alt="Renzo Honorato"
          class="w-full object-cover"
        />
        <div class="p-6">
          <h3 class="text-xl font-semibold mb-2">Renzo Honorato</h3>
          <p class="text-gray-700">Co-fundador e Analista de tecnologia</p>
          <p class="text-gray-700">São Paulo</p>
        </div>
      </div>

      <div
        class="bg-gray-200 shadow-md rounded-lg p-6 flex flex-col justify-start items-start"
      >
        <img
          src="/images/ruan_pic.png"
          alt="Ruan Cordeiro"
          class="w-full object-cover"
        />
        <div class="p-6">
          <h3 class="text-xl font-semibold mb-2">Ruan Cordeiro</h3>
          <p class="text-gray-700">Co-fundador e Analista de tecnologia</p>
          <p class="text-gray-700">Rio Grande do Norte</p>
        </div>
      </div>

      <div
        class="bg-gray-200 shadow-md rounded-lg p-6 flex flex-col justify-start items-start"
      >
        <img
          src="/images/alessandra_pic.png"
          alt="Alessandra Sena"
          class="w-full object-cover"
        />
        <div class="p-6">
          <h3 class="text-xl font-semibold mb-2">Alessandra Sena</h3>
          <p class="text-gray-700">Co-fundadora e Analista de tecnologia </p>
          <p class="text-gray-700">Bahia</p>
        </div>
      </div>
    </div>
  </div>
</template>
