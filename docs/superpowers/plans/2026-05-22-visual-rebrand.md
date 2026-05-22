# Visual Rebrand Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand the entire Access+ website to the new brand guidelines: 7 brand color tokens, FuturaStd/Poppins typography, and a user-controllable dark/light theme that defaults to system preference.

**Architecture:** CSS custom properties define all color tokens in `:root` (light) and `.dark` (dark). Tailwind consumes them via `var(--color-*)` references. `@nuxtjs/color-mode` manages the `dark` class on `<html>` and persists user preference. No `dark:` class sprawl — components use semantic token classes like `bg-bg`, `text-text`, `bg-primary`.

**Tech Stack:** Nuxt 3, Tailwind CSS, `@nuxtjs/color-mode`, `@nuxt/fonts` (Poppins via Google), FuturaStdExtraBold (local OTF), `@iconoir/vue`

---

## File Map

**New files:**
- `components/ThemeToggle.vue`
- `public/fonts/FuturaStdExtraBold.otf` (moved from `assets/`)

**Modified files:**
- `nuxt.config.ts` — add `@nuxtjs/color-mode` module + `colorMode` config + Poppins font config
- `assets/css/main.css` — `@font-face` for FuturaStd + CSS custom property tokens
- `tailwind.config.js` — dark mode class, brand color tokens, display/body fonts
- `app.vue` — body background token
- `components/Navbar.vue` — logo swap with colorMode, ThemeToggle, dark-aware text/menu
- `components/Footer.vue` — brand tokens replace hardcoded purple
- `layouts/default.vue` — page background token
- `components/OpportunityCard.vue` — token classes, brand accent keyword colors
- `components/Pagination.vue` — brand token classes
- `components/SearchInput.vue` — token classes
- `components/FilterGroup.vue` — token classes
- `components/FiltersSidebar.vue` — token classes
- `components/home/Header.vue` — bg-primary hero, font-display, accent-green CTA
- `components/home/CategoryButton.vue` — surface token
- `components/home/FeaturesSection.vue` — token classes
- `components/home/AboutSection.vue` — token classes, accent-green CTA
- `components/home/AwardsSection.vue` — accent-pink instead of red-400
- `components/home/NewsSection.vue` — token classes
- `components/home/OpportunitiesSection.vue` — token classes, accent-green CTA
- `components/sobre/HeaderSection.vue` — bg-primary hero
- `components/sobre/TeamMemberCard.vue` — surface token
- `components/sobre/ValuesGrid.vue` — brand accent bgClass values
- `components/opportunity/HeroSection.vue` — bg-primary gradient, accent-green CTA
- `components/opportunity/StatsBanner.vue` — brand tokens
- `components/opportunity/TabNavigation.vue` — brand primary for active tab
- `components/opportunity/InfoCards.vue` — brand tokens
- `components/opportunity/ContentDisplay.vue` — surface token
- `components/newsletter/HeaderSection.vue` — bg-accent-pink hero
- `components/newsletter/Cta.vue` — bg-primary gradient
- `components/NewsletterCard.vue` — brand tokens
- `pages/newsletter/index.vue` — brand tokens
- `pages/newsletter/[id].vue` — brand tokens + newsletter-content CSS vars

---

## Task 1: Install deps, move font, update nuxt.config.ts

**Files:**
- Run: `npm install @nuxtjs/color-mode`
- Move: `assets/FuturaStdExtraBold.otf` → `public/fonts/FuturaStdExtraBold.otf`
- Modify: `nuxt.config.ts`

- [ ] **Step 1: Install @nuxtjs/color-mode**

```bash
npm install @nuxtjs/color-mode
```

Expected output: package added to `node_modules`, `package.json` updated.

