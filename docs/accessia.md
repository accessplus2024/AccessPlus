# Accessia — como funciona

A Accessia é a busca da AccessPlus. O aluno escreve o que quer em texto livre e
ela responde com oportunidades reais do catálogo, explicando por que cada uma
apareceu.

---

## 1. As regras de produto que mandam no resto

Elas vêm antes de qualquer detalhe técnico, e várias decisões de código só
fazem sentido à luz delas.

**Nada filtra por preferência do aluno — tudo é reordenação.** Se ele diz que
prefere algo gratuito, o gratuito sobe; o pago não some. Os **únicos** cortes
duros são `status = 'Aprovada'` e a faixa de idade **explícita** da
oportunidade.

**A idade nunca é inferida de série ou nível.** Inferir excluiria
sistematicamente o aluno com defasagem idade-série — que é parte central do
público.

**Esconder um resultado real é pior que mostrar um fraco.** Mostrar demais o
aluno corrige sozinho; esconder ele nunca fica sabendo. Toda dúvida do sistema
vira ressalva escrita, não sumiço.

**Inscrição encerrada aparece, marcada.** O aluno decide se ainda interessa.

---

## 2. O caminho de uma pergunta

```
mensagem do aluno
   ↓
roteador.js ........ classifica a intenção (determinístico, sem LLM)
   ↓
   ├─ conceito ............ glossário curado, escrito à mão
   ├─ categoria ........... lista real do catálogo
   ├─ oportunidade ........ ficha ancorada só em coluna do banco
   ├─ exploração .......... funil de 3 perguntas para quem não sabe o que quer
   └─ recomendação ........ buscar.js
                               ↓
                      BM25F + vetor, fundidos
                               ↓
                      boosts estruturais (custo, idioma, local)
                               ↓
                      cross-encoder (rerank), misturado 0,6/0,4
                               ↓
                      filtro de idade (único corte duro)
                               ↓
                      corte por relevância → geração das explicações
```

**Por que o roteador é determinístico.** "O que é MUN?" tem uma resposta certa
escrita à mão. Deixar um modelo de 8B decidir se aquilo era uma pergunta
conceitual é adicionar chance de erro onde não precisava existir.

**Quatro caminhos para reconhecer uma oportunidade citada** (`casarOportunidade`
em `roteador.js`), em ordem: sigla entre parênteses com borda de palavra;
título inteiro contido na frase; sobreposição de palavras significativas; e
**nome curto** — trecho contíguo do título com pelo menos uma palavra rara no
catálogo. O último existe porque ninguém cita um programa pelo nome oficial
completo. `npm run test:roteador` guarda os três jeitos conhecidos de errar
isso.

**Login:** conceito, categoria, saudação e ficha funcionam anônimos — são dados
públicos do catálogo. Recomendação e exploração exigem login, porque usam idade
e nível do cadastro.

---

## 3. Os módulos

Em `server/utils/rag/`:

| arquivo | papel |
|---|---|
| `buscar.js` | orquestra a recuperação. **A tabela de medição e o porquê de cada peso estão no cabeçalho — leia antes de mexer em peso** |
| `catalogo.js` | catálogo, índice BM25F e matriz de embeddings em memória (12h, stale-while-revalidate) |
| `campos.js` | representação por campo: índice, passagem de embedding, passagem de rerank |
| `texto.js` | tokenizador pt-BR: dobra acentos, remove stopwords, stemming Snowball |
| `bm25.js` | BM25F com peso por campo |
| `sinais.js` | sinais derivados do título e do local: brasileiro, idioma provável, exige viagem |
| `entenderConsulta.js` | intenção da consulta, com consciência de negação e casamento por n-grama |
| `rerank.js` | cross-encoder NVIDIA NIM |
| `generate.js` | geração das explicações, com o system prompt da Accessia |
| `utilidade.js` | o que de fato chega ao aluno: corte por relevância e rebaixamento |
| `ageFilter.js` | o corte duro de idade |
| `roteador.js`, `glossario.js`, `conversa.js`, `ficha.js` | o chat |
| `juiz.js`, `multiAspecto.js` | **desligados por medição** — ver §6 |

---

## 4. Os dados

**Um único banco (produção).** Catálogo, vetores e perfis vivem no mesmo
projeto Supabase desde 2026-08-25. O cliente resolve nesta ordem:
`RAG_SUPABASE_*` → `PROD_SUPABASE_*` → `DEV_SUPABASE_*`, e **grita no log** se
cair no último — Accessia lendo o banco errado em silêncio já aconteceu.

**A busca exige chave `service_role`; o site não.** `opportunities` é legível
por chave publicável, mas `opportunity_chunks` tem RLS e devolve zero linhas
para qualquer outra chave. `catalog.js` falha na carga quando mais da metade do
catálogo está sem vetor: sem essa guarda, o servidor embeddaria as 295
oportunidades a cada cold start da Vercel, queimando cota e latência em
silêncio.

**`opportunities`** — o catálogo. Duas colunas de estado, separadas de
propósito: `status` (curadoria: `Aprovada` / `Revisar`) e `inscricoes`
(`Aberta` / `Encerrada`). Enquanto os dois sentidos dividiam `status`, toda
oportunidade aprovada com inscrição encerrada ficava invisível para a busca.

**`opportunity_chunks`** — os vetores. Um chunk `core` por oportunidade (a
passagem completa, montada por `buildPassage()`), mais chunks próprios para
`eligibility` (obrigatório), `process`, `applicants` e `additionals` quando
preenchidos. Hoje só o `core` alimenta a matriz de vetores.

