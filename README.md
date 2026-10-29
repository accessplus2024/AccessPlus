# Access+

Plataforma gratuita de oportunidades extracurriculares para estudantes
brasileiros de ensino fundamental e médio. Nuxt 3 + Supabase, em produção na
Vercel.

## Rodar

```bash
npm install
cp .env.example .env     # preencha as chaves
npm run dev              # http://localhost:3000
```

## Estrutura

```
pages/                 rotas do site
components/            UI  
server/api/            rotas Nitro — catálogo e Accessia
server/utils/rag/      o pipeline de busca da Accessia
scripts/               offline: embedding, reanotação do catálogo
lab/                   bancada de medição — NÃO faz parte do runtime
docs/accessia.md       como a Accessia funciona
```

## Páginas

`/` · `/oportunidades` · `/oportunidade/[id]` · `/newsletter` · `/sobre`

## Variáveis de ambiente

| variável | para quê |
|---|---|
| `SUPABASE_URL` | projeto de produção |
| `SUPABASE_KEY` | leitura do catálogo pelo site (chave publicável basta) |
| `SUPABASE_ANON_KEY` | auth no cliente |
| `PROD_SUPABASE_SERVICE_ROLE_KEY` | **a Accessia** — leitura de `opportunity_chunks` (RLS) |
| `NVIDIA_API_KEY`, `EMBEDDING_MODEL`, `EMBEDDING_DIMENSIONS` | embedding e rerank |
| `BEEHIV_PUBLICATION_ID` / `BEEHIV_API_KEY` | newsletter |
| `CRON_SECRET` | autoriza `POST /api/opportunities/refresh` |
| `RAG_SUPABASE_URL` / `RAG_SUPABASE_SERVICE_ROLE_KEY` | opcional: aponta só a busca para outro banco |
