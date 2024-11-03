<template>
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
              <Instagram class="mr-2" /> Instagram
            </a>
            <a href="#" class="text-white flex items-center">
              <Linkedin class="mr-2" /> Linkedin
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
              >{{ link }}</a
            >
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
            <a href="#" class="text-white text-[14px] hover:text-yellow-500">{{
              category
            }}</a>
          </li>
          <li>
            <a
              href="#"
              class="text-white text-[14px] hover:text-yellow-500 font-bold"
              >Veja Tudo</a
            >
          </li>
        </ul>
      </div>
    </div>
  </footer>
</template>
<script setup>
import { Instagram, Linkedin } from "@iconoir/vue";
</script>
