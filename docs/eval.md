# docs/eval.md — como avaliar a Accessia

Este arquivo documenta a avaliação de **recuperação** (retrieval) do RAG —
ver Parte 8 do plano técnico (`PLAN.md`). Para avaliação de **geração**
(faithfulness, answer relevancy, via RAGAS) ver a seção no fim deste
arquivo, que ainda não foi implementada.

## O que é o golden set

Uma lista de perfis de alunos de teste onde você decide de antemão qual é
a resposta certa (`scripts/eval/golden-set.json`), e um script
(`scripts/eval/run-golden-set.js`) que roda cada perfil pelo pipeline real
de busca + rerank e mede se o resultado bate com o esperado.

**Regra que não pode ser quebrada (Parte 8):** os perfis precisam ser
baseados em alunos reais da comunidade AccessPlus, não inventados. Um
aluno real escreve uma bio de um jeito que ninguém simula bem. O arquivo
`golden-set.json` vem com 2 perfis de exemplo copiados literalmente do
plano — eles servem só para você ver o formato e testar que o script
funciona. Não contam como parte dos 30 perfis reais exigidos pelo gate da
Semana 12-13.

## Como rodar

```bash
npm run eval:golden-set
```

Precisa das mesmas variáveis de ambiente do `.env` da raiz do projeto
(`DEV_SUPABASE_URL`, `DEV_SUPABASE_SERVICE_ROLE_KEY`, `NVIDIA_API_KEY`,
`EMBEDDING_MODEL`, `EMBEDDING_DIMENSIONS`) — o script carrega esse `.env`
manualmente via `dotenv`, porque `node scripts/eval/run-golden-set.js` não
passa pelo Nuxt, que é quem normalmente injeta essas variáveis.

O script importa `hybridSearch` e `rerank` direto de `server/utils/rag/` —
o mesmo código que `/api/rag/match` usa em produção. Isso é deliberado:
uma reimplementação separada do pipeline para fins de teste corre o risco
de ficar dessincronizada da versão real sem ninguém perceber.

**O que o script NÃO chama:** a etapa de geração (GLM-5.2). Ela não é
determinística (a mesma bio pode gerar texto levemente diferente a cada
chamada) e não afeta recall/precision/NDCG/MRR, que medem só a lista de
ids recuperados — não a explicação em texto. Isso mantém o eval rápido e
barato de rodar sempre que algo mudar na busca ou no rerank.

## O que cada métrica mede

| Métrica | Pergunta que responde | Por que importa aqui |
|---|---|---|
| **recall@10** | Dos itens que deveriam aparecer, quantos apareceram nos 10 primeiros? | **Métrica principal do projeto.** Segue a Parte 1 do plano: esconder uma oportunidade real custa mais caro que mostrar uma errada com ressalva |
| **precision@5** | Dos 5 primeiros mostrados, quantos eram relevantes? | Mede se o topo da lista — o que o aluno realmente lê — é bom |
| **NDCG@10** | Recall, mas ponderado por posição (relevante na posição 1 vale mais que na posição 9) | Detecta o caso onde o item certo está tecnicamente no top 10, mas enterrado na posição 9 |
| **MRR** | 1 ÷ posição do primeiro item relevante | Prêmia aparecer relevante bem no topo rápido |
| **violação de barreira** | Fração dos recomendados que quebram uma restrição dura que o aluno marcou (ex: só gratuito, veio um pago) | Ao contrário das outras, aqui **menor é melhor**. Vira zero — nunca deve crescer |

Todas implementadas à mão em `scripts/eval/metrics.js`, sem biblioteca —
essa é a Parte 5.7 do plano: escrever você mesmo é o exercício de
aprendizado, e depois de implementar NDCG uma vez, você nunca mais lê um
desses números no piloto automático.

## Alvos iniciais (bússola, não nota de aprovação — Parte 8)

recall@10 ≥ 0.80
violação de barreira → tendendo a zero


Não existe alvo formal para precision@5, NDCG@10 e MRR ainda — eles
existem para você enxergar *onde* um recall baixo está doendo (top da
lista vs. cauda), não como gate isolado.

## Armadilha conhecida: não calibrar pesos no subset

Se você rodar o golden set antes do corpus completo estar rotulado, os
números vão parecer bons por motivo errado (menos concorrência pelo topo).
**Não recalibre pesos de ranking com um corpus parcial** — espere o corpus
completo (Parte 8, "Aviso sobre testar com subset").

## Histórico de execuções

Cada rodada salva um JSON com timestamp em `scripts/eval/results/`. Ainda
não há rodada registrada aqui — a primeira rodada de verdade deve
acontecer só depois que o golden set tiver os 30 perfis reais (Semana
12-13 do cronograma), não com os 2 perfis de exemplo.

## Avaliação de geração (RAGAS) — não implementada ainda

A Parte 5.7 do plano escolhe RAGAS (Python) rodado offline, lendo um JSON
exportado do app, para faithfulness e answer relevancy — sem integrar no
Next.js/Nuxt. Isso ainda não foi construído. Quando for, documentar aqui:
como exportar o JSON de interações, como rodar o script Python, e os
últimos números com data.