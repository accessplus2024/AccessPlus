# Visual Rebrand Design — Access+

**Date:** 2026-05-22  
**Status:** Approved

## Overview

Full visual rebrand of the Access+ website to match the new brand guidelines. Covers color system, typography, dark/light theming, shared components, and all pages.

## Design System

### Color Tokens

All colors defined as CSS custom properties in `assets/css/main.css`. Tailwind consumes them via `var(--color-*)` references in `tailwind.config.js`.

| Token | Light | Dark | Brand name |
|---|---|---|---|
| `--color-primary` | `#4B3FE4` | `#6B5FFF` | caneta azul vestibular |
| `--color-bg` | `#FFFFFF` | `#0D0B1A` | corretivo / preta |
| `--color-surface` | `#F5F5F5` | `#1A1633` | — |
| `--color-text` | `#0D0B1A` | `#FFFFFF` | preta / corretivo |
| `--color-accent-red` | `#FF4422` | `#FF4422` | caneta vermelha vestibular |
| `--color-accent-green` | `#C8F135` | `#C8F135` | grifa texto |
| `--color-accent-pink` | `#FF2D8A` | `#FF2D8A` | grifa tópicos |
| `--color-accent-cyan` | `#7DECE9` | `#7DECE9` | citações |

Accent colors are identical in both themes — they read well on both dark and light backgrounds.

### Typography

- **Display font (`font-display`):** `FuturaStdExtraBold` — local OTF at `assets/FuturaStdExtraBold.otf`, loaded via `@nuxt/fonts`. Used for all `h1`–`h3`, hero text, navbar brand.
- **Body font (`font-body`):** `Poppins` weight 300 — loaded from Google Fonts via `@nuxt/fonts`. Used for all body copy, subtitles, card text.

### Icons

Keep `@iconoir/vue`. Style with brand tokens (`text-primary`, accent colors) instead of hardcoded hex values.

## Theme Switching

### Module

Add `@nuxtjs/color-mode` to `nuxt.config.ts`:

```ts
colorMode: {
  preference: 'system',  // default: follow OS
  fallback: 'light',
  classSuffix: '',       // emits class="dark" on <html>
}
```

### CSS structure

```css
/* assets/css/main.css */
:root {
  --color-primary: #4B3FE4;
  --color-bg: #FFFFFF;
  --color-surface: #F5F5F5;
  --color-text: #0D0B1A;
  /* accents same both themes */
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

### Tailwind config

```js
darkMode: 'class',
theme: {
  extend: {
    colors: {
      primary: 'var(--color-primary)',
      bg: 'var(--color-bg)',
      surface: 'var(--color-surface)',
      text: 'var(--color-text)',
      'accent-red': 'var(--color-accent-red)',
      'accent-green': 'var(--color-accent-green)',
      'accent-pink': 'var(--color-accent-pink)',
      'accent-cyan': 'var(--color-accent-cyan)',
    },
    fontFamily: {
      sans: ['Poppins', 'sans-serif'],    // replaces current Montserrat default
      display: ['FuturaStd', 'sans-serif'],
      body: ['Poppins', 'sans-serif'],
    },
  },
}
```

### Toggle Component

New `components/ThemeToggle.vue`. Uses `useColorMode()`. Cycles: system → light → dark → system. Sun/moon icons from `@iconoir/vue`. Added to right side of `Navbar.vue`.

### Logo Swap

Two logo SVGs expected at `public/images/logo-light.svg` and `public/images/logo-dark.svg`. `Navbar.vue` swaps via computed property based on `colorMode.value`. (Assets to be provided by user.)

## Shared Components

### Navbar
- Replace text brand with logo SVG (dark/light swap)
- `font-display` for any text
- `bg-bg` background, `border-surface` bottom border
- ThemeToggle added to right side

### Footer
- Palette tokens throughout
- `font-display` for section headings
- Accent colors for links/hover

### OpportunityCard
- `bg-surface` base, `text-text`
- Keyword tags: replace hardcoded `#3D30A2`, `#F16767`, `#A459D1` with `accent-pink`, `accent-green`, `accent-cyan` rotating by `index % 3` (same deterministic pattern as current code)

## Pages

### Home (`/`)
- **Hero (`home/Header.vue`):** full-width `bg-primary` section, `font-display` headline, `bg-accent-green text-[#0D0B1A]` CTA button
- **CategoryButton:** accent colors per category
- **FeaturesSection:** cards on `bg-surface`
- **NewsSection / OpportunitiesSection:** brand token palette

### Sobre (`/sobre`)
- **HeaderSection:** `bg-primary` hero
- **TeamGrid cards:** `bg-surface`, hover `border-accent-cyan`
- **ValuesCard:** accent-pink/green/cyan for icons
- Body copy: `font-body`

### Oportunidades (`/oportunidades`)
- **FiltersSidebar / MobileFilters:** `bg-surface`, active filter pills `bg-primary text-white`
- **SearchInput:** `border-primary` focus ring
- **OpportunityCard:** keyword colors → brand accents (see Shared Components)
- **Pagination:** active page `bg-primary text-white`

### Oportunidade detail (`/oportunidade/[id]`)
- **HeroSection:** `bg-primary` gradient
- **StatsBanner:** `bg-accent-green text-[#0D0B1A]`
- **InfoCards:** `bg-surface`
- **TabNavigation:** active tab underline `border-b-2 border-primary`
- **ContentDisplay:** `font-body`

### Newsletter (`/newsletter`)
- **HeaderSection:** `bg-accent-pink text-white` hero
- **Post cards:** `bg-surface`, date in `text-accent-cyan`

### Newsletter detail (`/newsletter/[id]`)
- Body text: `font-body`
- Blockquotes: `border-l-4 border-accent-cyan`

## Implementation Notes

- `@nuxtjs/color-mode` must be installed: `npm install @nuxtjs/color-mode`
- `@nuxt/fonts` already in `nuxt.config.ts` modules — extend config for local Futura Std font
- Existing hardcoded hex values (`#3D30A2`, `#F16767`, `#A459D1`, etc.) across all components must be replaced with Tailwind token classes
- Logo SVGs (`logo-light.svg`, `logo-dark.svg`) to be added by user before Navbar work starts
