import { devSupabase } from "./devClient.js";

// Cota mensal por aluno (Parte 5.5 do plano). Isto NÃO é um limite de custo
// — a NIM aguenta muito mais tráfego que isso sozinha — é um limite de
// sentido: o perfil de um aluno não muda toda semana, então rodar a mesma
// busca de novo devolve o mesmo resultado. 5/mês cobre "atualizei meu perfil
// e quero rever as recomendações".
function periodoMensal() {
  const agora = new Date();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  return `${agora.getFullYear()}-${mes}`;
}

// Lê a cota do mês e incrementa. Corrida entre duas requisições do MESMO
// aluno no MESMO instante poderia, em teoria, contar duas vezes sem que a
// gente perceba — risco aceito por ora, dado o volume esperado (ver Parte
// 5.5: no pior caso, ~13 buscas simultâneas por minuto no app inteiro). Se
// isso virar problema real, a correção é uma função SQL com
// `insert ... on conflict do update set count = count + 1`, que é atômica
// de verdade — ainda não escrita aqui pra não adicionar complexidade sem
// evidência de que precisa.
export async function checkAndIncrementMatchQuota(userId, limit = 5) {
  const period = periodoMensal();

  const { data, error } = await devSupabase
    .from("ai_quota")
    .select("count")
    .eq("user_id", userId)
    .eq("mode", "match")
    .eq("period", period)
    .maybeSingle();

  if (error) throw new Error(`Erro ao ler cota: ${error.message}`);

  const count = data?.count ?? 0;
  if (count >= limit) {
    return { allowed: false, count, limit, period };
  }

  const { error: upsertError } = await devSupabase
    .from("ai_quota")
    .upsert(
      { user_id: userId, mode: "match", period, count: count + 1 },
      { onConflict: "user_id,mode,period" }
    );

  if (upsertError) throw new Error(`Erro ao atualizar cota: ${upsertError.message}`);

  return { allowed: true, count: count + 1, limit, period };
}
