// Rastreia se a cota diária da IA (Gemini) já foi atingida.
// Guardamos apenas a data (fuso de São Paulo) em que o limite estourou.
// Observação: em ambiente serverless (ex.: Vercel) esse estado vive em memória
// por instância. Ele é um "melhor esforço" — o frontend também lembra via
// localStorage. A cota do Gemini reseta diariamente, então a data basta.

let quotaHitDate = null; // string "AAAA-MM-DD" ou null

// Data de hoje no fuso horário do Brasil (America/Sao_Paulo)
export function hojeBR() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

// Marca que a cota estourou hoje.
export function marcarCotaAtingida() {
  quotaHitDate = hojeBR();
}

// Retorna true se a cota já estourou HOJE.
export function cotaAtingidaHoje() {
  return quotaHitDate === hojeBR();
}
