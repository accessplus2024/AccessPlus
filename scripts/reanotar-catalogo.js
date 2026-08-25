// Reanotação do catálogo: areas, audience, language, keywords, format e
// location (geografia limpa, sem modalidade), com vocabulário FECHADO em
// todos os campos.
//
// Por que existe: `lab/qualidade-campos.mjs` mediu, em 2026-08-24, que
// `location` tem utilidade 0,01 (89% das linhas são cópia de `format`),
// `keywords` 0,02 (90% são cópia de `areas`), `audience` está em 2% de
// coverage com 41 linhas tendo o recorte escrito no texto, e `language` tem
// 57% de coverage do lado estrangeiro contra 6% do lado brasileiro. As metas
// de cada campo estão em `docs/metricas-campos-2026-08-24.md`.
//
// Substitui `scripts/backfill-audience-language-location.js`, que nunca rodou
// (a NIM devolvia 429 e hoje devolve 410 no endpoint que ele usa).
//
// REGRA CENTRAL, herdada daquele script: o classificador NUNCA inventa.
// Todo rótulo precisa de evidência no texto. Onde não há evidência, a saída
// correta é vazio/null e `precisa_pesquisa: true` — não um palpite.
//
// Uso:
//   node scripts/reanotar-catalogo.js --dry              # só classifica, não grava
//   node scripts/reanotar-catalogo.js --gravar           # grava no Supabase DEV
//   node scripts/reanotar-catalogo.js --gravar --ids 12,44
//   node scripts/reanotar-catalogo.js --retomar          # reaproveita o cache de classificação
//
// Saídas:
//   scripts/reanotacao-resultado.json   cache de classificação (retomável)
//   scripts/reanotacao-auditoria.json   antes/depois/evidência por linha
//
// A gravação é UM update por linha com todos os campos juntos, pra não
// disparar o trigger `opportunities_touch` várias vezes por oportunidade —
// mesmo cuidado de `sync-opportunities-from-prod.js`.

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, existsSync } from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env"), quiet: true });

const { DEV_SUPABASE_URL, DEV_SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY } = process.env;
if (!DEV_SUPABASE_URL || !DEV_SUPABASE_SERVICE_ROLE_KEY || !GEMINI_API_KEY) {
  console.error("Faltam DEV_SUPABASE_URL, DEV_SUPABASE_SERVICE_ROLE_KEY ou GEMINI_API_KEY no .env da raiz.");
  process.exit(1);
}

// A cota gratuita da Gemini é por modelo. Rodar 295 oportunidades em um
// modelo só bate em 429 no meio do caminho; a lista abaixo é rodada em
// rodízio por lote, o que multiplica a cota disponível sem mexer no prompt.
const MODELOS = (process.env.REANOTAR_MODELO ?? "gemini-3.6-flash,gemini-3.5-flash,gemini-3.1-flash-lite").split(",");
const LOTE = Number(process.env.REANOTAR_LOTE ?? 5);
const CACHE = path.join(__dirname, "reanotacao-resultado.json");
const AUDITORIA = path.join(__dirname, "reanotacao-auditoria.json");

const argv = process.argv.slice(2);
const GRAVAR = argv.includes("--gravar");
const RETOMAR = argv.includes("--retomar") || existsSync(CACHE);
const IDS = (() => { const i = argv.indexOf("--ids"); return i >= 0 ? new Set(argv[i + 1].split(",").map(Number)) : null; })();

const db = createClient(DEV_SUPABASE_URL, DEV_SUPABASE_SERVICE_ROLE_KEY);

// ── vocabulários fechados ───────────────────────────────────────────────────
// `areas` e `audience` são os 9 e os 5 valores que já existem no banco. O site
// (pages/oportunidades.vue) oferece só 5 áreas e usa nomes diferentes de
// audience ("Negros", "Indígenas") — esses chips precisam ser corrigidos pra
// casarem com esta lista, porque o filtro compara por igualdade exata.
const AREAS = ["STEM", "Humanas", "Tech", "Artes", "Linguagens", "Política", "Ativismo", "Meio Ambiente", "Empreendedorismo"];
const AUDIENCE = ["Baixa Renda", "Escola Pública", "Negro/Pardo", "Indígena/Quilombola", "Meninas"];
const FORMATOS = ["Remoto", "Presencial", "Híbrido"];