**A armadilha número um deste projeto:** mudar `buildPassage()` em `campos.js`
**exige rodar `npm run embed`**. O texto que gera o vetor e o texto que gera o
índice BM25 saem da mesma função de propósito, mas o vetor fica materializado
no banco. Sem re-embeddar, o índice vetorial descreve uma versão antiga do
catálogo — **em silêncio**, porque o auto-reparo só cobre oportunidade *sem*
vetor, não vetor desatualizado.

**Vocabulários fechados** (`scripts/reanotar-catalogo.js` é a fonte):

- `areas`: STEM, Tech, Humanas, Linguagens, Artes, Política, Ativismo, Meio Ambiente, Empreendedorismo
- `audience`: Baixa Renda, Escola Pública, Meninas, Negro/Pardo, Indígena/Quilombola — **recorte afirmativo**, nunca público amplo
- `format`: Remoto, Presencial, Híbrido · `cost`: Gratuito, Bolsa, Totalmente Financiado
- `location`: geografia limpa, sem modalidade

Os filtros do site comparam por **igualdade exata**: um rótulo que não existe no
banco vira chip morto que devolve zero.

---

## 5. Scripts

| comando | o que faz |
|---|---|
| `npm run dev` / `build` | Nuxt |
| `npm run embed` | regera os chunks e os vetores. **Obrigatório depois de mexer em `campos.js` ou no catálogo** |
| `npm run test:roteador` | teste de regressão do casamento de título. Segundos, sem API |
| `npm run eval:golden-set` | recall@10, precision@5, NDCG@10, MRR contra os 30 perfis |
| `npm run eval:ablacao` | compara configurações de retrieval (`lab/run.mjs`) |
| `npm run eval:diagnostico` | **rode primeiro quando o recall estiver baixo** — separa "não foi encontrado" de "foi encontrado e mal ordenado" |
| `npm run eval:gaps` | lacunas do catálogo, ordenadas pelo custo para o aluno |

`lab/` é a bancada de medição — **não faz parte do runtime**. Ele mantém cache
em disco; use `LAB_SEM_CACHE=1` quando quiser que N rodadas sejam N chamadas de
API de verdade.

---

## 6. Os pisos, e o que já foi rejeitado com medição

Medido nos 30 perfis reais do golden set, 3 rodadas, variância zero. O pipeline
é determinístico: qualquer variação é efeito real da mudança, nunca ruído.

| métrica | piso |
|---|---|
| recall@10 | ≥ 0,679 |
| precision@5 | ≥ 0,355 |
| NDCG@10 | ≥ 0,618 |
| MRR | ≥ 0,767 |
| vazamentos no top-5 | ≤ 2 |
| inglês no top-3 de quem não fala inglês | ≤ 0,043 |

**Rejeitado por medição, não por preguiça:**

- **Juiz LLM listwise** (`juiz.js`): piorou recall de 0,668 para 0,602. Ele
  empata 14,5 dos 30 candidatos na mesma nota e rebaixou 16 itens marcados como
  "deve aparecer" — inclusive um programa brasileiro de empreendedorismo jovem
  com nota 0 para um perfil de empreendedorismo na favela. Não é ideia ruim: é
  ideia que não passou no teste com as peças de hoje.
- **Busca multi-aspecto** (`multiAspecto.js`): melhor MRR de todos (0,738), mas
  custa recall.
- **Busca por FTS do banco** (`match_opportunities_fts`): indexava só
  `searchable_text` — `type`, `level`, `cost`, `format`, `language`, `location`
  e `process` eram invisíveis. `type` é a coluna onde moram "MUNs" e
  "Mentorias": quem escrevia "quero fazer um MUN" não achava MUN nenhum.
- **Penalidade de idioma alta:** a 1,5 zera "inglês no top-3" mas derruba
  recall. Ficou em 0,8.

**Ligar qualquer um dos desligados sem medir de novo é regressão.**

---

## 7. O que está aberto

**A régua não enxerga o aluno real.** O golden set alimenta sete sinais de
perfil; um aluno de verdade entrega dois (`age` e `education_level`). `areas`,
`linguas` e `bio` não são coletados pelo cadastro e foram removidos do banco em
2026-08-25 — o que significa que **o idioma do aluno não é conhecido em lugar
nenhum**, e por isso a penalidade de idioma opera sobre um sinal adivinhado do
título. Antes de creditar ao golden set a palavra final sobre qualquer eixo,
vale medir uma variante com só os campos que produção entrega.

**Dados coletados que ninguém lê:** `income` (34% dos cadastros) e
`school_type` (63%) existem e nada no pipeline os usa — mesma situação em que
`linguas` estava antes de virar a melhor mudança de um dia inteiro.

**O corte por relevância tem o piso invertido.** `cortarPorRelevancia` corta a
0,78 do score do primeiro colocado, e isso é permissivo em assunto raro (onde
deveria ser severo) e severo em assunto denso — num pedido sobre olimpíadas,
cortou OBMEP, OBA, ONC e IChO. Mitigado subindo o mínimo para 8; a correção
estrutural é cortar pelo **degrau entre itens consecutivos** em vez da
distância até o topo, e precisa de medição.

**Lacunas do catálogo** (`npm run eval:gaps`): 62 oportunidades com inscrição
aberta e **sem prazo** — a única lacuna cujo custo é o aluno perder a inscrição.
