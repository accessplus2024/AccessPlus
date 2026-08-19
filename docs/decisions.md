# decisions.md

Log de decisões técnicas do Accessia. Cada entrada: o que foi decidido, o que foi rejeitado, e por quê — para não refazer decisões de memória.

---

## Semana 3 — Modelo de embedding

**Decisão:** `llama-nemotron-embed-1b-v2` (NVIDIA NIM), 1024 dimensões. Os dois candidatos originalmente planejados (`llama-3.2-nv-embedqa-1b-v2`, `llama-3.2-nemoretriever-300m-embed-v2`) estavam descontinuados — este foi o terceiro testado e confirmado ativo. 1024 em vez do teto nativo (2048): corpus pequeno não precisa da dimensão máxima para recall bom (Parte 4.6 do plano).

---

## Semana 5 — Comparação de modelos (medir, não adivinhar)

**Testado:** atual vs. `nemotron-3-embed-1b` (benchmarks globais superiores), em golden set parcial de 4 casos, busca vetorial pura. **Resultado:** recall@10 médio 0.750 (atual) vs. 0.667 (candidato) — o candidato não venceu em nenhum caso. **Decisão: manter o atual.** Confirma com dado próprio que posição em leaderboard multilíngue não prevê bem desempenho em PT-BR. Custo adicional de trocar: `nemotron-3-embed-1b` não suporta Matryoshka (travado em 2048 dims) e exigiria reembeddar tudo (regra da Parte 6).

**Nota:** 4 casos é calibração inicial, não conclusão estatística — a comparação real acontece no gate do golden set completo.

---

## Semana 8 — Camada de segurança do roteador: removida (pendência aberta)

Uma primeira versão (`server/utils/rag/safetyCheck.js`) detectava sinais de sofrimento/crise por busca de termos em três categorias (autolesão; exploração/violência infantil; ansiedade/depressão), sem log do texto do aluno. **Removida inteiramente de `/api/rag/match`** a pedido do mantenedor, por risco de uma lista de termos não revisada por profissional — especialmente na categoria com implicação legal via ECA.

**Isto é uma lacuna de segurança real e conhecida, não um esquecimento.** Antes de expor a rota a estudantes reais, decidir: reintroduzir a camada (revisada por alguém com formação em saúde mental/direito da criança), ou documentar formalmente a decisão de operar sem ela. Código da versão removida preservado no histórico do git.

---

## Semana 9 — Modelo de rerank

**Decisão:** `llama-nemotron-rerank-vl-1b-v2` (NVIDIA NIM), endpoint `.../retrieval/nvidia/{modelo}/reranking` (formato diferente do endpoint de embeddings). Os dois candidatos originais estavam descontinuados/404. Validado com um par claro (biologia vs. intercâmbio, discriminação correta) e em uso real (promoveu a OBOB do 3º ao 1º lugar por sobreposição textual genuína com a query).

---

## Semana 10 — Modelo de geração (modo match)

**Decisão:** `z-ai/glm-5.2` via NVIDIA NIM (mesma `NVIDIA_API_KEY` do embedding/rerank — sem credencial nova), em `server/utils/rag/generate.js`. Já usado no pipeline "Sentinel" do app; reaproveitado porque satisfaz a política de não-treino exigida para dado de estudante (Parte 5.4 do plano). `meta/llama-3.1-8b-instruct` respondeu rápido em teste; variantes 70B deram timeout repetido (90s+, provável cold-start do free tier) — não bloqueou a decisão.

**Saída estruturada:** JSON mode (`response_format: json_object`) com validação manual de ~15 linhas, não Zod/Vercel AI SDK — o projeto não tem essa dependência e instalar um SDK inteiro por uma função não se pagava.

**Ancoragem:** só recebe oportunidades já reranqueadas (tipicamente 8), campos `null` marcados explicitamente "não confirmado" (nunca em branco). System prompt segue as regras da Parte 12 do plano.

