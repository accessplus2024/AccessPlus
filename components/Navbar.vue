<template>
  <nav
    :class="[
      '',
      transparent
        ? 'flex mb-12 pt-16 w-full justify-between px-[100px]'
        : 'mt-8 max-w-6xl mx-auto flex justify-between items-center py-6 px-6',
    ]"
  >
    <div class="text-xl font-bold">
      <img
        :src="
          transparent
            ? '/images/logo-light-navbar.svg'
            : '/images/logo-dark.svg'
        "
        alt=""
      />
    </div>
    <ul class="flex space-x-8 font-medium">
      <li><a href="/" class="hover:text-gray-200">Início</a></li>
      <li><a href="/sobre" class="hover:text-gray-200">Sobre Nós</a></li>
      <li class="relative group">
        <a href="/oportunidades" class="hover:text-gray-200">Oportunidades</a>
        <!-- Dropdown menu -->
        <div
          class="absolute left-0 hidden group-hover:block mt-2 w-128 bg-gray-200 rounded-lg p-6 shadow-lg z-10"
          style="width: 320px"
        >
          <h2 class="font-semibold font-poppins text-base text-[#383737] mb-4">
            Oportunidades
          </h2>
          <ul
            class="space-y-1 font-poppins text-sm text-[#383737] font-light pr-6"
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
      <a href="#"><Youtube class="hover:text-gray-200" /></a>
      <a href="#"><Instagram class="hover:text-gray-200" /></a>
      <a href="#"><Linkedin class="hover:text-gray-200" /></a>
    </div>
  </nav>
</template>

<script setup>
import { Youtube, Instagram, Linkedin } from "@iconoir/vue";
defineProps(["transparent"]);
</script>