- [ ] **Step 2: Move font file to public/**

```bash
mkdir -p public/fonts
mv assets/FuturaStdExtraBold.otf public/fonts/FuturaStdExtraBold.otf
```

- [ ] **Step 3: Update nuxt.config.ts**

Replace the entire file with:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: { compatibilityDate: "2024-04-03" },
  devtools: { enabled: true },
  css: ["~/assets/css/main.css"],

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  modules: ["@nuxt/fonts", "@nuxtjs/color-mode"],

  fonts: {
    families: [{ name: "Poppins", weights: [300] }],
  },

  colorMode: {
    preference: "system",
    fallback: "light",
    classSuffix: "",
    storageKey: "nuxt-color-mode",
  },

  plugins: [
    { src: "~/plugins/vercel-analytics.client.ts", mode: "client" },
    { src: "~/plugins/google-analytics.ts", mode: "client" },
  ],

  runtimeConfig: {
    beehiivApiKey: process.env.BEEHIV_API_KEY,
    public: {
      beehiivPublicationId: process.env.BEEHIV_PUBLICATION_ID,
    },
  },

  compatibilityDate: "2025-05-09",
});
```

- [ ] **Step 4: Verify dev server starts**

```bash
npm run dev
```

Expected: dev server starts at http://localhost:3000 without errors.

- [ ] **Step 5: Commit**

```bash
git add nuxt.config.ts public/fonts/FuturaStdExtraBold.otf package.json package-lock.json
git commit -m "chore: install color-mode, move Futura font to public/fonts"
```

---

## Task 2: CSS tokens + Tailwind config + app.vue

**Files:**
- Modify: `assets/css/main.css`
- Modify: `tailwind.config.js`
- Modify: `app.vue`

- [ ] **Step 1: Replace assets/css/main.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@font-face {
  font-family: 'FuturaStd';
  src: url('/fonts/FuturaStdExtraBold.otf') format('opentype');
  font-weight: 800;
  font-style: normal;
  font-display: swap;
}

:root {
  --color-primary: #4B3FE4;
  --color-bg: #FFFFFF;
  --color-surface: #F5F5F5;
  --color-text: #0D0B1A;
  --color-accent-red: #FF4422;
  --color-accent-green: #C8F135;
  --color-accent-pink: #FF2D8A;
  --color-accent-cyan: #7DECE9;
}

.dark {
  --color-primary: #6B5FFF;
  --color-bg: #0D0B1A;
  --color-surface: #1A1633;
  --color-text: #FFFFFF;
}
```

- [ ] **Step 2: Replace tailwind.config.js**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./error.vue",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        text: "var(--color-text)",
        "accent-red": "var(--color-accent-red)",
        "accent-green": "var(--color-accent-green)",
        "accent-pink": "var(--color-accent-pink)",
        "accent-cyan": "var(--color-accent-cyan)",
      },
      fontFamily: {
        sans: ["Poppins", "sans-serif"],
        display: ["FuturaStd", "sans-serif"],
        body: ["Poppins", "sans-serif"],
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 3: Update app.vue body background**

Replace the `<style>` block:

```vue
<template>
  <IconoirProvider>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </IconoirProvider>
</template>

<script setup>
import { IconoirProvider } from '@iconoir/vue';
useHead({
  titleTemplate: (title) => {
    return title ? `${title} - Access+` : "Access+";
  },
});
</script>

<style lang="postcss">
body {
  @apply bg-bg text-text;
}
</style>
```

- [ ] **Step 4: Verify in browser**

```bash
npm run dev
```

Open http://localhost:3000. Check: page background is white in light mode. Open devtools, add `class="dark"` to `<html>` — background should turn `#0D0B1A` (near-black navy). Headings should render in FuturaStd (bold, geometric).

- [ ] **Step 5: Commit**

```bash
git add assets/css/main.css tailwind.config.js app.vue
git commit -m "feat: add brand color tokens, FuturaStd font, dark mode CSS foundation"
```

---

## Task 3: ThemeToggle component

**Files:**
- Create: `components/ThemeToggle.vue`

- [ ] **Step 1: Create ThemeToggle.vue**

```vue
<template>
  <button
    @click="cycleMode"
    class="p-2 rounded-full hover:bg-white/10 transition-colors"
    :title="modeLabel"
  >
    <Sun v-if="colorMode.value !== 'dark'" class="w-5 h-5" />
    <HalfMoon v-else class="w-5 h-5" />
  </button>
</template>

<script setup>
import { Sun, HalfMoon } from '@iconoir/vue'

const colorMode = useColorMode()
const modes = ['system', 'light', 'dark']
const modeLabels = { system: 'Tema do sistema', light: 'Tema claro', dark: 'Tema escuro' }
const modeLabel = computed(() => modeLabels[colorMode.preference] || 'Tema do sistema')

const cycleMode = () => {
  const current = modes.indexOf(colorMode.preference)
  colorMode.preference = modes[(current + 1) % modes.length]
}
</script>
```

- [ ] **Step 2: Commit**

```bash
git add components/ThemeToggle.vue
git commit -m "feat: add ThemeToggle component with system/light/dark cycling"
```

---

## Task 4: Navbar

**Files:**
- Modify: `components/Navbar.vue`

- [ ] **Step 1: Replace Navbar.vue**

```vue
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
    ? '/images/logo-light.svg'
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
```

- [ ] **Step 2: Verify in browser**

Open http://localhost:3000. Click the ThemeToggle button in the navbar. Confirm: dark mode activates (dark navy background), logo swaps (check devtools `<img src>` attribute changes). Mobile hamburger menu should show on narrow viewport.

- [ ] **Step 3: Commit**

```bash
git add components/Navbar.vue
git commit -m "feat: update Navbar with ThemeToggle and dark-mode-aware logo swap"
```

---

## Task 5: Footer + layout

**Files:**
- Modify: `components/Footer.vue`
- Modify: `layouts/default.vue`

- [ ] **Step 1: Replace Footer.vue**

```vue
<template>
  <footer class="bg-primary py-10 rounded-t-3xl">
    <div class="max-w-5xl mx-auto px-4 sm:px-[60px] flex flex-col sm:flex-row justify-between items-start">
      <div class="flex flex-col items-start">
        <div class="flex flex-1 w-full h-full">
          <img src="/images/logo-light.svg" class="mt-7" alt="Access+" />
        </div>
        <div class="text-white flex items-start sm:items-center w-full mt-4 sm:mt-6">
          <span class="text-sm mr-3 sm:text-base font-body">Siga nossas redes sociais:</span>
          <Socials theme="dark" />
        </div>
      </div>
      <div class="text-white text-left mt-8 sm:mt-0">
        <h2 class="text-[24px] font-display font-bold mb-2">Navegação</h2>
        <div class="flex flex-col">
          <ul class="flex flex-col space-y-1">
            <li
              v-for="(link, index) in [
                { text: 'Início', href: '/' },
                { text: 'Sobre nós', href: '/sobre' },
                { text: 'Oportunidades', href: '/oportunidades' },
                { text: 'Newsletter', href: '/newsletter' },
              ]"
              :key="index"
            >
              <a
                :href="link.href"
                class="text-white text-[14px] hover:text-accent-cyan font-body font-bold transition-colors duration-300 ease-in-out"
              >
                {{ link.text }}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </footer>
</template>
```

- [ ] **Step 2: Replace layouts/default.vue**

```vue
<template>
  <div class="relative overflow-x-hidden bg-bg text-text min-h-screen">
    <div class="absolute top-0 left-0 w-full z-30">
      <Navbar transparent />
    </div>
    <slot></slot>
    <Footer />
  </div>
</template>
```

- [ ] **Step 3: Commit**

```bash
git add components/Footer.vue layouts/default.vue
git commit -m "feat: rebrand Footer and layout with brand tokens"
```

---

## Task 6: Shared opportunity components

**Files:**
- Modify: `components/OpportunityCard.vue`
- Modify: `components/Pagination.vue`
- Modify: `components/SearchInput.vue`

- [ ] **Step 1: Replace OpportunityCard.vue**

```vue
<script setup>
const props = defineProps({
  opportunity: {
    type: Object,
    required: true,
  },
  getKeywordColor: {
    type: Function,
    required: true,
  },
})
</script>

<template>
  <div class="bg-surface rounded-xl overflow-hidden border border-text/10 hover:shadow-lg transition-shadow duration-300">
    <img
      :src="opportunity.image || 'https://placehold.co/400x200'"
      class="w-full h-48 object-cover"
      alt="Opportunity image"
    />
    <div class="p-6">
      <div class="flex flex-wrap gap-2 mb-4 text-xs">
        <span
          v-for="(keyword, keywordIndex) in opportunity.keywords"
          :key="keywordIndex"
          :style="{ backgroundColor: getKeywordColor(keywordIndex) }"
          class="text-white px-3 py-1 rounded-full font-body"
          style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis"
        >
          {{ keyword }}
        </span>
      </div>
      <h3 class="text-lg font-display font-bold text-text mb-2">
        {{ opportunity.Nome }}
      </h3>
      <p class="text-sm text-text/70 font-body mb-4">
        {{ opportunity.description }}
      </p>
      <NuxtLink
        :to="`/oportunidade/${opportunity.id}`"
        class="text-primary font-semibold hover:text-primary/80 font-body"
      >
        Veja mais
      </NuxtLink>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Update pages/oportunidades.vue getKeywordColor + mobile filter button**

In `pages/oportunidades.vue`, replace the `getKeywordColor` function:

```js
const getKeywordColor = (index) => {
  const colors = [
    "var(--color-accent-pink)",
    "var(--color-accent-green)",
    "var(--color-accent-cyan)",
  ]
  return colors[index % colors.length]
}
```

Also in `pages/oportunidades.vue`, find the mobile filter button and replace its class:

```html
<button
  @click="showMobileFilters = true"
  class="relative w-full md:hidden flex justify-center items-center bg-surface text-text/60 px-4 py-2 rounded-lg hover:bg-primary/10 transition-colors"
>
```

Update the keyword `<span>` in `OpportunityCard.vue` so green (#C8F135) and cyan (#7DECE9) — both light colors — get dark text:

```vue
<span
  v-for="(keyword, keywordIndex) in opportunity.keywords"
  :key="keywordIndex"
  :style="{
    backgroundColor: getKeywordColor(keywordIndex),
    color: keywordIndex % 3 === 0 ? 'white' : '#0D0B1A',
  }"
  class="px-3 py-1 rounded-full font-body text-xs"
  style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis"
>
  {{ keyword }}
</span>
```

(Index 0 = accent-pink, dark enough for white. Indices 1 and 2 = accent-green and accent-cyan, both light — need dark text.)

- [ ] **Step 3: Replace Pagination.vue**

```vue
<script setup>
const props = defineProps({
  currentPage: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  displayedPages: { type: Array, required: true },
})

const emit = defineEmits(["update-page"])
const changePage = (page) => emit("update-page", page)
</script>

<template>
  <div class="mt-8 flex flex-wrap justify-center gap-2">
    <button
      @click="changePage(currentPage - 1)"
      :disabled="currentPage === 1"
      class="px-4 py-2 rounded-lg bg-primary text-white disabled:opacity-40 font-body"
    >
      Anterior
    </button>
    <div class="flex flex-wrap items-center gap-2">
      <button
        v-for="page in displayedPages"
        :key="page"
        @click="changePage(page)"
        :class="{
          'bg-primary text-white': currentPage === page,
          'bg-surface text-text': currentPage !== page,
        }"
        class="px-4 py-2 rounded-lg text-sm sm:text-base font-body"
      >
        {{ page }}
      </button>
    </div>
    <button
      @click="changePage(currentPage + 1)"
      :disabled="currentPage === totalPages"
      class="px-4 py-2 rounded-lg bg-primary text-white disabled:opacity-40 font-body"
    >
      Próxima
    </button>
  </div>
</template>
```

- [ ] **Step 4: Replace SearchInput.vue**

```vue
<script setup>
import { Search } from "@iconoir/vue"

const props = defineProps({
  searchTerm: { type: String, default: "" },
})

const emit = defineEmits(["update:searchTerm"])
const updateSearchTerm = (event) => emit("update:searchTerm", event.target.value)
</script>

<template>
  <div class="relative w-full sm:w-auto flex-grow">
    <input
      type="text"
      :value="searchTerm"
      @input="updateSearchTerm"
      placeholder="Buscar"
      class="w-full text-text bg-surface font-body font-light p-4 rounded-lg border border-text/20 pr-12 focus:outline-none focus:border-primary transition-colors"
    />
    <button class="absolute top-1/2 right-4 transform -translate-y-1/2 text-text/50 hover:text-primary transition-colors duration-300">
      <Search class="w-6 h-6" />
    </button>
  </div>
</template>
```

- [ ] **Step 5: Commit**

```bash
git add components/OpportunityCard.vue components/Pagination.vue components/SearchInput.vue pages/oportunidades.vue
git commit -m "feat: rebrand opportunity card, pagination, search with brand tokens"
```

---

## Task 7: Filter components

**Files:**
- Modify: `components/FilterGroup.vue`
- Modify: `components/FiltersSidebar.vue`

- [ ] **Step 1: Replace FilterGroup.vue**

```vue
<script setup>
const props = defineProps({
  title: String,
  filters: Array,
  selectedFilters: Object,
  displayNames: Object,
  filterType: String,
})

const emit = defineEmits(["toggle-filter"])
const toggleFilter = (filter) => emit("toggle-filter", filter, props.filterType)
</script>

<template>
  <div class="mb-6">
    <template v-if="title !== 'Palavras-chave'">
      <hr class="border-t border-text/10 mb-4" />
    </template>
    <h3 class="text-lg font-display font-bold mb-2 text-text">{{ title }}</h3>
    <div class="space-y-2">
      <label
        v-for="filter in filters"
        :key="filter"
        class="flex items-center cursor-pointer"
      >
        <input
          type="checkbox"
          :checked="selectedFilters.has(filter)"
          @change="toggleFilter(filter)"
          class="form-checkbox h-4 w-4 mr-2 accent-primary"
        />
        <span class="text-text/80 font-body">{{ displayNames[filter] || filter }}</span>
      </label>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Update MobileFilters.vue**

`MobileFilters.vue` is the mobile overlay version of FiltersSidebar. Apply the same token replacements:
- Overlay bg: find `class="fixed inset-0 bg-black bg-opacity-50 z-40"` — keep (overlay stays dark)
- Panel bg: find any `bg-white` in the slide-out panel → `bg-bg`
- Panel heading: `text-black` → `text-text`, add `font-display font-bold`
- All `FilterGroup` components are already updated — no changes needed there

Open `components/MobileFilters.vue`, find the slide-out panel `<div>` class containing `bg-white` and replace with `bg-bg border-l border-surface`. Add `font-display font-bold` to the "Filtros" heading and a close button using `text-text`.

- [ ] **Step 3: Replace FiltersSidebar.vue**

```vue
<script setup>
import FilterGroup from "./FilterGroup.vue"

const props = defineProps({
  typeFilters: Array,
  openFilters: Array,
  levelFilters: Array,
  audienceFilters: Array,
  tuitionFilters: Array,
  fieldFilters: Array,
  selectedTypeFilters: Object,
  selectedStatusFilters: Object,
  selectedLevelFilters: Object,
  selectedAudienceFilters: Object,
  selectedTuitionFilters: Object,
  selectedFieldFilters: Object,
  typeDisplayNames: Object,
  statusDisplayNames: Object,
})

const emit = defineEmits(["toggle-filter"])
const toggleFilter = (filter, filterType) => emit("toggle-filter", filter, filterType)
</script>

<template>
  <aside
    class="hidden md:block w-1/4 bg-surface text-text p-6 rounded-lg h-fit sticky top-4"
    style="min-width: 300px"
  >
    <h2 class="text-xl font-display font-bold text-text mb-3">Filtros</h2>

    <FilterGroup title="Tipo" :filters="typeFilters" :selected-filters="selectedTypeFilters"
      :display-names="typeDisplayNames" filter-type="type" @toggle-filter="toggleFilter" />
    <FilterGroup title="Inscrições abertas" :filters="openFilters" :selected-filters="selectedStatusFilters"
      :display-names="statusDisplayNames" filter-type="status" @toggle-filter="toggleFilter" />
    <FilterGroup title="Nível" :filters="levelFilters" :selected-filters="selectedLevelFilters"
      :display-names="{}" filter-type="level" @toggle-filter="toggleFilter" />
    <FilterGroup title="Público Alvo" :filters="audienceFilters" :selected-filters="selectedAudienceFilters"
      :display-names="{}" filter-type="audience" @toggle-filter="toggleFilter" />
    <FilterGroup title="Custo" :filters="tuitionFilters" :selected-filters="selectedTuitionFilters"
      :display-names="{}" filter-type="tuition" @toggle-filter="toggleFilter" />
    <FilterGroup title="Interesse" :filters="fieldFilters" :selected-filters="selectedFieldFilters"
      :display-names="{}" filter-type="field" @toggle-filter="toggleFilter" />
  </aside>
</template>
```

- [ ] **Step 3: Commit**

```bash
git add components/FilterGroup.vue components/FiltersSidebar.vue
git commit -m "feat: rebrand filter components with brand tokens"
```

---

## Task 8: Home components

**Files:**
- Modify: `components/home/Header.vue`
- Modify: `components/home/CategoryButton.vue`
- Modify: `components/home/FeaturesSection.vue`
- Modify: `components/home/AboutSection.vue`
- Modify: `components/home/AwardsSection.vue`
- Modify: `components/home/NewsSection.vue`
- Modify: `components/home/OpportunitiesSection.vue`

- [ ] **Step 1: Replace components/home/Header.vue**

```vue
<script setup>
import { onMounted } from "vue"
import { gsap } from "gsap"

onMounted(() => {
  gsap.from("header h1", { duration: 1.5, y: -50, opacity: 0, ease: "power3.out" })
  gsap.from("header p", { duration: 1.5, y: 50, opacity: 0, ease: "power3.out", delay: 0.5 })
  gsap.from("header a", { duration: 1.5, y: 50, opacity: 0, ease: "power3.out", delay: 1 })
})
</script>

<template>
  <header
    class="relative bg-primary pt-32 pb-16 rounded-b-lg bg-cover bg-center"
    style="background-image: url('/images/Fundo.png')"
  >
    <div class="container mx-auto px-6 flex flex-col items-center">
      <div class="md:text-left text-center flex flex-col items-center md:items-start w-full max-w-4xl">
        <h1 class="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-none text-white">
          Procurando <br />
          <span class="block">por oportunidades?</span>
        </h1>
        <p class="font-body text-base sm:text-lg mb-6 max-w-md text-white/90">
          Access+ é a maior plataforma gratuita do país focada em trazer
          oportunidades educacionais atualizadas para jovens.
        </p>
        <a
          href="/oportunidades"
          class="font-body bg-accent-green text-[#0D0B1A] px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
        >Ver tudo</a>
      </div>
    </div>
  </header>
</template>
```

- [ ] **Step 2: Replace components/home/CategoryButton.vue**

```vue
<script setup>
defineProps({
  category: { type: String, required: true },
  icon: { type: String, required: true },
})
</script>

<template>
  <div class="bg-surface rounded-lg flex items-center justify-start p-3 md:p-6 border border-text/10 hover:border-primary transition-colors duration-200">
    <div class="flex items-center">
      <img :src="`./images/i-${icon}.svg`" alt="" class="w-8 h-8" />
    </div>
    <div class="w-px h-8 bg-text/20 mx-4"></div>
    <span class="font-body text-sm font-medium text-text">{{ category }}</span>
  </div>
</template>
```

- [ ] **Step 3: Replace components/home/FeaturesSection.vue**

```vue
<script setup>
import { onMounted } from 'vue'
import { gsap } from 'gsap'

onMounted(() => {
  gsap.from('.card', {
    duration: 1, y: 50, opacity: 0, stagger: 0.2, ease: 'power3.out', delay: 1.5,
  })
})
</script>

<template>
  <div class="text-center mt-12">
    <h1 class="font-display text-2xl sm:text-3xl md:text-4xl font-bold flex flex-col gap-4 justify-center items-center text-text mb-8">
      O que você pode encontrar no &nbsp;<img src="/images/logo-dark.svg" class="h-8 sm:h-10 md:h-12" />
    </h1>
    <div class="flex flex-wrap justify-center gap-6 px-4">
      <div
        class="card bg-cover bg-bottom md:bg-center text-white p-6 rounded-lg w-1/2 sm:w-64 h-48 flex flex-col justify-start items-start relative"
        style="background-image: url('/images/oportunidades.png')">
        <p class="font-display text-2xl font-bold">+170</p>
        <p class="font-body text-lg text-left">oportunidades educacionais</p>
      </div>
      <div
        data-aos-delay="200"
        class="card bg-cover bg-bottom md:bg-center text-white p-6 rounded-lg w-1/2 sm:w-64 h-48 flex flex-col justify-start items-start relative"
        style="background-image: url('/images/Guias.png')">
        <p class="font-display text-2xl font-bold">Guias</p>
        <p class="font-body text-lg text-left">e informações atualizadas</p>
      </div>
      <div
        data-aos-delay="400"
        class="card bg-cover bg-bottom md:bg-center text-white p-6 rounded-lg w-1/2 mx-auto sm:mx-0 sm:w-64 h-48 flex flex-col justify-start items-start relative"
        style="background-image: url('/images/Dicas.png')">
        <p class="font-display text-2xl font-bold">Dicas</p>
        <p class="font-body text-lg text-left">de premiados das mais diversas áreas</p>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 4: Replace components/home/AboutSection.vue**

```vue
<template>
  <section
    data-aos="fade-up"
    class="bg-surface bg-cover bg-center mx-auto my-16 px-6 p-8 rounded-lg shadow-md max-w-6xl"
    style="background-image: url('/images/bg-about.png')">
    <div class="flex flex-col lg:flex-row items-center justify-between">
      <div class="flex-1">
        <h2 class="font-display text-3xl sm:text-4xl md:text-5xl font-bold leading-tight pl-6 lg:pl-24 text-text">
          Sobre nós
        </h2>
      </div>
      <div class="flex-1 text-left mt-8 lg:mt-0">
        <p class="font-body text-base text-text/80 mb-6 px-6 lg:px-0">
          O time do Access+ é formado por pessoas comprometidas com a
          democratização do acesso à educação no Brasil. Cada membro traz uma
          combinação única de experiências, habilidades e paixões que
          impulsionam nosso objetivo de criar um futuro mais justo e igualitário
          para os estudantes de baixa renda.
        </p>
        <a
          href="/sobre"
          class="inline-block bg-accent-green text-[#0D0B1A] px-6 py-3 rounded-lg font-body font-semibold hover:opacity-90 transition-opacity mx-6 lg:mx-0"
        >Ver tudo</a>
      </div>
    </div>
  </section>
</template>
```

- [ ] **Step 5: Replace components/home/AwardsSection.vue**

```vue
<template>
  <section
    data-aos="fade-up"
    class="bg-accent-pink py-10 rounded-xl max-w-5xl mx-auto font-body mb-12"
  >
    <div class="px-6 md:px-12 lg:px-24">
      <h2 class="font-display text-white mb-4 text-center text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
        Top 15 e Representante do Brasil
      </h2>
      <p class="font-body text-white mb-8 text-justify text-base sm:text-lg md:text-xl font-light leading-relaxed">
        Participar do BeChangemaker nos permitiu aprimorar nosso projeto com o
        suporte de especialistas globais, desenvolver estratégias de impacto e
        fortalecer nossa visão de criar uma plataforma que transforme vidas. Foi
        um marco importante na nossa jornada, nos conectando com outras
        iniciativas inovadoras ao redor do mundo e nos inspirando a continuar
        expandindo nossos horizontes.
      </p>
      <div class="flex flex-wrap justify-center space-x-1">
        <img src="/images/BeChangemaker_logo.svg" alt="BeChangeMaker Logo" class="w-24 md:w-32 lg:w-48 h-auto m-2" />
        <img src="/images/Worldskills_logo.png" alt="WorldSkills Logo" class="w-24 md:w-32 lg:w-48 h-auto m-2" />
        <img src="/images/HP_Foundation.svg" alt="HP Foundation Logo" class="w-24 md:w-32 lg:w-48 h-auto m-2" />
        <img src="/images/UNESCO_UNEVOC.svg" alt="UNESCO Logo" class="w-24 md:w-32 lg:w-48 h-auto m-2" />
      </div>
    </div>
  </section>
</template>
```

- [ ] **Step 6: Replace components/home/NewsSection.vue**

```vue
<template>
  <section class="bg-surface py-16">
    <div class="container mx-auto px-6 max-w-6xl">
      <h2 class="font-display text-3xl font-bold text-left text-text mb-12 pl-6">
        <span class="font-bold">Novidades </span>
        <span class="font-body font-light">do Mês</span>
      </h2>
      <div class="flex justify-center">
        <iframe
          style="border-radius: 12px"
          src="https://open.spotify.com/embed/episode/2P4P0YWP6cHk2o3frRVCCw/video?utm_source=generator"
          width="100%"
          height="351"
          frameBorder="0"
          allowfullscreen=""
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy">
        </iframe>
      </div>
    </div>
  </section>
</template>
```

- [ ] **Step 7: Replace components/home/OpportunitiesSection.vue**

```vue
<script setup>
import CategoryButton from "./CategoryButton.vue"
</script>

<template>
  <section
    class="bg-bg pb-12 md:pt-4 bg-cover bg-no-repeat bg-center overflow-hidden"
    style="background-image: url('/images/Estrelas 1.png')"
  >
    <div class="container mx-auto px-4 md:px-6 max-w-4xl text-center overflow-x-hidden">
      <h3 class="font-body text-lg text-text/60 mb-3 md:mb-4 uppercase tracking-widest">
        OPORTUNIDADES
      </h3>
      <h2 class="font-display text-2xl md:text-3xl font-bold text-text mb-6 md:mb-8">
        Confira nossas categorias
      </h2>
      <div class="grid gap-3 md:gap-4 mb-8 md:mb-9 grid-cols-1 sm:grid-cols-2">
        <CategoryButton category="Mentorias" icon="mentorship" />
        <CategoryButton category="Bolsas de Estudo" icon="scholarship" />
        <CategoryButton category="Olimpíadas Científicas" icon="olympiads" />
        <CategoryButton category="MUNs" icon="mun" />
        <CategoryButton category="Programas Acadêmicos" icon="academic_programs" />
        <CategoryButton category="Competições" icon="competitions" />
        <CategoryButton category="Intercâmbios" icon="exchanges" />
        <CategoryButton category="Competições de Escrita" icon="writing_comp" />
      </div>
      <a
        href="/oportunidades"
        class="inline-block bg-accent-green text-[#0D0B1A] px-5 py-2.5 md:px-6 md:py-3 rounded-lg font-body font-semibold hover:opacity-90 transition-opacity"
      >Ver tudo</a>
    </div>
  </section>
</template>
```

- [ ] **Step 8: Verify home page in browser**

Open http://localhost:3000. Check:
- Hero has `bg-primary` (blue-purple) not purple-to-pink gradient
- CTA buttons are lime green (`#C8F135`) with dark text
- Category buttons use `bg-surface` (light gray in light mode, dark in dark mode)
- Toggle dark mode: all sections switch themes

- [ ] **Step 9: Commit**

```bash
git add components/home/
git commit -m "feat: rebrand all home page components with brand tokens"
```

---

## Task 9: Sobre components

**Files:**
- Modify: `components/sobre/HeaderSection.vue`
- Modify: `components/sobre/TeamMemberCard.vue`
- Modify: `components/sobre/ValuesGrid.vue`

- [ ] **Step 1: Replace components/sobre/HeaderSection.vue**

```vue
<template>
  <header
    class="relative bg-primary pt-24 pb-16 rounded-b-lg bg-cover bg-center"
    style="background-image: url('/images/stanford.svg')"
  >
    <div
      class="absolute inset-0 bg-[#53366470]"
      style="z-index: 0; pointer-events: none"
    ></div>
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center relative z-10">
      <div class="text-center w-full max-w-4xl my-12 md:my-24 header-content">
        <h1
          class="font-display text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold mb-4 leading-none text-white"
          data-aos="fade-up"
        >
          <slot>Sobre nós</slot>
        </h1>
      </div>
    </div>
  </header>
</template>

<script setup>
import Navbar from "../Navbar.vue"
</script>
```

- [ ] **Step 2: Replace components/sobre/TeamMemberCard.vue**

```vue
<template>
  <div class="bg-surface shadow-md rounded-lg p-6 flex flex-col justify-start items-start team-member hover:border-accent-cyan border border-transparent transition-colors duration-300">
    <img :src="image" :alt="name" class="w-full h-48 object-cover rounded-lg" />
    <div class="p-4">
      <h3 class="font-display text-xl font-bold mb-2 text-text">{{ name }}</h3>
      <p class="font-body text-text/70">{{ role }}</p>
      <p class="font-body text-text/70">{{ location }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  name: String,
  role: String,
  location: String,
  image: String,
})
</script>
```

- [ ] **Step 3: Replace components/sobre/ValuesGrid.vue**

```vue
<template>
  <div class="container mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex flex-col md:flex-row justify-center gap-6">
      <ValuesCard title="Inclusão" bgClass="bg-accent-pink">
        Acreditamos que todos os jovens devem ter as mesmas oportunidades de crescer e se desenvolver, independentemente de sua origem ou condição financeira.
      </ValuesCard>
      <ValuesCard title="Inovação" bgClass="bg-primary" :aosDelay="200">
        Através de ferramentas tecnológicas e uma abordagem moderna, nossa plataforma oferece uma maneira nova e eficaz de conectar estudantes com oportunidades educacionais.
      </ValuesCard>
      <ValuesCard title="Comunidade" bgClass="bg-[#0D0B1A]" :aosDelay="400">
        Queremos construir uma rede de apoio que valorize o potencial de cada estudante, ajudando-os a alcançar seus sonhos e retribuir à sociedade.
      </ValuesCard>
    </div>
  </div>
</template>

<script setup>
import ValuesCard from './ValuesCard.vue'
</script>
```

- [ ] **Step 4: Update ValuesCard.vue font classes**

In `components/sobre/ValuesCard.vue`, add font classes:

```vue
<template>
  <div :class="bgClass + ' text-white p-6 rounded-lg w-full md:w-80 h-64 flex flex-col justify-start items-start'" data-aos="fade-up" :data-aos-delay="aosDelay">
    <p class="font-display text-2xl font-bold">{{ title }}</p>
    <p class="font-body text-base text-left">
      <slot />
    </p>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  bgClass: String,
  aosDelay: { type: [Number, String], default: 0 }
})
</script>
```

- [ ] **Step 5: Commit**

```bash
git add components/sobre/
git commit -m "feat: rebrand sobre page components with brand tokens"
```

---

## Task 10: Opportunity detail components

**Files:**
- Modify: `components/opportunity/HeroSection.vue`
- Modify: `components/opportunity/StatsBanner.vue`
- Modify: `components/opportunity/TabNavigation.vue`
- Modify: `components/opportunity/InfoCards.vue`
- Modify: `components/opportunity/ContentDisplay.vue`

- [ ] **Step 1: Update components/opportunity/HeroSection.vue**

Replace the outer wrapper class and CTA button gradient only (the component is large — keep all logic intact):

Find `class="bg-gradient-to-br from-violet-600 via-purple-700 to-fuchsia-800 relative overflow-hidden"` and replace with:

```html
class="bg-primary relative overflow-hidden"
```

Find the CTA button `<a>` element with `class="group inline-flex items-center bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 ..."` and replace with:

```html
<a
  :href="opportunity.site"
  target="_blank"
  ref="ctaButton"
  class="group inline-flex items-center bg-accent-green text-[#0D0B1A] font-bold px-8 py-4 rounded-2xl shadow-2xl hover:opacity-90 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
>
  <svg class="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
  </svg>
  Acessar Oportunidade
</a>
```

Also update the `h1` to use `font-display`:
Find `class="text-4xl sm:text-5xl lg:text-7xl font-black text-white mb-6 leading-tight"` and replace with:
```html
class="font-display text-4xl sm:text-5xl lg:text-7xl font-black text-white mb-6 leading-tight"
```

- [ ] **Step 2: Replace components/opportunity/StatsBanner.vue**

```vue
<template>
  <div class="bg-surface rounded-3xl p-8 mb-16 shadow-xl border border-text/10" data-aos="fade-up">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <!-- Deadline Card -->
      <div class="text-center group">
        <div class="bg-accent-red w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
        </div>
        <h3 class="font-display text-lg font-bold text-text mb-2">Prazo de Inscrição</h3>
        <p class="font-body text-2xl font-black text-accent-red">{{ opportunity.deadline }}</p>
      </div>

      <!-- Area Card -->
      <div class="text-center group">
        <div class="bg-primary w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
          </svg>
        </div>
        <h3 class="font-display text-lg font-bold text-text mb-2">Área de Atuação</h3>
        <p class="font-body text-xl font-bold text-primary">{{ opportunity.fields.join(", ") }}</p>
      </div>

      <!-- Level Card -->
      <div class="text-center group">
        <div class="bg-accent-cyan w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
          <svg class="w-8 h-8 text-[#0D0B1A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
          </svg>
        </div>
        <h3 class="font-display text-lg font-bold text-text mb-2">Nível</h3>
        <p class="font-body text-xl font-bold text-accent-cyan">{{ opportunity.level }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({ opportunity: { type: Object, required: true } })
</script>
```

- [ ] **Step 3: Update components/opportunity/TabNavigation.vue active tab classes**

In `TabNavigation.vue`, replace ALL occurrences of:
- `'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-indigo-500 shadow-xl transform scale-105'` → `'bg-primary text-white border-primary shadow-xl transform scale-105'`
- `'bg-white text-gray-700 border-gray-200 hover:border-indigo-300 hover:shadow-lg hover:scale-102'` → `'bg-surface text-text border-text/10 hover:border-primary hover:shadow-lg'`
- `'bg-white/20'` (active icon bg) → `'bg-white/20'` (keep)
- `'bg-indigo-100 group-hover:bg-indigo-200'` (inactive icon bg) → `'bg-primary/10 group-hover:bg-primary/20'`
- `'text-indigo-600 group-hover:text-indigo-700'` (inactive icon) → `'text-primary group-hover:text-primary/80'`

Also update the left-side accent:
Find `class="w-2 h-8 bg-gradient-to-b from-violet-500 to-purple-600 rounded-full mr-4"` and replace with:
```html
class="w-2 h-8 bg-primary rounded-full mr-4"
```

And find `class="text-3xl font-bold text-gray-800 mb-8 flex items-center"` and replace with:
```html
class="font-display text-3xl font-bold text-text mb-8 flex items-center"
```

- [ ] **Step 4: Update components/opportunity/InfoCards.vue**

Replace the Quick Access card gradient:
Find `class="info-card bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-700 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden"` and replace with:
```html
class="info-card bg-primary rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden"
```

Replace the Keywords card:
Find `class="info-card bg-white rounded-3xl p-8 shadow-xl border border-gray-200"` and replace with:
```html
class="info-card bg-surface rounded-3xl p-8 shadow-xl border border-text/10"
```

Find `class="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl ..."` (keywords icon bg) and replace with:
```html
class="w-10 h-10 bg-primary rounded-xl flex items-center justify-center mr-3"
```

Find `class="text-xl font-bold text-gray-800 mb-6 ..."` (keywords heading) and replace with:
```html
class="font-display text-xl font-bold text-text mb-6 flex items-center"
```

Replace keyword tag classes:
Find `class="group px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-indigo-700 rounded-2xl text-sm font-semibold border border-indigo-200 transition-all duration-300 hover:scale-105 hover:shadow-md"` and replace with:
```html
class="group px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-2xl text-sm font-body font-semibold border border-primary/20 transition-all duration-300 hover:scale-105"
```

- [ ] **Step 5: Update components/opportunity/ContentDisplay.vue**

Replace:
- `class="bg-white rounded-3xl p-10 shadow-xl border border-gray-200 min-h-[500px] relative overflow-hidden"` → `class="bg-surface rounded-3xl p-10 shadow-xl border border-text/10 min-h-[500px] relative overflow-hidden"`
- `class="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full ..."` → `class="bg-primary/5 rounded-full -translate-y-16 translate-x-16 absolute top-0 right-0 w-32 h-32 opacity-50"`
- `class="w-2 h-12 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full mr-6 ..."` → `class="w-2 h-12 bg-primary rounded-full mr-6 transition-all duration-300 ease-in-out"`
- `class="text-3xl font-bold text-gray-800 mb-2 ..."` → `class="font-display text-3xl font-bold text-text mb-2 transition-all duration-300 ease-in-out"`
- `class="bg-gray-50 rounded-2xl p-8 ..."` → `class="bg-bg rounded-2xl p-8 shadow-sm border border-text/10 transition-all duration-300 ease-in-out"`
- `class="text-gray-800 leading-relaxed text-base whitespace-pre-line ..."` → `class="font-body text-text leading-relaxed text-base whitespace-pre-line transition-all duration-300 ease-in-out"`

- [ ] **Step 6: Commit**

```bash
git add components/opportunity/
git commit -m "feat: rebrand opportunity detail components with brand tokens"
```

---

## Task 11: Newsletter components + pages

**Files:**
- Modify: `components/newsletter/HeaderSection.vue`
- Modify: `components/newsletter/Cta.vue`
- Modify: `components/NewsletterCard.vue`
- Modify: `pages/newsletter/index.vue`
- Modify: `pages/newsletter/[id].vue`

- [ ] **Step 1: Replace components/newsletter/HeaderSection.vue**

Replace only the outer `<header>` element class and internal decorative gradients. Keep all content and script intact:

Find `class="relative bg-gradient-to-br from-violet-600 via-purple-700 to-fuchsia-800 pt-32 pb-16 rounded-b-lg overflow-hidden"` and replace with:
```html
class="relative bg-accent-pink pt-32 pb-16 rounded-b-lg overflow-hidden"
```

Remove the three gradient orb `<div>` elements (they use purple/blue tones that clash with pink). Replace the entire `<!-- Gradient orbs -->` block with:
```html
<!-- Gradient orbs -->
<div class="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
<div class="absolute bottom-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
```

Update the "Inscrever-se" button:
Find `class="group inline-flex items-center gap-2 bg-gradient-to-r from-white to-white/90 ... text-purple-700 ..."` and replace with:
```html
class="group inline-flex items-center gap-2 bg-white hover:bg-white/90 text-[#0D0B1A] font-body px-8 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
```

Update the h1 to use `font-display`.

- [ ] **Step 2: Replace components/newsletter/Cta.vue**

```vue
<template>
  <section
    id="newsletter-subscription"
    class="bg-primary pt-12 pb-4 my-10 shadow-xl rounded-lg max-w-7xl ml-4 mr-4 sm:ml-6 sm:mr-6 md:mx-auto"
    data-aos="fade-up"
  >
    <div class="text-center mb-8">
      <h3 class="font-display text-2xl md:text-3xl font-bold text-white mb-4">
        Não perca nenhuma novidade!
      </h3>
      <p class="font-body text-white/90 mb-8 max-w-2xl mx-auto px-4">
        Inscreva-se na nossa newsletter e receba semanalmente as melhores
        oportunidades e dicas para turbinar sua jornada educacional.
      </p>
    </div>
    <iframe
      src="https://subscribe-forms.beehiiv.com/012188af-07b0-4875-8457-3a74a9faadc7"
      class="w-[320px] mx-auto rounded-l h-20 max-h-20"
      data-test-id="beehiiv-embed"
      frameborder="0"
      scrolling="no"
      loading="lazy"
    ></iframe>
  </section>
</template>
```

- [ ] **Step 3: Update components/NewsletterCard.vue**

Replace the `<article>` class:
`class="group bg-white rounded-3xl overflow-hidden border border-gray-200 hover:shadow-xl hover:border-purple-200 transition-all duration-300 hover:scale-105"` → `class="group bg-surface rounded-3xl overflow-hidden border border-text/10 hover:shadow-xl hover:border-primary/40 transition-all duration-300 hover:scale-105"`

Replace the date dot:
`class="w-2 h-2 bg-purple-500 rounded-full"` → `class="w-2 h-2 bg-accent-cyan rounded-full"`

Replace the date `<time>` and surrounding text:
- `class` of the date container → add `text-text/50 font-body`

Replace title class:
`class="text-xl font-bold text-gray-800 mb-4 line-clamp-2 group-hover:text-purple-700 transition-colors"` → `class="font-display text-xl font-bold text-text mb-4 line-clamp-2 group-hover:text-primary transition-colors"`

Replace description class:
`class="text-gray-600 mb-6 line-clamp-3 leading-relaxed"` → `class="font-body text-text/70 mb-6 line-clamp-3 leading-relaxed"`

Replace "Ler post" button:
`class="group/btn inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"` → `class="group/btn inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-body px-6 py-3 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"`

- [ ] **Step 4: Update pages/newsletter/index.vue**

Replace page bg: `class="min-h-screen bg-gray-50"` → `class="min-h-screen bg-bg"`

Replace section header h2: `class="text-3xl md:text-4xl font-bold text-[#140E3F] mb-4"` → `class="font-display text-3xl md:text-4xl font-bold text-text mb-4"`

Replace error card bg: `class="bg-white rounded-3xl p-8 shadow-xl border border-gray-200 max-w-md mx-auto"` → `class="bg-surface rounded-3xl p-8 shadow-xl border border-text/10 max-w-md mx-auto"`

Replace error retry button: `class="bg-gradient-to-r from-purple-600 to-pink-600 ... text-white px-8 py-3 ..."` → `class="bg-primary hover:bg-primary/90 text-white font-body px-8 py-3 rounded-2xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl"`

Replace pagination "Anterior"/"Próximo" buttons: `class="px-6 py-3 text-sm font-semibold text-gray-500 bg-white border border-gray-300 rounded-2xl hover:bg-gray-50 hover:border-purple-300 disabled:opacity-50 ..."` → `class="px-6 py-3 text-sm font-body font-semibold text-text/60 bg-surface border border-text/20 rounded-2xl hover:border-primary disabled:opacity-40 transition-all duration-300"`

Replace active page number button class: `'text-white bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg'` → `'text-white bg-primary shadow-lg'`

Replace inactive page number button class: `'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:border-purple-300'` → `'text-text/60 bg-surface border border-text/20 hover:border-primary'`

- [ ] **Step 5: Update pages/newsletter/[id].vue**

Replace page bg: `class="min-h-screen bg-gray-50"` → `class="min-h-screen bg-bg"`

Replace error button: same pattern as Step 4 — `bg-purple-600 hover:bg-purple-700` → `bg-primary hover:bg-primary/90`

Replace error link: `class="block text-purple-600 hover:text-purple-700 font-medium"` → `class="block text-primary hover:text-primary/80 font-body font-medium"`

Replace article `<header>` gradient: `class="relative bg-gradient-to-br from-violet-600 via-purple-700 to-fuchsia-800 pt-32 pb-4 overflow-hidden"` → `class="relative bg-primary pt-32 pb-4 overflow-hidden"`

Replace post content card: `class="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-200 max-w-4xl mx-auto"` → `class="bg-surface rounded-3xl p-8 md:p-12 shadow-xl border border-text/10 max-w-4xl mx-auto"`

Replace "Ver todos os posts" link: `class="... bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 ..."` → `class="group inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-body px-8 py-4 rounded-2xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"`

Update `<style scoped>` deep styles to use CSS vars:

```css
<style scoped>
:deep(.newsletter-content) {
  color: var(--color-text);
  line-height: 1.75;
  font-family: 'Poppins', sans-serif;
}

:deep(.newsletter-content h1) {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--color-text);
  font-family: 'FuturaStd', sans-serif;
  margin-top: 2rem;
  margin-bottom: 1rem;
}

:deep(.newsletter-content h2) {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  font-family: 'FuturaStd', sans-serif;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
}

:deep(.newsletter-content h3) {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
  font-family: 'FuturaStd', sans-serif;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

:deep(.newsletter-content p) {
  margin-bottom: 1rem;
  color: var(--color-text);
  opacity: 0.85;
}

:deep(.newsletter-content a) {
  color: var(--color-primary);
  text-decoration: underline;
}

:deep(.newsletter-content a:hover) {
  opacity: 0.8;
}

:deep(.newsletter-content ul),
:deep(.newsletter-content ol) {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

:deep(.newsletter-content ul) { list-style-type: disc; list-style-position: inside; }
:deep(.newsletter-content ol) { list-style-type: decimal; list-style-position: inside; }

:deep(.newsletter-content blockquote) {
  border-left: 4px solid var(--color-accent-cyan);
  padding-left: 1rem;
  font-style: italic;
  color: var(--color-text);
  opacity: 0.7;
  margin: 1.5rem 0;
}

:deep(.newsletter-content img) {
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  margin: 1.5rem 0;
  max-width: 100%;
  height: auto;
}

:deep(.newsletter-content code) {
  background-color: var(--color-surface);
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-family: ui-monospace, SFMono-Regular, monospace;
}

:deep(.newsletter-content pre) {
  background-color: var(--color-surface);
  color: var(--color-text);
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 1rem 0;
}
</style>
```

- [ ] **Step 6: Commit**

```bash
git add components/newsletter/ components/NewsletterCard.vue pages/newsletter/
git commit -m "feat: rebrand newsletter components and pages with brand tokens"
```

---

## Task 12: Final verification

- [ ] **Step 1: Run dev server and verify all pages**

```bash
npm run dev
```

Visit each route and verify:
- `/` — hero is `bg-primary`, lime green CTA, category buttons use `bg-surface`
- `/sobre` — header `bg-primary`, values cards use brand accent colors, team cards hover cyan border
- `/oportunidades` — filter sidebar `bg-surface`, keyword tags cycle pink/green/cyan, pagination uses `bg-primary`
- `/oportunidade/[id]` — hero `bg-primary`, stats banner uses brand icons, content display `bg-surface`
- `/newsletter` — header `bg-accent-pink`, post cards `bg-surface`, "Ler post" button `bg-primary`
- `/newsletter/[id]` — hero `bg-primary`, content renders with CSS vars, blockquote has `accent-cyan` left border

Toggle dark mode on each page. Confirm `bg-bg` switches to `#0D0B1A`, `bg-surface` to `#1A1633`, text to white.

Check Futura Std renders on all headings (bold geometric). Check Poppins Light on body text.

- [ ] **Step 2: Build check**

```bash
npm run build
```

Expected: build completes without errors. Any TypeScript or template errors will surface here.

- [ ] **Step 3: Final commit**

```bash
git add .
git commit -m "feat: complete visual rebrand — brand tokens, dark/light theme, FuturaStd/Poppins typography"
```
