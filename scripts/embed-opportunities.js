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
  // Dizer em voz alta contra qual projeto isto vai rodar. O script apaga e
  // reescreve TODOS os chunks das oportunidades aprovadas; rodar no banco
  // errado é caro de descobrir depois.
  const target = (process.env.SUPABASE_URL ?? "").replace(/^https:\/\//, "").split(".")[0];
  console.log(`Banco alvo: ${target}\n`);

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

  // `opportunities.embedded_at` existe só no projeto de dev. Desde 2026-08-25 o
  // índice vive em produção, onde a coluna não existe — então esta escrita é
  // OPCIONAL e falha silenciosamente com 42703 (undefined_column) ali.
  //
  // Histórico, pra não voltar: até 2026-08-19 este script nunca escrevia de
  // volta nessa coluna. A carimbada existe porque a Parte 6 do plano previa
  // re-embedding incremental (`embedded_at < updated_at`) — lógica que
  // **nunca foi escrita**. Enquanto não for, a coluna não tem consumidor, e é
  // por isso que a ausência dela em produção não é problema.
  //
  // A fonte de verdade de "quando isto foi embeddado" é
  // `opportunity_chunks.embedded_at`, gravada acima em toda linha.
  const embeddedAt = new Date().toISOString();
  const { error: touchError } = await supabase
    .from("opportunities")
    .update({ embedded_at: embeddedAt })
    .in("id", opportunityIds);
  if (touchError) {
    if (touchError.code === "42703" || /embedded_at/i.test(touchError.message ?? "")) {
      console.log("opportunities.embedded_at não existe neste banco (esperado em produção) — ignorado.");
    } else {
      console.error(`Aviso: falhou ao gravar opportunities.embedded_at: ${touchError.message}`);
    }
  } else {
    console.log(`opportunities.embedded_at atualizado para ${opportunityIds.length} oportunidade(s).`);
  }

  console.log("Concluído! Todos os chunks foram embeddados.");
}

main().catch((err) => {
  console.error("Erro:", err.message);
  process.exit(1);
});