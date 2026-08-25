// Monta os chunks embeddados (`npm run embed`).
//
// O texto vem de `buildPassage()` (server/utils/rag/fields.js), a MESMA função
// que monta o índice BM25 — antes havia duas representações da mesma
// oportunidade e elas divergiram em silêncio.
//
// Consequência: mudar `buildPassage()` obriga rodar `npm run embed`, senão o
// índice vetorial descreve uma versão antiga do catálogo.
import { buildPassage } from "../server/utils/rag/fields.js";

// `eligibility` tem chunk próprio E continua dentro do `core`: `catalog.js`
// monta a matriz de vetores só com `core`, então tirá-lo de lá removeria o
// sinal em vez de fortalecê-lo. As duas cópias respondem a perguntas
// diferentes — "que oportunidade é esta?" e "eu consigo participar?".
//
// O chunk próprio fica INERTE até `catalog.js` passar a lê-lo; ligar isso é
// mudança de retrieval e precisa passar pelos pisos (docs/accessia.md §6).
const REQUIRED = ["eligibility"];
const OPTIONAL = ["applicants", "process", "additionals"];

export function buildChunks(opportunity) {
  const chunks = [];

  const core = buildPassage(opportunity);
  if (core.trim().length > 0) {
    chunks.push({ opportunity_id: opportunity.id, field_name: "core", chunk_text: core });
  }

  for (const field of REQUIRED) {
    const text = opportunity[field];
    if (typeof text === "string" && text.trim().length > 0) {
      chunks.push({ opportunity_id: opportunity.id, field_name: field, chunk_text: text.trim() });
    } else {
      // Ausência aqui é problema de catálogo, não caso normal: "quem pode
      // participar" em branco é o dado cuja falta faz o aluno se inscrever no
      // que não podia.
      console.warn(`[chunks] ${opportunity.id} ("${opportunity.title}") sem \`${field}\``);
    }
  }

  for (const field of OPTIONAL) {
    const text = opportunity[field];
    if (typeof text === "string" && text.trim().length > 0) {
      chunks.push({ opportunity_id: opportunity.id, field_name: field, chunk_text: text.trim() });
    }
  }

  return chunks;
}
