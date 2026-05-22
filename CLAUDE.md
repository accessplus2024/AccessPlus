# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # dev server at http://localhost:3000
npm run build     # production build
npm run preview   # preview production build
npm run generate  # static site generation
```

No test suite exists in this project.

## Architecture

**Access+** is a Nuxt 3 app (Brazilian Portuguese) listing extracurricular opportunities for youth. All UI text is in pt-BR.

### Data flow

Opportunities come from a **Google Sheets backend via [Stein API](https://steinhq.com)**. The sheet is public and hardcoded (`https://api.steinhq.com/v1/storages/688b7cadc088333365c51e2a`, sheet name `"All"`).

Because Stein has rate limits and the free plan is constrained, all data access goes through **server-side Nitro API routes with in-memory caching (12h TTL, stale-while-revalidate)**:

- `GET /api/opportunities` → `server/api/opportunities/index.get.js` — returns all opportunities, processes raw sheet rows into typed objects (splits comma-separated `keywords`, `audience`, `fields`; assigns numeric string `id` by row index)
- `GET /api/opportunities/[id]` — returns single opportunity from the in-memory cache by id
- `POST /api/opportunities/refresh` — force-invalidates the cache
- `GET /api/opportunities/status` — cache health check

> **Note:** `server/api/opportunities/cached.get.js` is a duplicate implementation of the same stale-while-revalidate logic and is not used by any composable. The active route is `index.get.js`.

The **newsletter** data comes from the **Beehiiv API** (server-side, credentials in env):
- `GET /api/newsletter/posts` → `server/api/newsletter/posts.js`
- `GET /api/newsletter/posts/[id]` → `server/api/newsletter/posts/[id].js`

### Composables

| Composable | Purpose |
|---|---|
| `useCachedOpportunities` | Fetch all opportunities via `/api/opportunities` (server cache) |
| `useOpportunity` | Fetch single opportunity via `/api/opportunities/[id]` |
| `useBeehiiv` | Fetch newsletter posts + date/content formatting helpers |
| `useSteinData` | Direct client-side Stein reads — legacy, still used for some pages |

### Key env vars

```
BEEHIV_PUBLICATION_ID   # exposed as runtimeConfig.public
BEEHIV_API_KEY          # server-only runtimeConfig
```

### Stack

- **Nuxt 3** + Vue 3 Composition API
- **Tailwind CSS** (via PostCSS, no UI component library)
- **@iconoir/vue** for icons
- **AOS** + **GSAP** for animations (initialized in components)
- **@vercel/analytics** + **@nuxtjs/google-gtag** — analytics plugins (client-only)
- Deployed on **Vercel**

### Opportunity data shape

Raw sheet columns processed server-side:

```js
{
  id: String,           // row index + 1
  Nome: String,         // display name
  description: String,
  type: String,         // e.g. "olimpiada", "mun", "intercambio"
  status: String,       // "sim" | "nao" (open/closed)
  level: String,        // "Fundamental" | "Ensino Médio" | "Gap"
  audience: String[],   // split from comma-separated
  keywords: String[],   // split + lowercased
  fields: String[],     // split, e.g. "STEM", "Humanas"
  tuition: String,      // "Bolsa" | "Gratuito" | "Totalmente Financiado"
}
```