async function carregarTags() {
  const { data, error } = await db.from("opportunity_tags").select("name, category, active").eq("active", true);
  if (error) throw new Error(`opportunity_tags: ${error.message}`);
  return data.map((t) => t.name).sort();
}

function promptSistema(tags) {
  return `Você anota o catálogo da AccessPlus, plataforma brasileira de oportunidades extracurriculares para estudantes de ensino fundamental e médio.

REGRA ACIMA DE TODAS: você não inventa. Cada rótulo precisa estar sustentado pelo texto que você recebeu. Onde o texto não sustenta, devolva vazio ou null e marque precisa_pesquisa=true. Um campo vazio é uma resposta correta; um rótulo inventado promete ao aluno uma coisa que não existe.

Para cada oportunidade devolva:

1. "areas": 1 a 3 valores, SOMENTE desta lista: ${JSON.stringify(AREAS)}.
   A primeira da lista é a principal. Escolha pela SUBSTÂNCIA da oportunidade, não pela instituição que a organiza. Guias rápidos:
   - negócios, finanças, startup, gestão, mercado → Empreendedorismo (NÃO STEM)
   - programação, dados, IA, software, computação → Tech (e STEM junto, se houver ciência dura envolvida)
   - política, governo, políticas públicas, diplomacia, relações internacionais → Política
   - direitos humanos, justiça social, voluntariado, impacto social, comunidade → Ativismo
   - escrita, literatura, idiomas, debate, oratória, comunicação → Linguagens
   - artes visuais, música, teatro, cinema, fotografia, poesia → Artes
   - clima, sustentabilidade, conservação, biodiversidade → Meio Ambiente
   - história, filosofia, sociologia, direito, economia, psicologia → Humanas
   - matemática, física, química, biologia, engenharia, medicina, astronomia → STEM
   Use 2 ou 3 áreas quando a oportunidade genuinamente cobre mais de uma (é o caso comum). Não empilhe áreas só para preencher.

2. "audience": 0 a 5 valores, SOMENTE desta lista: ${JSON.stringify(AUDIENCE)}.
   Isto NÃO é "para quem o programa é" em geral — quase todo programa é para estudante de ensino médio, e isso já está na coluna de nível. Isto é RECORTE AFIRMATIVO: o programa reserva vagas, prioriza ou exige esse grupo. Só inclua se o texto disser explicitamente (ex.: "prioridade para alunos de escola pública", "vagas reservadas para meninas", "voltado a estudantes indígenas e quilombolas", "para estudantes de baixa renda"). A MAIORIA das oportunidades devolve array vazio, e isso é o resultado certo.

3. "language": o idioma em que a atividade É CONDUZIDA — aulas, provas, entrevistas, submissões. NÃO é o idioma da descrição, que a equipe sempre escreve em português. Valores: "Português", "Inglês", "Espanhol", ou dois juntos no padrão "Inglês e Italiano". Se não houver pista clara no texto, devolva null e precisa_pesquisa=true. Um programa organizado por universidade dos EUA é quase certamente em inglês; um programa de instituição brasileira, em português — mas diga isso pela evidência, e marque confianca="media" quando for essa dedução.

4. "location": geografia LIMPA, sem modalidade nenhuma (isso já é "format", não repita "Remoto"/"Presencial"/"Híbrido" aqui). Um único valor curto:
   - Se for presencial ou híbrido com etapa física: "Cidade, UF" no Brasil (ex.: "Salvador, BA"), ou "Cidade, País" fora (ex.: "Cambridge, Reino Unido"). Se não achar a cidade mas souber o país, só o país.
   - Se for 100% remoto: o país da organização que promove (ex.: "Estados Unidos"), nunca "Remoto" sozinho — isso é redundante com format.
   - Se o programa tem edições em países diferentes, use o país da edição/sede atual e marque precisa_pesquisa=true.
   - NUNCA endereço de rua, CEP ou nome de prédio isolado — no máximo "Instituição, Cidade" se a instituição for o único jeito de localizar.
   Nunca deixe vazio: na falta de tudo, devolva o país mais provável e confianca="baixa".

5. "format": um de ${JSON.stringify(FORMATOS)}. "Híbrido" só quando há de fato uma etapa remota e uma presencial (ex.: candidatura online, evento presencial).

6. "keywords": EXATAMENTE 5 tags, SOMENTE desta lista fechada de 152: ${JSON.stringify(tags)}.
   Distribua entre as facetas em vez de escolher 5 sinônimos do mesmo assunto: idealmente 2 de tema (o assunto), 1 de atividade (o que o aluno faz), 1 de entrega ou benefício (o que ele produz ou ganha) e 1 de habilidade (o que desenvolve). Nunca repita o nome de uma área como tag.

7. "evidencia": um trecho CURTO e literal do texto que sustenta audience e language. Se não houver, escreva "sem pista".

8. "confianca": "alta" quando tudo veio explícito do texto; "media" quando houve dedução razoável (idioma pelo país da instituição, por exemplo); "baixa" quando o texto é curto ou genérico demais.

9. "precisa_pesquisa": true quando o texto recebido não basta e alguém precisa abrir o link do programa para decidir.

Devolva uma entrada para CADA oportunidade recebida, na mesma ordem, sem pular nenhuma.`;
}