**Degradação graciosa (não retry):** se o JSON de geração vem malformado, `/api/rag/match` devolve as oportunidades reranqueadas mesmo assim, com `generationDegraded: true` — nunca um 500 que descarta um retrieval que funcionou.

---

## Semana 10 (continuação) — Desconexão do Accessia v0

**Achado crítico:** `server/api/rag/search.js`, `status.get.js` e `server/utils/ragQuota.js` (Accessia v0, em produção, chamava Gemini direto) estavam staged para deleção, mas `components/AccessIA.vue` — o wizard que o aluno realmente usa — ainda chamava esse contrato antigo. O backend novo (`/api/rag/match`) tinha rota, entrada e saída completamente diferentes: a feature estava a um commit de virar 404.

**Decisão: desconectar o v0 por completo, sem adaptador de compatibilidade.** `AccessIA.vue` reescrito para falar `POST /api/rag/match` com `{ freeText, keywordText }` diretamente; cartões agora renderizam `why_it_fits`/`caveats` por item (mais alinhado à Parte 1 do que o parágrafo único do v0); a tela de "cota esgotada, volte amanhã" (desenhada pro limite diário restritivo do Gemini free tier) foi removida — a NIM tem limite bem mais alto.

**Substituto provisório da cota:** rate limit por IP (`server/utils/rateLimit.js`, já existia, reaproveitado do endpoint de newsletter) — 15 buscas/10min. Proteção contra abuso, não a cota real por aluno (`ai_quota`, construída na Semana 11).

**Pendência de schema notada:** os campos de perfil da Parte 2 do plano (`birth_year`, `uf`, `linguas`, `condicao_financeira`) existem só no dev isolado. O cadastro real de produção usa schema mais antigo (`age`, `city`, `state`, `income`) sem `linguas`/`condicao_financeira` — os dois campos que a Parte 7 usa como boost. Sem eles, a busca roda hoje só com texto livre, sem personalização por perfil salvo.

---

## Semana 11 — `ai_quota` + `ai_interactions`, gate de login

**Decisão de arquitetura: `ai_quota`/`ai_interactions` vivem no Supabase de DEV, não produção** — mantendo o isolamento deliberado do banco de produção desde a Semana 1, mesmo que tecnicamente pertencessem a produção.

**Consequência aceita:** sem `profiles` no dev, `user_id` nessas tabelas não tem foreign key, e o servidor não consegue verificar o token JWT (emitido por produção). `/api/rag/match` **confia no `userId` que o frontend manda** — spoofável. Aceito por ora: volume baixo, dado não sensível o bastante para justificar verificação cross-projeto; resolver de verdade exige ou uma chamada pontual a produção, ou esperar auth+RAG morarem no mesmo projeto (cutover maior, fora de escopo).

**Schema** (`docs/sql/2026-08-ai-quota-interactions.sql`, rodado manualmente): `ai_quota(user_id, mode, period, count)` — cota de 5/mês no modo match, sem trava atômica real (risco de corrida aceito no volume atual). `ai_interactions(...)` nunca grava texto livre do aluno, só ids e metadados.

**Login:** reaproveitado o componente `<AccessGate>` que já existia (usado em páginas de oportunidade) em vez de construir tela nova — cobre deslogado/sem-cadastro/completo. Backend também exige `userId` e devolve 401 se ausente (defesa em profundidade, não confia só na UI). Falha em `logInteraction` vai só pro console — nunca derruba a resposta ao aluno.

---

## Contagens do corpus (ago/2026)

Plano original citava 224 aprovadas + 48 revisão = 272. Real no dev, Semana 3: 214 aprovadas + 61 revisão = 275 — diferença é curadoria contínua, não bug. O pipeline consulta a contagem real a cada execução, nunca um número fixo.

---

## Semana 11 (continuação) — Accessia vira chat flutuante global

