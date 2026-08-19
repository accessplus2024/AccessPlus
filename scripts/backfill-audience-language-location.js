// Backfill de audience/language/location via LLM (Fase 0 do plano original,
// PLAN.md linha ~805: "Extração assistida por LLM + revisão humana" — nunca
// tinha sido feita). Escrito em 2026-08-19 durante a auditoria do pipeline
// de RAG: audience estava vazio em 206/209 aprovadas, language em 129/209.
//
// IMPORTANTE — não roda sozinho ainda: no momento em que este script foi
// escrito, o endpoint de chat completions da NIM (z-ai/glm-5.2) estava
// devolvendo 429 (Too Many Requests) de forma persistente, mesmo com
// embeddings e rerank funcionando normalmente — parece cota diária do free
// tier esgotada, não rate-limit de minuto. Teste com uma chamada simples
// antes de rodar em lote:
//   node -e "fetch('https://integrate.api.nvidia.com/v1/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+process.env.NVIDIA_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:'z-ai/glm-5.2',messages:[{role:'user',content:'oi'}],max_tokens:5})}).then(r=>r.status).then(console.log)"
// Se voltar 200, pode rodar `node scripts/backfill-audience-language-location.js`.
//
// Escreve TUDO num único UPDATE por linha (audience+language+location juntos)
// pra não disparar o trigger opportunities_touch 3x por oportunidade — ver o
// mesmo cuidado em sync-opportunities-from-prod.js.
//
// Gera um log de auditoria completo (antes/depois/evidência por campo) em
// scripts/backfill-audit-log.json pra você revisar antes de confiar no
// resultado — a Parte 8 do plano pede revisão humana, isto não substitui.

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const DEV_URL = process.env.DEV_SUPABASE_URL;
const DEV_KEY = process.env.DEV_SUPABASE_SERVICE_ROLE_KEY;
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;

if (!DEV_URL || !DEV_KEY || !NVIDIA_API_KEY) {
  console.error("Faltam DEV_SUPABASE_URL, DEV_SUPABASE_SERVICE_ROLE_KEY ou NVIDIA_API_KEY no .env da raiz.");
  process.exit(1);
}

const supabase = createClient(DEV_URL, DEV_KEY);

const AUDIENCE_OPTIONS = ["Escola Pública", "Indígena/Quilombola", "Negro/Pardo", "Baixa Renda"];

const SYSTEM_PROMPT = `Você está ajudando a preencher campos vazios no catálogo de oportunidades da AccessPlus (plataforma brasileira para estudantes de ensino fundamental/médio). Você NUNCA inventa informação — só extrai o que está EXPLICITAMENTE dito no texto.

Para cada oportunidade, preencha três campos:

1. "audience": array de zero ou mais tags, escolhidas SOMENTE desta lista fechada: ${JSON.stringify(AUDIENCE_OPTIONS)}. Inclua uma tag apenas se o texto disser explicitamente que o programa é voltado/prioriza/exige esse grupo (ex: "prioridade para alunos de escola pública", "para estudantes de baixa renda", "voltado a comunidades indígenas e quilombolas"). Se o texto não menciona nenhum critério assim, devolva um array vazio — a MAIORIA dos programas não tem esse recorte, e isso é o resultado correto, não uma falha.

2. "language": o idioma em que o programa/curso/atividade É CONDUZIDO (não o idioma da descrição, que está sempre em português). Se o texto menciona que as atividades, aulas, entrevistas ou o processo seletivo são em inglês, "Inglês". Se claramente em português, "Português". Se dois idiomas explícitos, junte como "Inglês e Italiano" (mesmo padrão já usado no catálogo). Se não houver NENHUMA pista clara sobre o idioma de condução, devolva null — não adivinhe pelo país.

3. "location_final": uma única string de local, seguindo este padrão:
   - "Remoto" — se é 100% online/remoto, sem nenhuma etapa presencial
   - "Híbrido — <lugar>" — se tem parte remota e parte presencial, com <lugar> = cidade/instituição/país da parte presencial
   - "Presencial — <lugar>" — se é inteiramente presencial, com <lugar> = cidade/instituição/país
   Se "local_atual" já é uma string específica (contém nome de lugar, não só a palavra Remoto/Presencial/Híbrido sozinha), REPITA exatamente "local_atual" sem mudar nada — ele já está correto. Se "local_atual" é null ou é só a palavra genérica (Remoto/Presencial/Híbrido) e você NÃO encontra um lugar específico no texto, repita a palavra genérica sozinha (não invente cidade). Use "formato_atual" como pista forte de qual categoria (Remoto/Híbrido/Presencial) usar quando o texto não deixar claro.

Responda APENAS com um objeto JSON: {"resultados": [{"id": <id>, "audience": [...], "language": ... ou null, "location_final": "...", "evidencia": "trecho curto do texto que embasou audience/language, ou 'nenhuma pista' "}]}
Inclua uma entrada para CADA oportunidade recebida, na mesma ordem, sem pular nenhuma.`;

