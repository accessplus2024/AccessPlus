# CLAUDE.md

Orientação para o Claude neste repositório.

**Arquitetura, dados e o pipeline da Accessia: `docs/accessia.md`.** Este
arquivo é só o mapa rápido e as armadilhas.

## Comandos

```bash
npm run dev              # http://localhost:3000
npm run build

npm run embed            # regera chunks + vetores  (ver armadilha 1)
npm run test:roteador    # regressão do casamento de título — segundos, sem API
npm run eval:golden-set  # recall@10, precision@5, NDCG@10, MRR
npm run eval:diagnostico # rode PRIMEIRO quando o recall estiver baixo
```

Não há suíte de testes de unidade. `lab/` é bancada de medição, não runtime.

## Stack

Nuxt 3 + Vue 3 Composition API · Tailwind (PostCSS, sem biblioteca de
componentes) · `@iconoir/vue` · AOS + GSAP · Supabase · Vercel. Todo texto de
interface é pt-BR.

## Onde as coisas estão

- `pages/`, `components/` — site. `components/AccessIA*.vue` é o chat.
- `server/api/opportunities/` — catálogo, com cache em memória de 12h.
- `server/api/rag/` — `chat.post.js` (endpoint vivo do chat) e `match.post.js`.
- `server/utils/rag/` — o pipeline. Comece por `buscar.js` e `catalogo.js`.
- `scripts/` — offline: embed, reanotação do catálogo, golden set.
- `docs/sql/` — migrações, em ordem de data.

## Armadilhas que já custaram tempo

**1. Mudar `buildPassage()` (`campos.js`) exige `npm run embed`.** O texto que
gera o vetor e o texto que gera o índice BM25 saem da mesma função de
propósito, mas o vetor fica materializado no banco. Sem re-embeddar, o índice
vetorial descreve uma versão antiga do catálogo **em silêncio** — o auto-reparo
do `catalogo.js` só cobre oportunidade *sem* vetor, nunca vetor desatualizado.

**2. Vocabulário é fechado, e o filtro compara por igualdade exata.** Um rótulo
que não existe no banco vira chip que devolve zero. As listas estão em
`docs/accessia.md` §4 e em `scripts/reanotar-catalogo.js`.

**3. `status` e `inscricoes` são coisas diferentes.** `status` é curadoria;
`inscricoes` é se dá pra se inscrever hoje. Enquanto os dois sentidos moravam
na mesma coluna, oportunidade aprovada com inscrição encerrada ficava invisível
para a busca.

**4. `juiz.js` e `multiAspecto.js` estão desligados por MEDIÇÃO.** Ligar sem
medir de novo é regressão. Os números estão em `docs/accessia.md` §6.

**5. Nada filtra por preferência do aluno — tudo é reordenação.** Os únicos
cortes duros são `status='Aprovada'` e a faixa de idade explícita. A idade
nunca é inferida de série ou nível. Ver `docs/accessia.md` §1 antes de
introduzir qualquer filtro novo.

## Antes de mexer em retrieval

Os pisos de `docs/accessia.md` §6 não podem cair. O pipeline é determinístico,
então qualquer variação é efeito real da mudança, nunca ruído amostral. Rode
`npm run eval:diagnostico` antes de teorizar: ele separa "não foi encontrado"
de "foi encontrado e mal ordenado", que têm causas opostas.
