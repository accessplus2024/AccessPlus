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

## Accessia (RAG chatbot)

Accessia recommends opportunities to students via retrieval-augmented generation. Full design history lives in `docs/PLAN.md` (technical plan) and `docs/decisions.md` (decision log); this is just the map for finding your way around the code.

**Pipeline:** `server/api/rag/match.post.js` is the only live route. It rate-limits by IP, requires login, checks/increments a monthly quota, then runs: hybrid search → rerank → generate → log interaction.

- `server/utils/rag/hybridSearch.js` — fuses `vectorSearch.js` (pgvector cosine) and `ftsSearch.js` (Postgres FTS, pt config) via Reciprocal Rank Fusion (k=60)
- `server/utils/rag/rerank.js` — cross-encoder rerank via NVIDIA NIM
- `server/utils/rag/generate.js` — final answer via NVIDIA NIM chat completions (GLM-5.2), holds the Accessia system prompt
- `server/utils/rag/quota.js`, `logInteraction.js`, `corpusSize.js`, `devClient.js`, `titleMatch.js`, `embedText.js` — supporting utilities

**Key rule (see `docs/PLAN.md` Part 1):** only `status='Aprovada'` and an explicit numeric age are hard filters. Cost, language, location, and audience are ranking boosts/caveats, never exclusion filters — the goal is "show it with a caveat" over "hide it because a weak signal didn't match." Age must never be inferred from school grade (`docs/PLAN.md` Part 7.3) — this would systematically exclude the older-than-expected students (public-school, low-income) the product serves.

**Offline scripts** (not part of the request path — run manually or via `npm run`):

| Script | Purpose |
|---|---|
| `npm run sync:opportunities` → `scripts/sync-opportunities-from-prod.js` | Pulls the approved catalog from prod Supabase into dev |
| `npm run embed` → `scripts/embed-opportunities.js` | Chunks + embeds opportunities via NVIDIA NIM, writes `embedded_at` |
| `npm run embed:test` → `scripts/tests/test-embedding-connection.js` | Sanity-checks the embedding endpoint/credentials |
| `npm run eval:golden-set` → `scripts/eval/run-golden-set.js` | Runs the hand-written golden-set eval (recall@10, precision@5, NDCG@10, MRR) against `scripts/eval/golden-set.json` |
| `scripts/chunk-opportunity.js`, `scripts/fetch-opportunities.js` | Helpers used by `embed-opportunities.js` |
| `scripts/backfill-audience-language-location.js` | LLM-assisted backfill for null `audience`/`language`/`location` — see `docs/decisions.md` for status before relying on it |

**Known gaps** (see `docs/decisions.md` for detail): `audience` is null on most approved rows in both prod and dev, despite an earlier decision-log entry claiming it was fully backfilled and verified — treat that entry as unconfirmed until re-verified. Even where `audience` is populated, it isn't visible to FTS/vector retrieval (only reaches the LLM narratively at generation time).

<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
|------|----------|
| `detect_changes` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context` | Need source snippets for review — token-efficient |
| `get_impact_radius` | Understanding blast radius of a change |
| `get_affected_flows` | Finding which execution paths are impacted |
| `query_graph` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes` | Finding functions/classes by name or keyword |
| `get_architecture_overview` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.