**Decisão:** widget sai de `Header.vue` (só home) e vira chat flutuante em todas as páginas — já era a arquitetura pretendida (Parte 3 do plano); a implementação da Semana 10 só ficou restrita à home por conveniência. **Adiado** até depois do gate de calibração (Semanas 12-13): mover UI é reversível e barato, recalibrar ranking sem medir primeiro não é. Quando chegar a vez: extrair lógica de `AccessIA.vue` do `Header.vue`, decidir onde o componente monta, confirmar que `<AccessGate>` funciona fora da home.

---

## Semana 11 (continuação) — Sync produção → dev do catálogo

**Achado:** produção tinha 292 linhas em `opportunities` contra 274 em dev — 24 oportunidades aprovadas depois do dump original da Semana 1 nunca chegaram ao índice de busca.

**Decisão:** `scripts/sync-opportunities-from-prod.js`, manual (sem cron). Lê produção via `service_role`, compara coluna por coluna, só faz `UPDATE` nas linhas com mudança real (preserva o sinal `embedded_at < updated_at` do re-embedding incremental).

**Achados da primeira execução:**
- Schema drift real: produção tinha `start_date` e `format`, que dev não tinha — adicionadas ao dev e ao script.
- Terceiro valor de status confirmado: produção tem 206 Aprovada / 52 Encerrada / 34 Revisar. `Encerrada` continua dobrada em `Revisar` no dev (idênticas para o pipeline de RAG).
- 6 linhas existem só no dev (provavelmente arquivadas em produção depois do dump) — script avisa, não apaga. Decisão de produto pendente.
- Tabelas só de produção (`sentinel_*`) deliberadamente não espelhadas — nada no código de RAG as referencia.

**Dois bugs corrigidos na primeira sessão de uso (não reintroduzir):** (1) comparação de arrays não ignorava ordem, inflando "mudanças" falsas — corrigido ordenando antes de comparar; (2) comparação de `status` usava o valor bruto de produção contra o valor já mapeado do dev, fazendo as 52 `Encerrada` aparecerem como mudadas em todo run — corrigido comparando valores já mapeados. Depois dos fixes: 0 novas, 0 alteradas, 292 inalteradas — sync genuinamente em dia.

**Credencial nova:** `PROD_SUPABASE_SERVICE_ROLE_KEY`/`PROD_SUPABASE_URL` no `.env` raiz, usada só por este script manual.

---

## Plano de merge dev → produção (rascunho)

Dev acumulou schema/dado que produção nunca teve (`opportunity_chunks`, `searches`, `student_activities`, `ai_quota`, `ai_interactions`, colunas derivadas em `opportunities`). Sequência proposta, nenhuma etapa antes da anterior fechar:

1. Gate de calibração do golden set primeiro, sem exceção.
2. Migrar schema antes de dado — pode acontecer bem antes do cutover de tráfego.
3. Reconciliar o schema de perfil divergente (produção: `age`/`city`/`state`/`income`; dev: `birth_year`/`uf`/`linguas`/`condicao_financeira`) — sem isso o cutover perde personalização.
4. Resolver o `userId` spoofável (Semana 11) — só fica verificável de verdade depois que RAG e auth morarem no mesmo projeto.
5. Backfill de embeddings em produção do zero, não cópia de `opportunity_chunks` (ids podem não bater; mesma lógica da Parte 6).
6. Aposentar `sync-opportunities-from-prod.js` depois do cutover — deixa de fazer sentido com um banco só.
7. Decidir as 6 linhas órfãs do dev antes do passo 5.

**Deliberadamente não decidido:** se o cutover é evento único ou migração gradual por feature flag — depende do tráfego real quando o golden set passar no gate.

---

## Semana 11 (continuação) — Retagging de `areas`, `keywords`, `audience`

**Problema de origem:** `areas` com 24% do catálogo marcado em todas as 5 categorias ao mesmo tempo (destrutivo pra busca); `keywords` texto livre com 85% vazio; `audience` vazio em 290/292 linhas.