const SCHEMA = {
  type: "object",
  properties: {
    results: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "integer" },
          areas: { type: "array", items: { type: "string", enum: AREAS } },
          audience: { type: "array", items: { type: "string", enum: AUDIENCE } },
          language: { type: "string", nullable: true },
          location: { type: "string" },
          format: { type: "string", enum: FORMATOS },
          keywords: { type: "array", items: { type: "string" } },
          evidencia: { type: "string" },
          confianca: { type: "string", enum: ["alta", "media", "baixa"] },
          precisa_pesquisa: { type: "boolean" },
        },
        required: ["id", "areas", "audience", "location", "format", "keywords", "evidencia", "confianca", "precisa_pesquisa"],
      },
    },
  },
  required: ["resultados"],
};

function batchMessage(lote) {
  return lote.map((o) => `<oportunidade id="${o.id}">
titulo: ${o.title}
descricao: ${(o.description ?? "").slice(0, 2500)}
elegibilidade: ${(o.eligibility ?? "").slice(0, 1200)}
processo: ${(o.process ?? "").slice(0, 800)}
adicionais: ${(o.additionals ?? "").slice(0, 600)}
tipo: ${o.type ?? ""}
nivel: ${JSON.stringify(o.level ?? [])}
custo: ${o.cost ?? ""}
link: ${o.link ?? ""}
--- valores atuais (podem estar errados; corrija sem cerimônia) ---
areas_atual: ${JSON.stringify(o.areas ?? [])}
audience_atual: ${JSON.stringify(o.audience ?? [])}
language_atual: ${o.language ?? "null"}
location_atual: ${o.location ?? "null"}
format_atual: ${o.format ?? "null"}
keywords_atual: ${JSON.stringify(o.keywords ?? [])}
</oportunidade>`).join("\n\n");
}

