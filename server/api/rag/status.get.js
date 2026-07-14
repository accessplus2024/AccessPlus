import { cotaAtingidaHoje } from "~/server/utils/ragQuota.js";

// Permite ao frontend saber, ANTES do estudante interagir, se a cota
// diária da IA já foi atingida.
export default defineEventHandler(() => {
  return { quotaExceeded: cotaAtingidaHoje() };
});
