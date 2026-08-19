// Sincroniza o catálogo de oportunidades de PRODUÇÃO para o Supabase de
// DEV isolado (Semana 1 do plano: dev existe pra proteger dado real de
// aluno, mas isso não inclui `opportunities` — é dado público de programa).
//
// Por que isto não existia até agora: o dev foi populado por um `pg_dump`
// ÚNICO na Semana 1. Desde então, nada mantém as duas bases em sincronia —
// oportunidades novas aprovadas em produção, ou edições em oportunidades
// existentes, nunca chegam ao dev, e portanto nunca entram no índice de
// busca da Accessia.
//
// O que este script faz, e por quê:
// 1. Lê TODAS as linhas de `opportunities` em produção (não só as
//    aprovadas) — a Parte 6 do plano quer que as linhas 'Revisar' também
//    existam no dev, prontas pra embeddar no instante em que forem
//    aprovadas, sem precisar rodar este sync de novo.
// 2. Compara cada linha com a versão já existente no dev, coluna por
//    coluna, e só faz UPDATE nas que genuinamente mudaram.
//    Isso importa porque o dev tem um trigger (`opportunities_touch`) que
//    carimba `updated_at` em QUALQUER UPDATE, mudou o conteúdo ou não. Se
//    este script atualizasse as 272 linhas toda vez que rodasse, todas
//    ficariam com `updated_at` novo e o re-embedding incremental (que lê
//    `embedded_at < updated_at`) trataria o catálogo inteiro como
//    desatualizado sempre — exatamente o problema que o incremental existe
//    pra evitar (Parte 6 do plano).
// 3. Insere linhas novas (aprovadas depois do pg_dump original).
// 4. Avisa (não apaga) sobre linhas que existem no dev mas sumiram de
//    produção — decisão de produto, não do script.
//
// Como rodar:
//   npm run sync:opportunities
//
// Requer PROD_SUPABASE_URL, PROD_SUPABASE_SERVICE_ROLE_KEY, DEV_SUPABASE_URL
// e DEV_SUPABASE_SERVICE_ROLE_KEY no .env da raiz do projeto.

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") }); // le o .env da raiz, onde as credenciais de prod/dev vivem juntas

const PROD_URL = process.env.PROD_SUPABASE_URL;
const PROD_SERVICE_ROLE_KEY = process.env.PROD_SUPABASE_SERVICE_ROLE_KEY;
const DEV_URL = process.env.DEV_SUPABASE_URL;
const DEV_SERVICE_ROLE_KEY = process.env.DEV_SUPABASE_SERVICE_ROLE_KEY;

if (!PROD_URL || !PROD_SERVICE_ROLE_KEY || !DEV_URL || !DEV_SERVICE_ROLE_KEY) {
  console.error(
    "Faltam variáveis em scripts/.env.sync (PROD_SUPABASE_URL, PROD_SUPABASE_SERVICE_ROLE_KEY, DEV_SUPABASE_URL, DEV_SUPABASE_SERVICE_ROLE_KEY)."
  );
  process.exit(1);
}

const prodSupabase = createClient(PROD_URL, PROD_SERVICE_ROLE_KEY);
const devSupabase = createClient(DEV_URL, DEV_SERVICE_ROLE_KEY);

// Colunas de CATÁLOGO — existem nas duas bases, com o mesmo significado.
// Deliberadamente NÃO inclui as colunas que só existem no dev e são
// gerenciadas pelo próprio dev (updated_at via trigger, embedded_at,
// embedding_model, searchable_text, fts, metadata) — essas nunca devem
// ser copiadas de produção, ou o script apagaria o progresso de embedding.
const CATALOG_COLUMNS = [
  "title",
  "description",
  "link",
  "deadline",
  "areas",
  "level",
  "location",
  "audience",
  "cost",
  "language",
  "keywords",
  "eligibility",
  "process",
  "applicants",
  "additionals",
  "resources",
  "status",
  "review",
  "type",
  "start_date", // adicionada em dev nesta sessão — antes só existia em produção
];

// REMOVIDO em 2026-08-19: "format" (Remoto/Híbrido/Presencial) foi consolidado
// dentro de "location" (auditoria do pipeline de RAG — ver docs/decisions.md).
// "format" nunca era lido por nenhum caminho de busca/geração real
// (server/utils/rag/*, match.post.js) — só existia duplicado aqui e em
// "location" quando location também era só a palavra genérica. Manter as
// duas colunas em sync era trabalho sem benefício e uma fonte a mais de
// inconsistência. Se produção ainda tiver uma coluna "format" própria, ela
// simplesmente para de ser copiada — não precisa ser apagada de produção.

// Precedente da Semana 1 (ver PLAN.md, seção final): produção tem um
// terceiro valor real de status ('Encerrada') que o dev nunca teve — a
// constraint opportunities_status_check em dev só permite 'Aprovada'/
// 'Revisar'. Na importação original, 'Encerrada' foi dobrada em 'Revisar'
// porque as duas já significam a mesma coisa pro pipeline de RAG (nunca
// embeddada, nunca recomendada — só 'Aprovada' conta). Aplicamos a MESMA
// regra aqui, não uma nova, pra manter o sync consistente com a decisão
// já tomada.
function mapearStatusParaDev(status) {
  return status === "Encerrada" ? "Revisar" : status;
}

function valoresIguais(a, b) {
  // Compara de forma estável mesmo quando um lado é null/undefined e o
  // outro é string vazia ou array vazio — trata os dois como "sem valor".
  const normalizar = (v) => {
    if (v === null || v === undefined) return null;
    if (Array.isArray(v)) {
      if (v.length === 0) return null;
      // Ordem não importa pra arrays de catálogo (keywords/areas/audience) —
      // duas listas com os mesmos itens em ordem diferente NÃO são uma
      // mudança real. Comparar sem ordenar gerou falsos positivos na
      // primeira rodada deste sync (quase toda linha marcada como alterada).
      return [...v].sort();
    }
    if (typeof v === "string" && v.trim() === "") return null;
    return v;
  };
  return JSON.stringify(normalizar(a)) === JSON.stringify(normalizar(b));
}

