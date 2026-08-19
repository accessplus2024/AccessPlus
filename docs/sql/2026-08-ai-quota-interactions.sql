-- Semana 11 do plano: ai_quota (Parte 5.5) + ai_interactions (Parte 9).
-- Rode este arquivo inteiro no SQL Editor do projeto DEV do Supabase
-- (o mesmo onde vivem `opportunities` e `opportunity_chunks` — NÃO o de
-- produção).
--
-- Por que sem foreign key pra `profiles`: o login/cadastro real (tabela
-- `profiles`) vive só no Supabase de PRODUÇÃO — por decisão explícita do
-- mantenedor, este projeto de dev não sincroniza dado de estudante real,
-- só o catálogo de oportunidades (não-PII). Então `user_id` aqui é um uuid
-- "solto": o valor que o frontend manda (o id da sessão logada via Supabase
-- Auth de produção), sem constraint de integridade referencial contra uma
-- tabela `profiles` que não existe neste banco. Isso é uma limitação
-- conhecida, não um esquecimento — ver docs/decisions.md.

create table if not exists public.ai_quota (
  user_id uuid not null,
  mode text not null check (mode in ('match', 'general')),
  period text not null,              -- 'AAAA-MM' pro modo match (limite mensal)
  count int not null default 0,
  primary key (user_id, mode, period)
);

create table if not exists public.ai_interactions (
  id bigint generated always as identity primary key,
  user_id uuid,                      -- null = anônimo (modo geral, futuro)
  session_id text not null,
  mode text not null check (mode in ('match', 'general', 'specific')),
  retrieved_ids bigint[],            -- o que a fusão RRF devolveu
  reranked_ids bigint[],             -- o que sobreviveu ao rerank
  shown_ids bigint[],                -- o que o aluno de fato viu (== reranked, por ora)
  clicked_id bigint,                 -- preenchido depois, por outro endpoint (fora de escopo hoje)
  latency_ms int,
  models_used jsonb,                 -- {"embed": "...", "rerank": "...", "generate": "..."}
  generation_degraded boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists ai_interactions_created_idx
  on public.ai_interactions (created_at desc);

create index if not exists ai_interactions_user_idx
  on public.ai_interactions (user_id, created_at desc);
