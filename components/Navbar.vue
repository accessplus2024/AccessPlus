<template>
  <nav
    :class="[
      'flex items-center justify-between pt-16 w-full px-6 md:px-[100px] z-50',
      navTextClass,
    ]"
  >
    <!-- Logo -->
    <div class="text-xl font-bold">
      <a href="/">
        <img :src="logoSrc" alt="Access+" />
      </a>
    </div>

    <!-- Hamburger Menu for Mobile -->
    <div class="md:hidden flex items-center gap-2">
      <ThemeToggle />
      <button @click="toggleMobileMenu" class="text-2xl focus:outline-none">
        <Menu />
      </button>
    </div>

    <!-- Desktop Navigation -->
    <ul class="hidden md:flex space-x-8 font-medium">
      <li>
        <a href="/" :class="linkHoverClass">Início</a>
      </li>
      <li>
        <a href="/sobre" :class="linkHoverClass">Sobre Nós</a>
      </li>
      <li class="relative group">
        <a href="/oportunidades" :class="linkHoverClass">Oportunidades</a>
        <div
          class="absolute left-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible mt-2 bg-surface rounded-lg p-6 shadow-lg z-10 transition-all duration-300 ease-in-out transform translate-y-2 group-hover:translate-y-0"
          style="width: 320px"
        >
          <h2 class="font-semibold font-body text-base text-text mb-4">Oportunidades</h2>
          <ul class="space-y-1 font-body text-sm text-text font-light pr-6">
            <li>Olimpíadas Científicas</li>
            <li>Programas Acadêmicos</li>
            <li>Mentorias</li>
            <li>Competições</li>
            <li>Competições de Redação</li>
            <li>Programas de Intercâmbio</li>
            <li>Bolsas</li>
            <li>MUNs</li>
          </ul>
          <a href="/oportunidades" class="block mt-6 text-text font-bold hover:text-primary transition-colors">
            <div class="flex items-center justify-between">
              <span>Veja tudo</span>
              <img src="/images/black-spark.svg" alt="" />
            </div>
          </a>
        </div>
      </li>
      <li>
        <a href="/newsletter" :class="linkHoverClass">Newsletter</a>
      </li>
    </ul>

    <!-- Desktop right: Socials + ThemeToggle -->
    <div class="hidden md:flex items-center gap-2">
      <Socials :theme="transparent ? 'dark' : 'light'" />
      <ThemeToggle />
    </div>

    <!-- Mobile Menu Overlay -->
    <div
      v-if="isMobileMenuOpen"
      class="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
      @click="toggleMobileMenu"
    ></div>

    <!-- Mobile Menu Slide-out -->
    <div
      :class="[
        'fixed top-0 right-0 w-64 h-full bg-bg border-l border-surface transform transition-transform duration-300 ease-in-out z-50',
        isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full',
      ]"
    >
      <div class="p-6">
        <button
          @click="toggleMobileMenu"
          class="absolute top-4 right-4 text-2xl focus:outline-none"
        ></button>
        <ul class="space-y-4 mt-12">
          <li><a href="/" class="block text-text">Início</a></li>
          <li><a href="/sobre" class="block text-text">Sobre Nós</a></li>
          <li><a href="/newsletter" class="block text-text">Newsletter</a></li>
          <li><a href="/oportunidades" class="block text-text">Oportunidades</a></li>
        </ul>
        <Socials class="mt-4" theme="light" />
      </div>
    </div>
  </nav>
</template>

<script setup>
import { Menu } from "@iconoir/vue"

const props = defineProps({
  transparent: {
    type: Boolean,
    default: false,
  },
})

const colorMode = useColorMode()
const isMobileMenuOpen = ref(false)

const isDark = computed(() => colorMode.value === 'dark')

const logoSrc = computed(() =>
  props.transparent || isDark.value
    ? '/images/logo-light-navbar.svg'
    : '/images/logo-dark.svg'
)

const navTextClass = computed(() =>
  props.transparent || isDark.value ? 'text-white' : 'text-text'
)

const linkHoverClass = computed(() =>
  props.transparent || isDark.value ? 'hover:text-gray-200' : 'hover:text-primary'
)

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}
</script>
