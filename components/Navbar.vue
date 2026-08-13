<script setup>
import { Menu, Xmark } from "@iconoir/vue"

const links = [
  { text: "Início", href: "/" },
  { text: "Oportunidades", href: "/oportunidades" },
  { text: "Sobre", href: "/sobre" },
  { text: "Newsletter", href: "/newsletter" },
]

const route = useRoute()
const isActive = (href) =>
  href === "/" ? route.path === "/" : route.path.startsWith(href)

const scrolled = ref(false)
const isMobileMenuOpen = ref(false)

// The opportunity detail page has a full-bleed colored hero behind the nav;
// keep the nav solid there so the dark logo/links stay legible.
const forceSolid = computed(() => route.path.startsWith("/oportunidade/"))
const solid = computed(() => scrolled.value || forceSolid.value)

const onScroll = () => { scrolled.value = window.scrollY > 30 }
onMounted(() => {
  onScroll()
  window.addEventListener("scroll", onScroll, { passive: true })
})
onBeforeUnmount(() => window.removeEventListener("scroll", onScroll))

const toggleMobileMenu = () => { isMobileMenuOpen.value = !isMobileMenuOpen.value }
</script>

<template>
  <header
    class="fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-brand"
    :class="solid
      ? 'bg-paper/85 backdrop-blur-md backdrop-saturate-150 border-b border-ink/10'
      : 'bg-transparent border-b border-transparent'"
  >
    <div class="wrap flex items-center justify-between h-[76px]">
      <!-- Logo -->
      <NuxtLink to="/" class="flex items-center" aria-label="Access+ — início">
        <img src="/images/icons/logo-longo.svg" alt="Access+" class="w-44" />
      </NuxtLink>

      <!-- Desktop nav -->
      <nav class="hidden md:flex items-center gap-[30px]">
        <NuxtLink
          v-for="l in links"
          :key="l.href"
          :to="l.href"
          class="text-[15.5px] font-medium pb-[3px] border-b-2 transition-opacity duration-200"
          :class="isActive(l.href)
            ? 'opacity-100 border-primary'
            : 'opacity-60 hover:opacity-100 border-transparent'"
        >{{ l.text }}</NuxtLink>
      </nav>

      <!-- Desktop CTA -->
      <div class="hidden md:flex items-center gap-4">
        <NuxtLink
          to="/oportunidades"
          class="btn btn-lime"
          style="padding: 11px 20px; font-size: 15px"
        >
          Explorar
        </NuxtLink>
        <UserMenu />
      </div>

      <!-- Mobile hamburger -->
      <button
        class="md:hidden text-ink p-1"
        aria-label="Abrir menu"
        @click="toggleMobileMenu"
      >
        <Menu class="w-7 h-7" />
      </button>
    </div>

    <!-- Mobile overlay -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isMobileMenuOpen"
        class="fixed inset-0 bg-ink/40 z-40 md:hidden"
        @click="toggleMobileMenu"
      ></div>
    </Transition>

    <!-- Mobile drawer -->
    <div
      class="fixed top-0 right-0 w-72 h-full bg-paper z-50 md:hidden shadow-2xl transform transition-transform duration-300 ease-brand"
      :class="isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'"
    >
      <div class="p-6 flex flex-col h-full">
        <button
          class="self-end text-ink p-1 mb-6"
          aria-label="Fechar menu"
          @click="toggleMobileMenu"
        >
          <Xmark class="w-7 h-7" />
        </button>
        <nav class="flex flex-col gap-5">
          <NuxtLink
            v-for="l in links"
            :key="l.href"
            :to="l.href"
            class="text-xl font-display"
            :class="isActive(l.href) ? 'text-primary' : 'text-ink'"
            @click="toggleMobileMenu"
          >{{ l.text }}</NuxtLink>
        </nav>
        <NuxtLink
          to="/oportunidades"
          class="btn btn-lime mt-8"
          @click="toggleMobileMenu"
        >
          Explorar
        </NuxtLink>
        <UserMenu class="mt-6" />
        <Socials class="mt-auto" theme="light" />
      </div>
    </div>
  </header>
</template>