async function buscarTodasAsLinhas(client, colunas) {
  // Supabase pagina em blocos de 1000 por padrão — com 272 linhas isso
  // nunca dispararia, mas paginar mesmo assim custa nada e evita um
  // surpresa silenciosa se o catálogo crescer bastante.
  const PAGE_SIZE = 1000;
  let todas = [];
  let inicio = 0;
  for (;;) {
    const { data, error } = await client
      .from("opportunities")
      .select(colunas.join(", "))
      .range(inicio, inicio + PAGE_SIZE - 1)
      .order("id");
    if (error) throw new Error(`Erro ao buscar opportunities: ${error.message}`);
    todas = todas.concat(data);
    if (data.length < PAGE_SIZE) break;
    inicio += PAGE_SIZE;
  }
  return todas;
}

async function main() {
  console.log("Lendo catálogo de PRODUÇÃO...");
  const prodRows = await buscarTodasAsLinhas(prodSupabase, ["id", ...CATALOG_COLUMNS]);
  console.log(`  ${prodRows.length} linhas em produção.`);

  console.log("Lendo catálogo de DEV...");
  const devRows = await buscarTodasAsLinhas(devSupabase, ["id", ...CATALOG_COLUMNS]);
  console.log(`  ${devRows.length} linhas em dev.`);

  const devPorId = new Map(devRows.map((row) => [row.id, row]));
  const prodIds = new Set(prodRows.map((row) => row.id));

  const novas = [];
  const atualizadas = [];
  const inalteradas = [];

  for (const prodRow of prodRows) {
    const devRow = devPorId.get(prodRow.id);

    if (!devRow) {
      novas.push(prodRow);
      continue;
    }

    // Compara "status" já mapeado (Encerrada -> Revisar), senão as 52 linhas
    // Encerrada de produção apareceriam como "mudadas" pra sempre, todo run.
    const camposMudados = CATALOG_COLUMNS.filter((coluna) => {
      const valorProd = coluna === "status" ? mapearStatusParaDev(prodRow[coluna]) : prodRow[coluna];
      return !valoresIguais(valorProd, devRow[coluna]);
    });

    if (camposMudados.length === 0) {
      inalteradas.push(prodRow);
      continue;
    }

    atualizadas.push({ id: prodRow.id, title: prodRow.title, camposMudados, prodRow });
  }

  const sumiramDeProducao = devRows.filter((row) => !prodIds.has(row.id));

  // Inserções: linha inteira, só com as colunas de catálogo (as colunas
  // derivadas do dev assumem os defaults da tabela: embedded_at fica null,
  // então o próximo `npm run embed` já pega essa linha nova naturalmente).
  if (novas.length > 0) {
    console.log(`\nInserindo ${novas.length} oportunidade(s) nova(s)...`);
    const linhasParaInserir = novas.map((row) => {
      const linha = { id: row.id };
      for (const coluna of CATALOG_COLUMNS) linha[coluna] = row[coluna];
      linha.status = mapearStatusParaDev(linha.status);
      return linha;
    });
    const { error } = await devSupabase.from("opportunities").insert(linhasParaInserir);
    if (error) throw new Error(`Erro ao inserir oportunidades novas: ${error.message}`);
    novas.forEach((row) => console.log(`  + [${row.id}] ${row.title}`));
  }

  // Atualizações: só as colunas que realmente mudaram, uma linha por vez —
  // dispara o trigger opportunities_touch SÓ nessas linhas, o que é
  // exatamente o sinal que o re-embedding incremental (Parte 6) espera.
  if (atualizadas.length > 0) {
    console.log(`\nAtualizando ${atualizadas.length} oportunidade(s) com mudança real...`);
    for (const { id, title, camposMudados, prodRow } of atualizadas) {
      const patch = {};
      for (const coluna of camposMudados) patch[coluna] = prodRow[coluna];
      if ("status" in patch) patch.status = mapearStatusParaDev(patch.status);
      const { error } = await devSupabase.from("opportunities").update(patch).eq("id", id);
      if (error) throw new Error(`Erro ao atualizar oportunidade ${id}: ${error.message}`);
      console.log(`  ~ [${id}] ${title} — campos alterados: ${camposMudados.join(", ")}`);
    }
  }

  if (sumiramDeProducao.length > 0) {
    console.log(
      `\n⚠️  ${sumiramDeProducao.length} oportunidade(s) existem no dev mas não foram encontradas em produção — NÃO apagadas automaticamente, decida manualmente:`
    );
    sumiramDeProducao.forEach((row) => console.log(`  ? [${row.id}] ${row.title}`));
  }

  console.log("\n── Resumo ──────────────────────────");
  console.log(`novas:        ${novas.length}`);
  console.log(`atualizadas:  ${atualizadas.length}`);
  console.log(`inalteradas:  ${inalteradas.length} (nada tocado — embedded_at preservado)`);
  console.log(`sumidas:      ${sumiramDeProducao.length} (revisar manualmente)`);

  if (novas.length > 0 || atualizadas.length > 0) {
    console.log("\nPróximo passo: rode `npm run embed` para gerar embeddings das linhas novas/alteradas.");
  } else {
    console.log("\nNada mudou — não precisa rodar `npm run embed`.");
  }
}

main().catch((err) => {
  console.error("Erro no sync:", err.message);
  process.exit(1);
});