function buildUserMessage(batch) {
  const items = batch.map((o) => `<oportunidade id="${o.id}">
titulo: ${o.title}
descricao: ${o.description ?? ""}
elegibilidade: ${o.eligibility ?? ""}
processo: ${o.process ?? ""}
formato_atual: ${o.format ?? "null"}
local_atual: ${o.location ?? "null"}
idioma_atual: ${o.language ?? "null"}
audience_atual: ${JSON.stringify(o.audience ?? [])}
</oportunidade>`).join("\n\n");
  return `Preencha os campos para estas ${batch.length} oportunidades:\n\n${items}`;
}

async function classifyBatch(batch) {
  const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${NVIDIA_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "z-ai/glm-5.2",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserMessage(batch) },
      ],
      response_format: { type: "json_object" },
      temperature: 0,
    }),
  });
  if (!res.ok) throw new Error(`NIM chat ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) throw new Error("resposta vazia");
  let parsed;
  try { parsed = JSON.parse(raw); } catch { throw new Error(`JSON inválido: ${raw.slice(0,300)}`); }
  if (!Array.isArray(parsed.resultados)) throw new Error("formato inesperado, sem 'resultados'");
  return parsed.resultados;
}

async function main() {
  const { data: rows, error } = await supabase
    .from("opportunities")
    .select("id, title, description, eligibility, process, format, location, language, audience")
    .eq("status", "Aprovada")
    .order("id");
  if (error) throw error;

  console.log(`${rows.length} oportunidades aprovadas para processar.`);

  const BATCH_SIZE = 8;
  const auditLog = [];
  let processed = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    let resultados;
    try {
      resultados = await classifyBatch(batch);
    } catch (e) {
      console.error(`Erro no lote ${i}-${i+batch.length}: ${e.message}. Tentando de novo em lotes menores...`);
      // fallback: process one by one for this batch
      resultados = [];
      for (const item of batch) {
        try {
          const single = await classifyBatch([item]);
          resultados.push(...single);
        } catch (e2) {
          console.error(`  Falhou id=${item.id}: ${e2.message} — pulando, mantém valores atuais.`);
        }
      }
    }

    const byId = new Map(resultados.map(r => [r.id, r]));

    for (const row of batch) {
      const r = byId.get(row.id);
      if (!r) continue;

      const patch = {};
      const before = { audience: row.audience, language: row.language, location: row.location };

      // audience: só troca se a lista fechada bater e for diferente
      const newAudience = Array.isArray(r.audience) ? r.audience.filter(a => ["Escola Pública","Indígena/Quilombola","Negro/Pardo","Baixa Renda"].includes(a)) : [];
      if (JSON.stringify(newAudience.slice().sort()) !== JSON.stringify((row.audience||[]).slice().sort())) {
        patch.audience = newAudience;
      }

      // language: só troca se atualmente vazio e o modelo achou algo
      if (!row.language && r.language) {
        patch.language = r.language;
      }

      // location: escreve o valor final consolidado (pode ser igual ao atual)
      if (r.location_final && r.location_final !== row.location) {
        patch.location = r.location_final;
      }

      if (Object.keys(patch).length > 0) {
        const { error: updErr } = await supabase.from("opportunities").update(patch).eq("id", row.id);
        if (updErr) {
          console.error(`  Erro ao atualizar id=${row.id}: ${updErr.message}`);
        }
      }

      auditLog.push({
        id: row.id,
        title: row.title,
        before,
        after: { audience: patch.audience ?? row.audience, language: patch.language ?? row.language, location: patch.location ?? row.location },
        changed: Object.keys(patch),
        evidencia: r.evidencia ?? "",
      });
    }

    processed += batch.length;
    console.log(`Progresso: ${processed}/${rows.length}`);
  }

  const auditPath = path.join(__dirname, "backfill-audit-log.json");
  writeFileSync(auditPath, JSON.stringify(auditLog, null, 2));
  const changedCount = auditLog.filter(a => a.changed.length > 0).length;
  console.log(`\nConcluído. ${changedCount}/${auditLog.length} linhas tiveram pelo menos um campo alterado.`);
  console.log(`Log completo salvo em ${auditPath} — revise antes de confiar no resultado.`);
}

main().catch(e => { console.error("ERRO FATAL:", e); process.exit(1); });
