// Teste de regressão do casamento de título do roteador. NÃO é runtime.
//
// Roda em segundos e não gasta uma chamada de API: só tokenização e o corpus
// de títulos. Rode sempre que mexer em `matchOpportunity()`
// (server/utils/rag/router.js) ou no tokenizador (`texto.js`).
//
//   node lab/title-match.test.mjs
//
// Ele guarda os três jeitos conhecidos de errar aqui, cada um vindo de um bug
// real que já chegou ao aluno:
//
//  1. NÃO match quando o aluno cita pelo NOME CURTO — "prazo do nyc summer
//     academy" devolvia 8 recomendações genéricas em vez da ficha
//     (2026-08-25);
//  2. CASAR numa busca por coincidência — "Procuro bolsa ou intercâmbio de
//     verão fora do Brasil" sequestrado pela ficha de "Bolsa Daqui para Fora";
//  3. sigla casando DENTRO de outra palavra — "OBB" dentro de "OBBiotec"
//     (2026-08-23).
//
// As 30 bios do golden set entram como controle negativo: são BUSCAS, então
// nenhuma delas pode match com uma oportunidade específica.

import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { matchOpportunity } from "../server/utils/rag/router.js";

dotenv.config({ path: new URL("../.env", import.meta.url).pathname, quiet: true });

// Mesma ordem de resolução de server/utils/rag/ragClient.js: o teste tem que
// olhar o mesmo catálogo que a produção.
const URL_DB = process.env.RAG_SUPABASE_URL ?? process.env.PROD_SUPABASE_URL ?? process.env.DEV_SUPABASE_URL;
const KEY_DB = process.env.RAG_SUPABASE_SERVICE_ROLE_KEY ?? process.env.PROD_SUPABASE_SERVICE_ROLE_KEY ?? process.env.DEV_SUPABASE_SERVICE_ROLE_KEY;

// Cada caso: [pergunta, run esperado no título casado] — null = não pode match.
const DEVEM_CASAR = [
  ["prazo do nyc summer academy", "NYC Summer Academy"],
  ["qual o prazo do NYC Summer Academy?", "NYC Summer Academy"],
  ["me fala da obmep", "OBMEP"],
  ["quando abre a inscricao do summer science program", "Summer Science Program"],
  ["quero saber sobre o girls who code summer immersion", "Girls Who Code"],
  ["como me inscrevo no stanford summer humanities institute", "Stanford Summer Humanities"],
];

const NAO_PODEM_CASAR = [
  "Procuro bolsa ou intercâmbio de verão fora do Brasil",
  "quero fazer um mun",
  "olimpiadas de matematica pra ensino medio",
  "quero algo gratuito e remoto",
  "nao sei o que quero, me ajuda",
];

const db = createClient(URL_DB, KEY_DB);
const { data: corpus, error } = await db
  .from("opportunities")
  .select("id, title")
  .eq("status", "Aprovada");
if (error) throw new Error(`Erro ao carregar títulos: ${error.message}`);

console.log(`catálogo: ${corpus.length} títulos de ${URL_DB.replace(/^https:\/\//, "").split(".")[0]}\n`);

let falhas = 0;

console.log("── devem casar ──");
for (const [pergunta, esperado] of DEVEM_CASAR) {
  const r = matchOpportunity(pergunta, corpus);
  const titulo = r.candidates[0]?.title ?? "";
  const ok = r.confianca === "alta" && titulo.toLowerCase().includes(esperado.toLowerCase());
  if (!ok) falhas++;
  console.log(`  ${ok ? "ok  " : "FALHA"} "${pergunta}"`);
  if (!ok) console.log(`         esperado conter "${esperado}", veio "${titulo || "(nenhum)"}" (via ${r.via ?? "-"}, ${r.confianca})`);
}

console.log("\n── não podem casar (são buscas) ──");
for (const pergunta of NAO_PODEM_CASAR) {
  const r = matchOpportunity(pergunta, corpus);
  const ok = r.candidates.length === 0;
  if (!ok) falhas++;
  console.log(`  ${ok ? "ok  " : "FALHA"} "${pergunta}"`);
  if (!ok) console.log(`         casou indevidamente com: ${r.candidates.map((o) => o.title).join(" | ")} (via ${r.via})`);
}

console.log("\n── controle negativo: 30 bios do golden set ──");
const golden = JSON.parse(readFileSync(new URL("../scripts/eval/golden-set.json", import.meta.url).pathname, "utf8"));
const perfis = golden.perfis ?? golden;
let fp = 0;
for (const p of perfis) {
  const r = matchOpportunity(p.perfil?.bio ?? "", corpus);
  if (r.candidates.length) {
    fp++;
    console.log(`  FALHA ${p.id} casou com: ${r.candidates.map((o) => o.title).join(" | ")} (via ${r.via})`);
  }
}
falhas += fp;
console.log(`  ${fp === 0 ? "ok   0" : `FALHA ${fp}`}/${perfis.length} bios casaram (esperado: 0)`);

console.log(`\n${falhas === 0 ? "TUDO PASSOU" : `${falhas} FALHA(S)`}`);
process.exit(falhas === 0 ? 0 : 1);
