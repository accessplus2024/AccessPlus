# Accessia — Plano Técnico (o que falta / o que ainda governa decisões)

**Projeto:** RAG de recomendação de oportunidades acadêmicas para estudantes brasileiros de baixa renda (Fundamental → Gap Year), na plataforma AccessPlus.

> Este documento é o plano técnico original, **cortado para conter só o que ainda não foi construído ou o que continua sendo regra viva do sistema** (princípios de design, regras de segurança/ranking que todo código novo precisa respeitar). Tudo que já foi implementado, testado e decidido — schema, escolha de modelo de embedding/rerank/geração, prompt em produção, tabelas de rastreamento — está documentado com data e resultado real em `docs/decisions.md`. Quando este plano e `decisions.md` divergem, `decisions.md` vence: ele reflete o que existe, este documento reflete a intenção original.

---

## Parte 1 — Princípio orientador (regra viva, não uma tarefa)

> **O estudante deve ver a oportunidade com uma ressalva honesta, em vez de nunca vê-la porque um sinal fraco não bateu.**

- Só **`status = 'Aprovada'`** e **idade quando explicitamente declarada na fonte** são filtros rígidos. Idade não declarada → não filtra (ver Parte 3 abaixo — regra de segurança ainda não totalmente resolvida).
- Custo, idioma, localização, público-alvo → **badge visível + peso de ranking**, nunca exclusão.
- Campo desconhecido → "não confirmado", nunca presumido em nenhuma direção.

Todo código novo no pipeline de retrieval/ranking precisa ser checado contra esta regra antes de mergear.

---

## Parte 2 — Arquitetura (mapa, para orientação)

```
┌─────────────────────────────────────────────────────────┐
│  Botão "Accessia" (presente em todas as páginas)         │
│      ┌──────────────────┐    ┌──────────────────┐        │
│      │ Encontrar        │    │ Perguntas        │        │
│      │ oportunidades    │    │ gerais           │        │
│      └────────┬─────────┘    └────────┬─────────┘        │
└───────────────┼───────────────────────┼──────────────────┘
                │                       │
      ┌─────────▼─────────┐   ┌─────────▼─────────┐
      │ MODO MATCH        │   │ MODO GERAL        │
      │ (requer login)    │   │ (anônimo OK)      │
      └─────────┬─────────┘   └─────────┬─────────┘
                │                       │
   ┌────────────▼────────────┐   ┌──────▼──────────────┐
   │ 1. Filtro SQL (idade)   │   │ 1. Match de título   │
   │ 2. Busca híbrida        │   │    → se bater, vira  │
   │    (vetor + FTS + RRF)  │   │    modo específico   │
   │ 3. Rerank (NIM)         │   │ 2. LLM + citações     │
   │ 4. Geração (LLM)        │   │    (sem PII!)         │
   └─────────────────────────┘   └───────────────────────┘
```

Implementado: busca híbrida, rerank, geração, match de título (`server/utils/rag/`). **Não implementado:** modo geral com verificação externa (Parte 5), camada de segurança/detecção de sofrimento — removida por decisão do mantenedor e nunca reconstruída (ver `docs/decisions.md` Semana 8). Isso é uma lacuna real, não resolvida.

---

## Parte 3 — Idade: regra de segurança ainda não totalmente resolvida

O plano original previa colunas derivadas (`age_min`/`age_max`) preenchidas por uma extração explícita, nunca inferida de série escolar. Essas colunas **foram deliberadamente descartadas** em favor de deixar o LLM ler o texto de elegibilidade diretamente no momento da geração (ver `docs/decisions.md`, Semana 1). Consequência a manter em mente: **o filtro de segurança de idade hoje depende do LLM ler corretamente o texto de elegibilidade a cada geração, não de uma constraint SQL garantida.**

**Regra que não pode ser violada em nenhuma implementação futura, com ou sem coluna derivada:**

> Nunca infira idade a partir de série escolar ("ensino médio", "9º ano"). No Brasil existe distorção idade-série — alunos mais velhos que o esperado para a série, fortemente concentrados em baixa renda, escola pública e Norte/Nordeste. Inferir idade a partir de série excluiria sistematicamente esse aluno de olimpíadas e programas que nunca exigiram aquela idade. Sem número explícito → sem filtro.

**Se em algum momento isso for reconstruído como filtro determinístico** (em vez de depender do LLM), a extração deve aguentar: faixa completa, só teto, só piso, valor fracionário (arredondar para baixo), ano de nascimento (converter, mas marcar que envelhece a cada ciclo), e datas de corte vencidas (tratar como `null` + fila de revisão).

---

## Parte 4 — Ranking: regra de dado ausente (regra viva)

Um campo `null` (nunca rotulado) não pode pontuar como um *mismatch* real — senão oportunidades pouco documentadas afundam no ranking por motivos que nada têm a ver com o aluno.

```
match    → +1.0
null     → +0.5     ← "sem evidência em nenhuma direção"
mismatch → 0
```

Isso vale para qualquer sinal de boost adicionado no futuro (custo, idioma, localização, público-alvo) — não só os que já existem.

---

## Parte 5 — Não construído, desenhado: verificação externa e fila de auditoria

Dois recursos do plano original nunca foram construídos, e continuam fora do escopo até haver decisão de retomar:

