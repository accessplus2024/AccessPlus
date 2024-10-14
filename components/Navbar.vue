<template>
  <nav class="flex justify-between w-full mb-12 px-[100px]">
    <div class="text-xl font-bold">
      <img src="/images/logo-light-footer.svg" alt="" />
    </div>
    <ul class="flex space-x-8 font-medium">
      <li><a href="#" class="hover:text-gray-200">Início</a></li>
      <li><a href="#" class="hover:text-gray-200">Sobre Nós</a></li>
      <li class="relative group">
        <a href="#" class="hover:text-gray-200">Oportunidades</a>
        <!-- Dropdown menu -->
        <div
          class="absolute left-0 hidden group-hover:block mt-2 w-128 bg-gray-200 rounded-lg p-6 shadow-lg z-10"
          style="width: 320px"
        >
          <h2
            class="font-semibold text-[#383737] mb-4"
            style="font-family: Poppins; font-size: 20px"
          >
            Oportunidades
          </h2>
          <ul
            class="space-y-1 text-[#383737] font-light pr-6"
            style="font-family: Poppins; font-size: 15px"
          >
            <li>Olimpíadas Científicas</li>
            <li>Programas Acadêmicos</li>
            <li>Mentorias</li>
            <li>Competições</li>
            <li>Competições de Redação</li>
            <li>Programas de Intercâmbio</li>
            <li>Bolsas</li>
            <li>MUNs</li>
          </ul>
          <a
            href="#"
            class="block mt-6 text-[#383737] font-bold hover:text-gray-700"
          >
            <div class="flex items-center justify-between">
              <span>Veja tudo</span>
              <img src="/images/black-spark.svg" alt="" />
            </div>
          </a>
        </div>
      </li>
    </ul>
    <div class="flex space-x-4">
      <a href="#"><i class="fab fa-youtube hover:text-gray-200"></i></a>
      <a href="#"><i class="fab fa-instagram hover:text-gray-200"></i></a>
      <a href="#"><i class="fab fa-linkedin hover:text-gray-200"></i></a>
    </div>
  </nav>
</template>
