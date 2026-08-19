import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env.embedding") });

import { getOpportunitiesToEmbed } from "./fetch-opportunities.js";
import { buildChunks } from "./chunk-opportunity.js";
import { embedTexts } from "./embed-text.js";
import { supabase } from "./supabase-client.js";

const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL;
const BATCH_SIZE = 20;

async function main() {
  const opportunities = await getOpportunitiesToEmbed();
  console.log(`${opportunities.length} oportunidades aprovadas encontradas.`);

  const allChunks = opportunities.flatMap((opp) => buildChunks(opp));
  console.log(`${allChunks.length} chunks gerados no total.`);

  const opportunityIds = opportunities.map((o) => o.id);
  const { error: deleteError } = await supabase
    .from("opportunity_chunks")
    .delete()
    .in("opportunity_id", opportunityIds);

  if (deleteError) {
    throw new Error(`Erro ao limpar chunks antigos: ${deleteError.message}`);
  }

  let processed = 0;
  for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
    const batch = allChunks.slice(i, i + BATCH_SIZE);
    const vectors = await embedTexts(batch.map((c) => c.chunk_text), "passage");

    const rowsToInsert = batch.map((chunk, idx) => ({
      opportunity_id: chunk.opportunity_id,
      field_name: chunk.field_name,
      chunk_text: chunk.chunk_text,
      embedding: vectors[idx],
      embedded_at: new Date().toISOString(),
      embedding_model: EMBEDDING_MODEL,
    }));

    const { error: insertError } = await supabase.from("opportunity_chunks").insert(rowsToInsert);
    if (insertError) {
      throw new Error(`Erro ao inserir chunks: ${insertError.message}`);
    }

    processed += batch.length;
    console.log(`Progresso: ${processed}/${allChunks.length} chunks embeddados.`);
  }

  // BUG corrigido em 2026-08-19: nada neste script nunca escrevia de volta
  // em opportunities.embedded_at — a coluna existe (e o design da Parte 6 do
  // plano depende dela pra decidir o que precisa de re-embedding incremental
  // no futuro), mas ficava sempre null porque só opportunity_chunks.embedded_at
  // era gravado. Sem isto, qualquer lógica futura de "só reembedda o que
  // mudou" (comparando embedded_at < updated_at) trataria o catálogo inteiro
  // como desatualizado pra sempre — silenciosamente.
  const embeddedAt = new Date().toISOString();
  const { error: touchError } = await supabase
    .from("opportunities")
    .update({ embedded_at: embeddedAt })
    .in("id", opportunityIds);
  if (touchError) {
    console.error(`Aviso: falhou ao gravar opportunities.embedded_at: ${touchError.message}`);
  } else {
    console.log(`opportunities.embedded_at atualizado para ${opportunityIds.length} oportunidade(s).`);
  }

  console.log("Concluído! Todos os chunks foram embeddados.");
}

main().catch((err) => {
  console.error("Erro:", err.message);
  process.exit(1);
});