<template>
  <nav
    :class="[
      'flex items-center justify-between pt-16 w-full px-6 md:px-[100px] z-50',
      navTextClass,
    ]"
  >
    <!-- Desktop and Mobile Logo -->
    <div class="text-xl font-bold">
      <a href="/">
        <img
          :src="
            transparent
              ? '/images/logo-light-navbar.svg'
              : '/images/logo-dark.svg'
          "
          alt=""
        />
      </a>
    </div>

    <!-- Hamburger Menu for Mobile -->
    <div class="md:hidden flex items-center">
      <button @click="toggleMobileMenu" class="text-2xl focus:outline-none">
        <div>
          <Menu />
        </div>
      </button>
    </div>

    <!-- Desktop Navigation -->
    <ul class="hidden md:flex space-x-8 font-medium">
      <li>
        <a
          href="/"
          :class="transparent ? 'hover:text-gray-200' : 'hover:text-gray-600'"
          >Início</a
        >
      </li>
      <li>
        <a
          href="/sobre"
          :class="transparent ? 'hover:text-gray-200' : 'hover:text-gray-600'"
          >Sobre Nós</a
        >
      </li>
      <li>
        <a
          href="/newsletter"
          :class="transparent ? 'hover:text-gray-200' : 'hover:text-gray-600'"
          >Newsletter</a
        >
      </li>
      <li class="relative group">
        <a
          href="/oportunidades"
          :class="transparent ? 'hover:text-gray-200' : 'hover:text-gray-600'"
          >Oportunidades</a
        >
        <div
          class="absolute left-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible mt-2 w-128 bg-gray-200 rounded-lg p-6 shadow-lg z-10 transition-all duration-300 ease-in-out transform translate-y-2 group-hover:translate-y-0"
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
            href="/oportunidades"
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

    <!-- Desktop Social Media Icons -->
    <Socials class="hidden md:flex" :theme="transparent ? 'dark' : 'light'" />

    <!-- Mobile Menu Overlay -->
    <div
      v-if="isMobileMenuOpen"
      class="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
      @click="toggleMobileMenu"
    ></div>

    <!-- Mobile Menu Slide-out -->
    <div
      :class="[
        'fixed top-0 right-0 w-64 h-full bg-white transform transition-transform duration-300 ease-in-out z-50',
        isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full',
      ]"
    >
      <div class="p-6">
        <button
          @click="toggleMobileMenu"
          class="absolute top-4 right-4 text-2xl focus:outline-none"
        ></button>

        <ul class="space-y-4 mt-12">
          <li><a href="/" class="block text-gray-700">Início</a></li>
          <li>
            <a href="/sobre" class="block text-gray-700">Sobre Nós</a>
          </li>
          <li>
            <a href="/newsletter" class="block text-gray-700">Newsletter</a>
          </li>
          <li>
            <a href="/oportunidades" class="block text-gray-700"
              >Oportunidades</a
            >
          </li>
        </ul>

        <Socials class="mt-4" theme="light" />
      </div>
    </div>
  </nav>
</template>

<script setup>
import { Menu } from "@iconoir/vue";

const props = defineProps({
  transparent: {
    type: Boolean,
    default: false,
  },
});

const isMobileMenuOpen = ref(false);
const navTextClass = computed(() =>
  props.transparent ? "text-white" : "text-gray-800"
);

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};
</script>