**Verificação externa de oportunidade** (LLM de uso geral checa dado público contra a web, no modo "perguntas gerais"): regra de design já decidida para quando for construído — a resposta curada nunca aparece lado a lado com peso visual igual ao de uma divergência externa; divergência é bandeira, não resposta concorrente; desempate é sempre a página oficial, nunca duas IAs; citação sem link para o domínio oficial não vale nada.

**Fila de auditoria via comentário do aluno** (`audit_flags`): comentário marcado `flagged` e link morto (HTTP HEAD periódico) são sinais de auditoria de custo zero, priorizados acima de qualquer verificação por IA. Regra decidida: a Accessia **não** deve ler comentários como contexto de RAG (conteúdo não verificado de menor ganharia autoridade que não tem) — mas a UI exibe comentários normalmente, e um voluntário **propõe** correção enquanto staff **aplica**, nunca o inverso.

---

## Parte 6 — Segurança: itens pendentes

| Item | Status |
|---|---|
| RLS no Supabase (`profiles`, `ai_interactions`, `ai_quota`) | Confirmar que está ativo — não verificado nesta sessão |
| Camada de segurança / detecção de sofrimento | **Removida e não reconstruída.** Lacuna real documentada em `docs/decisions.md` Semana 8. Precisa de decisão antes de expor a rota a estudantes reais sem supervisão |
| Retenção de dados (texto livre de `searches`, `ai_interactions`) | Prazos definidos no plano original (texto livre ~12 meses, interações ~90 dias) — **automação de expiração não implementada** |
| Fluxo de exclusão de conta a pedido de um responsável (não só do aluno logado) | Não escrito. Necessário porque contas Google supervisionadas (Family Link) permitem que o pai revogue acesso e peça exclusão |
| Papel `Volunteer` em `admins` | Não existe — hoje só Admin/Editor/Viewer. Necessário antes de abrir a fila de auditoria (Parte 5) a voluntários externos |

**Decisão já tomada e válida, não revisitar sem motivo novo:** sem porta de idade — contas supervisionadas via Family Link já implicam autorização parental explícita para OAuth de terceiros, mais forte que qualquer checkbox declarativo. Bloquear menores de 13 não reduziria exposição legal (todos os usuários já são menores) e esconderia justamente as oportunidades voltadas àquela faixa.

---

## Parte 7 — Técnicas avaliadas e descartadas (não reabrir sem dado novo)

| Técnica | Veredito | Por quê |
|---|---|---|
| ColBERT (late interaction) | Descartar | Multiplicaria vetores por ~500× (1 por token) e exigiria infra multivector (Qdrant/Vespa/PLAID) que pgvector não faz nativamente — reordenar poucos candidatos via cross-encoder resolve sem infra nova |
| Rede em grafo para progressão entre programas | Adiar | As relações reais são uma tabela de junção, não travessia de grafo. Revisitar só se as regras de progressão crescerem demais para viver como dado |
| Fine-tuning (gerador ou embedding) | Descartar / Adiar | Precisa de milhares de exemplos rotulados ou dado de uso real em escala que o projeto ainda não tem |
| IA agêntica no pipeline de match | Adiar | Pipeline fixo é previsível e debugável; imprevisibilidade é troca ruim quando erro custa tempo real de um estudante |
| Roteador com classificador LLM | Removido definitivamente | A UI (botão de modo) já resolve essa escolha — não reconstruir |

---

## Parte 8 — Golden set: metodologia (prática viva, expandir continuamente)

O golden set real vive em `scripts/eval/golden-set.json` e roda via `npm run eval:golden-set`; números medidos ficam em `docs/eval.md`. Esta seção documenta só a metodologia, para quem for adicionar perfis novos.

**Formato de um caso:**

```yaml
id: perfil-03
perfil:
  idade: 16
  nivel: Ensino Médio
  uf: PE
  linguas: [Português]
  condicao_financeira: precisa_gratuito
  areas: [Humanas, Linguagens]
  bio: >
    Estudo em escola pública em Recife, gosto muito de escrever
    e de discutir política. Nunca saí do Brasil e meu inglês é básico.
deve_aparecer_no_top10:
  - Parlamento Jovem Brasileiro
nao_deve_aparecer_no_top5:
  - ProLíder             # 18-35, idade errada
observacao: >
  Programas em inglês PODEM aparecer com badge de idioma — não é erro.
  Mas não devem ocupar as 3 primeiras posições dado o inglês básico.
```

**Recall@10 é a métrica principal** (esconder algo relevante é o erro mais caro, per Parte 1). **Nunca leia faithfulness sem recall ao lado** — um sistema pode recuperar um conjunto parcial e escrever com confiança só sobre esse pedaço, pontuando ótimo em faithfulness enquanto esconde o resto.

Todo perfil novo deve incluir pelo menos um caso de distorção idade-série (aluno mais velho que o esperado para a série, ver Parte 3) sempre que a lógica de idade for tocada — é o teste direto de que nada foi indevidamente escondido por inferência incorreta.

**Não calibre pesos de ranking com um golden set pequeno** — poucos casos rotulados inflam recall/precision artificialmente por falta de competição pelo topo.

---

## Parte 9 — Perguntas em aberto

1. **Papel `Volunteer` em `admins`** (ver Parte 6) — adicionar um papel novo, ou usar Viewer + gate de status `proposed → confirmed`?
2. **Camada de segurança removida** (Parte 2 e 6) — precisa de decisão explícita do mantenedor antes de expor a rota sem supervisão.
3. **Verificação externa e fila de auditoria** (Parte 5) — quando retomar, se retomar.