async function classificarLote(lote, sistema, tentativa = 1, modelo = MODELOS[0]) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${GEMINI_API_KEY}`;
  const body = {
    systemInstruction: { parts: [{ text: sistema }] },
    contents: [{ parts: [{ text: `Anote estas ${lote.length} oportunidades:\n\n${batchMessage(lote)}` }] }],
    generationConfig: { responseMimeType: "application/json", responseSchema: SCHEMA, temperature: 0 },
  };
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) {
    const txt = await res.text();
    if (tentativa <= 12 && (res.status === 429 || res.status >= 500)) {
      // Antes de esperar, tenta o próximo modelo do rodízio: a cota é por
      // modelo, então um 429 aqui não significa 429 no vizinho.
      const proximoModelo = MODELOS[tentativa % MODELOS.length];
      const espera = tentativa % MODELOS.length === 0 ? Math.min(60000, 5000 * 2 ** Math.floor(tentativa / MODELOS.length)) : 0;
      if (espera) { console.warn(`  ${res.status} em todos os modelos, esperando ${espera / 1000}s`); await new Promise((r) => setTimeout(r, espera)); }
      return classificarLote(lote, sistema, tentativa + 1, proximoModelo);
    }
    throw new Error(`${res.status}: ${txt.slice(0, 300)}`);
  }
  const json = await res.json();
  const texto = json.candidates?.[0]?.content?.parts?.map((p) => p.text).filter(Boolean).join("") ?? "";
  if (!texto) throw new Error("resposta sem content (verifique max tokens / finishReason)");
  return JSON.parse(texto).results ?? [];
}

// ── validação: o modelo pode alucinar tag fora da lista, mesmo com enum ──────
function validate(r, tagsValidas, atual) {
  const problemas = [];
  r.areas = (r.areas ?? []).filter((a) => AREAS.includes(a)).slice(0, 3);
  if (!r.areas.length) { r.areas = atual.areas?.length ? atual.areas : ["Humanas"]; problemas.push("areas vazio, mantido o anterior"); }
  r.audience = [...new Set((r.audience ?? []).filter((a) => AUDIENCE.includes(a)))];
  const fora = (r.keywords ?? []).filter((k) => !tagsValidas.has(k));
  r.keywords = [...new Set((r.keywords ?? []).filter((k) => tagsValidas.has(k)))].slice(0, 5);
  if (fora.length) problemas.push(`tags fora da taxonomia descartadas: ${fora.join(", ")}`);
  if (r.keywords.length < 5) problemas.push(`só ${r.keywords.length} tags válidas`);
  if (!FORMATOS.includes(r.format)) { r.format = atual.format ?? null; problemas.push("format inválido"); }
  if (r.location && /\d{5}|\bav\.|\brua\b|\bn[ºo°]\s*\d/i.test(r.location)) problemas.push(`location parece endereço: ${r.location}`);
  if (r.location && /^(remoto|presencial|h[ií]brido)$/i.test(r.location.trim())) problemas.push(`location repetiu a modalidade: ${r.location}`);
  return problemas;
}

// ═══════════════════════════════════════════════════════════════════════════
const tags = await carregarTags();
const tagsValidas = new Set(tags);
const sistema = promptSistema(tags);

const { data: corpus, error } = await db.from("opportunities").select("*").eq("status", "Aprovada").order("id");
if (error) throw new Error(error.message);
const target = IDS ? corpus.filter((o) => IDS.has(o.id)) : corpus;
console.log(`${target.length} oportunidades, ${tags.length} tags na taxonomia, modelos ${MODELOS.join("/")}, lote ${LOTE}\n`);

const results = RETOMAR && existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, "utf8")) : {};
const pendentes = target.filter((o) => !results[o.id]);
console.log(`${Object.keys(results).length} já em cache, ${pendentes.length} a classificar\n`);

// Lotes em paralelo. CONCORRENCIA=1 volta ao comportamento sequencial se a
// cota da API reclamar; o retry com backoff em classificarLote() já absorve
// 429 esporádico.
const CONCORRENCIA = Number(process.env.REANOTAR_CONCORRENCIA ?? 4);
const lotes = [];
for (let i = 0; i < pendentes.length; i += LOTE) lotes.push(pendentes.slice(i, i + LOTE));

let proximo = 0, concluidos = 0;
async function worker() {
  while (proximo < lotes.length) {
    const idx = proximo++;
    const lote = lotes[idx];
    try {
      const saida = await classificarLote(lote, sistema, 1, MODELOS[idx % MODELOS.length]);
      for (const r of saida) {
        const atual = lote.find((o) => o.id === r.id);
        if (!atual) continue;
        r.problemas = validate(r, tagsValidas, atual);
        results[r.id] = r;
      }
      const faltaram = lote.filter((o) => !results[o.id]).map((o) => o.id);
      console.log(`[${++concluidos}/${lotes.length}] ok${faltaram.length ? ` — sem resposta para ${faltaram.join(",")}` : ""}`);
    } catch (e) {
      console.error(`[${++concluidos}/${lotes.length}] FALHOU (ids ${lote.map((o) => o.id).join(",")}): ${e.message}`);
    }
    writeFileSync(CACHE, JSON.stringify(results, null, 1));
  }
}
await Promise.all(Array.from({ length: Math.min(CONCORRENCIA, lotes.length) }, worker));

// ── auditoria ───────────────────────────────────────────────────────────────
const auditoria = [];
for (const o of target) {
  const r = results[o.id];
  if (!r) { auditoria.push({ id: o.id, title: o.title, erro: "não classificado" }); continue; }
  auditoria.push({
    id: o.id, title: o.title, confianca: r.confianca, precisa_pesquisa: r.precisa_pesquisa,
    evidencia: r.evidencia, problemas: r.problemas,
    antes: { areas: o.areas, audience: o.audience, language: o.language, location: o.location, format: o.format, keywords: o.keywords },
    depois: { areas: r.areas, audience: r.audience, language: r.language ?? null, location: r.location, format: r.format, keywords: r.keywords },
  });
}
writeFileSync(AUDITORIA, JSON.stringify(auditoria, null, 1));

const n = auditoria.filter((a) => !a.erro).length;
const conta = (f) => auditoria.filter(f).length;
console.log(`\n${n}/${target.length} classificadas`);
console.log(`  confiança alta ${conta((a) => a.confianca === "alta")} · media ${conta((a) => a.confianca === "media")} · baixa ${conta((a) => a.confianca === "baixa")}`);
console.log(`  precisam de pesquisa na web: ${conta((a) => a.precisa_pesquisa)}`);
console.log(`  com problema de validação: ${conta((a) => a.problemas?.length)}`);
console.log(`  audience preenchida: ${conta((a) => a.depois?.audience?.length)} (antes: ${conta((a) => a.antes?.audience?.length)})`);
console.log(`  language preenchida: ${conta((a) => a.depois?.language)} (antes: ${conta((a) => a.antes?.language)})`);
console.log(`  areas com 2+ rótulos: ${conta((a) => a.depois?.areas?.length >= 2)} (antes: ${conta((a) => a.antes?.areas?.length >= 2)})`);
console.log(`\nAuditoria: ${AUDITORIA}`);

if (!GRAVAR) { console.log("\n(--dry: nada foi gravado. Rode com --gravar para escrever no Supabase DEV.)"); process.exit(0); }

// ── gravação ────────────────────────────────────────────────────────────────
// `location` é uma coluna que já existe — sem migração nenhuma. Ela só passa
// a guardar geografia (nunca mais modalidade, que vive só em `format`).
let ok = 0, falhas = 0;
for (const o of target) {
  const r = results[o.id];
  if (!r) continue;
  const patch = {
    areas: r.areas, audience: r.audience, language: r.language ?? null,
    format: r.format, keywords: r.keywords, location: r.location ?? null,
  };
  const { error: e } = await db.from("opportunities").update(patch).eq("id", o.id);
  if (e) { falhas++; console.error(`  id ${o.id}: ${e.message}`); } else ok++;
}
console.log(`\ngravadas ${ok}, falhas ${falhas} (Supabase DEV)`);
console.log("Lembrete: mudar estes campos muda buildPassage() — rode `npm run embed` antes de medir retrieval.");