**Vocabulário controlado decidido:** `areas`/`keywords` compartilham 9 categorias (STEM, Humanas, Linguagens, Artes, Meio Ambiente, Politica, Empreendedorismo, Tech, Ativismo). `audience` usa 6 (Baixa Renda, Meninas, Indígena/Quilombola, Negro/Pardo, PCD, Escola Pública) — ampliado de 5 durante a revisão depois de achar um caso real de ação afirmativa racial (Bolsa Crimson) sem categoria correspondente.

**Modelo usado:** Gemini free tier bateu limite de 20 req/dia (inviável para 292 linhas); GLM-5.2 via NIM já tinha estourado cota própria na sessão; `meta/llama-3.1-8b-instruct` (mesma chave NIM) funcionou sem throttling — capaz o suficiente dado que a rede de segurança real é revisão humana antes de aplicar, não a qualidade do modelo.

**Qualidade checada manualmente:** 2 falsos positivos corrigidos antes de aplicar (IPhCO, OBOL — elegibilidade real é pública OU privada); 8/292 linhas saíram com `keywords: []` apesar de `areas` preenchido, corrigidas e o script ganhou fallback de código para isso.

**Constraints de banco adicionadas no dev** (`opportunities_areas_valid`, `opportunities_keywords_valid`, `opportunities_audience_valid` via `<@` contra as listas acima) — ainda precisam entrar na migração de schema para produção (passo 2 do plano de merge).

> **⚠️ Achado divergente (2026-08-19, sessão de cleanup):** uma query ao vivo mostra `audience` vazio em 205/208 linhas aprovadas em produção e 206/209 em dev — o mesmo estado do "problema de origem", não o resultado de "292/292 atualizadas" descrito acima. Causa desconhecida (nunca aplicado de fato? revertido por sync/merge posterior?) — o mantenedor confirmou não saber. **Decisão: não investigar a causa agora.** A Accessia segue usando inferência por LLM para preencher `audience` (`scripts/backfill-audience-language-location.js`), tratando o estado atual do banco como fonte da verdade, não esta entrada. Esta seção fica como histórico do que foi tentado, não como estado atual dos dados.

---

## Semana 11 (continuação) — Onde `audience` realmente age no pipeline (achado, não decisão)

**O que existe de verdade:** `opportunities.audience` e `metadata` (jsonb, populada por trigger a partir de `cost`/`location`/`keywords`/`type`/`level`/`audience`/`language`).

**Onde `audience` NÃO chega:** `searchable_text` (a base do FTS) é montada só de título/descrição/elegibilidade/areas/keywords — `audience` nunca entra. **`audience` tem efeito zero no retrieval hoje**, vetorial ou FTS.

**Onde chega, só narrativamente:** `match.post.js` seleciona `audience`/`metadata`; `generate.js` já passava `audience` pro LLM (campo "público-alvo", preexistente) — o modelo pode mencionar isso em `why_it_fits`/`caveats`, mas não há regra explícita no system prompt sobre o que fazer com esse campo.

**Achado real: `metadata` é buscado e nunca usado.** A Parte 7 do plano descreve um passo de "reweight" (reordenar por custo/idioma/local/audience via `metadata`, nunca excluir) que **nunca foi implementado** — desenhado no plano, nunca virou código. Não é regressão desta sessão, é lacuna preexistente só agora descoberta.

**Também não há entrada estruturada do lado do aluno** — `match.post.js` só aceita texto livre, sem o checkbox de autodeclaração da Parte 3 do plano. Mesmo com reweight implementado, hoje não haveria contra o que comparar.

**Decisão pendente:** implementar o reweight agora, ou adiar para depois do gate do golden set (é mudança de lógica de ranking, e o golden set é o instrumento certo para medir se ajuda ou atrapalha).
