// Filtro rígido de idade (Parte 3 do plano técnico — "regra de segurança
// ainda não totalmente resolvida"). Constrói o que o plano descreve como
// "se em algum momento isso for reconstruído como filtro determinístico":
// extrai faixa de idade EXPLICITAMENTE declarada no texto da oportunidade
// e corta quem está fora — nunca infere idade a partir de nível/série
// escolar (isso excluiria sistematicamente o aluno com distorção
// idade-série, ver Parte 3).
//
// Regra de ouro: sem número explícito no texto → sem filtro (Parte 1: só
// status='Aprovada' e idade EXPLÍCITA são filtros rígidos; tudo o resto é
// ressalva/peso, nunca exclusão).

// Faixa plausível de idade de estudante/jovem coberta pelo catálogo — usada
// só pra descartar números que claramente não são idade (ex: "200 anos da
// Casa" = aniversário histórico, "por 2 anos" = duração de um programa).
const IDADE_MIN_PLAUSIVEL = 3;
const IDADE_MAX_PLAUSIVEL = 40;

function plausivel(n) {
  return Number.isInteger(n) && n >= IDADE_MIN_PLAUSIVEL && n <= IDADE_MAX_PLAUSIVEL;
}

// Palavras que precisam aparecer imediatamente antes do número pra
// confirmarmos que é uma referência a IDADE DE PESSOA, não duração de
// programa, ano de fundação, ou qualquer outro "N anos" no texto. Ver
// scripts/eval — 30/295 oportunidades aprovadas tinham "N anos" no texto;
// só as que carregam uma destas palavras próximas são idade de verdade.
const QUALIFICADOR = "(?:jovens?|estudantes?|adolescentes?|meninas?|menines?|pessoas?|alunos?|participantes?|idades?|crianças?)";

const PADROES = [
  // "jovens de 14 a 18 anos", "estudantes entre 13 e 18 anos", "idades de 15 a 17 anos",
  // "meninas (e pessoas não-binárias) de 14 a 18 anos" — até ~40 caracteres de
  // aposto entre o qualificador e "de/entre" pra não perder esse tipo de caso.
  {
    regex: new RegExp(`${QUALIFICADOR}(?:[^.\\d]{0,40}?)\\s+(?:de|entre)\\s+(\\d{1,2})\\s*(?:a|e|-|–)\\s*(\\d{1,2})\\s*anos`, "gi"),
    extrai: (m) => ({ min: Number(m[1]), max: Number(m[2]) }),
  },
  // "(14-18 anos)", "(14 a 18 anos)", "(15‑17 anos, 9º ao 12º ano)" — não exige
  // fechar parêntese logo depois de "anos", só que tenha aberto antes.
  {
    regex: /\((\d{1,2})\s*(?:a|-|‑|–)\s*(\d{1,2})\s*anos/gi,
    extrai: (m) => ({ min: Number(m[1]), max: Number(m[2]) }),
  },
  // "menores de 21 anos" -> até 20
  {
    regex: /menor(?:es)?\s+de\s+(\d{1,2})\s*anos/gi,
    extrai: (m) => ({ min: null, max: Number(m[1]) - 1 }),
  },
  // "maiores de 18 anos" -> a partir de 19
  {
    regex: /maior(?:es)?\s+de\s+(\d{1,2})\s*anos/gi,
    extrai: (m) => ({ min: Number(m[1]) + 1, max: null }),
  },
  // "a partir de 15 anos" -> mínimo 15 (inclusive)
  {
    regex: /a partir de\s+(\d{1,2})\s*anos/gi,
    extrai: (m) => ({ min: Number(m[1]), max: null }),
  },
  // "até 19 anos" -> máximo 19 (inclusive)
  {
    regex: /até\s+(\d{1,2})\s*anos/gi,
    extrai: (m) => ({ min: null, max: Number(m[1]) }),
  },
  // "18+ anos", "18 anos ou mais"
  {
    regex: /(\d{1,2})\s*\+\s*anos|(\d{1,2})\s*anos\s+ou\s+mais/gi,
    extrai: (m) => ({ min: Number(m[1] ?? m[2]), max: null }),
  },
];

// Extrai a faixa de idade EXPLÍCITA de um texto (título + descrição
// concatenados, geralmente). Retorna { min, max } (qualquer um pode ser
// null) ou null se nada explícito for encontrado. NUNCA olha campo de
// nível/série — só texto livre com número + "anos" + qualificador de
// pessoa por perto.
export function extractAgeRange(text) {
  if (!text || typeof text !== "string") return null;

  let min = null;
  let max = null;
  let achou = false;

  for (const { regex, extrai } of PADROES) {
    let m;
    regex.lastIndex = 0;
    while ((m = regex.exec(text))) {
      const faixa = extrai(m);
      const faixaMinOk = faixa.min === null || plausivel(faixa.min);
      const faixaMaxOk = faixa.max === null || plausivel(faixa.max);
      if (!faixaMinOk || !faixaMaxOk) continue; // "200 anos", "por 2 anos" etc — descarta
      if (faixa.min === null && faixa.max === null) continue;
      if (faixa.min !== null && faixa.max !== null && faixa.min > faixa.max) continue; // sanidade

      achou = true;
      if (faixa.min !== null) min = min === null ? faixa.min : Math.min(min, faixa.min);
      if (faixa.max !== null) max = max === null ? faixa.max : Math.max(max, faixa.max);
    }
  }

  return achou ? { min, max } : null;
}

// Aplica o corte rígido: mantém a oportunidade se
//   (a) idade do aluno não foi informada, OU
//   (b) a oportunidade não declara faixa explícita de idade, OU
//   (c) a idade do aluno cai dentro da faixa declarada.
// Nunca infere de `level`/`nivel` — só do texto (ver extractAgeRange).
// `getText(opportunity)` deixa o caller decidir quais campos concatenar
// (title + description, normalmente).
export function filterByAge(opportunities, studentAge, getText = (o) => `${o.title ?? ""}\n${o.description ?? ""}`) {
  if (studentAge === null || studentAge === undefined || !Number.isFinite(studentAge)) {
    return { kept: opportunities, excluded: [] };
  }

  const kept = [];
  const excluded = [];

  for (const o of opportunities) {
    const faixa = extractAgeRange(getText(o));
    if (!faixa) {
      kept.push(o);
      continue;
    }
    const abaixoDoMinimo = faixa.min !== null && studentAge < faixa.min;
    const acimaDoMaximo = faixa.max !== null && studentAge > faixa.max;
    if (abaixoDoMinimo || acimaDoMaximo) {
      excluded.push({ ...o, _idadeExcluidaFaixa: faixa });
    } else {
      kept.push(o);
    }
  }

  return { kept, excluded };
}
