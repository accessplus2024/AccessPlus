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
components/            UI  (AccessIA*.vue = o chat)
server/api/            rotas Nitro — catálogo e Accessia
server/utils/rag/      o pipeline de busca da Accessia
scripts/               offline: embedding, reanotação do catálogo
lab/                   bancada de medição — NÃO faz parte do runtime
docs/accessia.md       como a Accessia funciona
```

## Páginas

`/` · `/oportunidades` · `/oportunidade/[id]` · `/newsletter` · `/sobre`

## Comandos

```bash
npm run build            # build de produção
npm run embed            # regera os vetores da busca (obrigatório após mexer
                         # no catálogo ou em campos.js — ver docs/accessia.md)
npm run test:roteador    # regressão do casamento de título (segundos, sem API)
npm run eval:ablacao     # compara configurações de retrieval
npm run eval:diagnostico # por que o recall caiu
npm run eval:gaps        # lacunas do catálogo
```

## Variáveis de ambiente

| variável | para quê |
|---|---|
| `PROD_SUPABASE_URL` / `PROD_SUPABASE_SERVICE_ROLE_KEY` | catálogo, vetores e perfis |
| `SUPABASE_URL` / `SUPABASE_KEY` | leitura do catálogo pelo site |
| `NVIDIA_API_KEY`, `EMBEDDING_MODEL`, `EMBEDDING_DIMENSIONS` | embedding e rerank |
| `BEEHIV_PUBLICATION_ID` / `BEEHIV_API_KEY` | newsletter |
| `CRON_SECRET` | autoriza `POST /api/opportunities/refresh` |
| `RAG_SUPABASE_URL` / `RAG_SUPABASE_SERVICE_ROLE_KEY` | opcional: aponta a busca para outro banco |

**Na Vercel, `PROD_SUPABASE_*` precisa estar configurada.** Sem ela a busca cai
num fallback e lê o banco errado — o log avisa, mas o site continua no ar.

## Documentação

`docs/accessia.md` — arquitetura da busca, regras de produto, os pisos de
qualidade e o que já foi rejeitado com medição. É o único documento; o resto do
histórico está no git.
