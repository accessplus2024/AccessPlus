import { checkRateLimit, getClientIp } from "../../utils/rateLimit";
import { useSupabase } from "../../utils/supabaseClient";

// Únicos valores aceitos pros campos de categoria — evita lixo livre nesses
// campos (o resto do site depende deles pra filtro/ícone/selo).
const TIPOS_VALIDOS = [
  "Olimpíadas Científicas", "Bolsas de Estudo", "MUNs", "Mentorias",
  "Programas Acadêmicos", "Competições", "Programas de Intercâmbio",
  "Competições de Escrita", "Estágios",
];
const NIVEIS_VALIDOS = ["Fundamental", "Ensino Médio", "Gap Year", "Faculdade"];
const AREAS_VALIDAS = ["Meio Ambiente", "Humanas", "STEM", "Linguagens", "Artes"];
const CUSTOS_VALIDOS = ["Bolsa", "Gratuito", "Totalmente Financiado"];
const FORMATOS_VALIDOS = ["Presencial", "Remoto", "Híbrido"];

function textoObrigatorio(v, max = 5000) {
  const s = typeof v === "string" ? v.trim() : "";
  return s && s.length <= max ? s : null;
}

function arrayValido(v, permitidos) {
  if (!Array.isArray(v) || v.length === 0) return null;
  const limpo = v.filter((x) => permitidos.includes(x));
  return limpo.length ? limpo : null;
}

export default defineEventHandler(async (event) => {
  // No máximo 5 envios por IP a cada 30 minutos — mesmo padrão do
  // newsletter/subscribe, ajustado pra um formulário mais raramente usado.
  const ip = getClientIp(event);
  const podeSeguir = checkRateLimit(`opportunity-submit:${ip}`, {
    limit: 5,
    windowMs: 30 * 60 * 1000,
  });
  if (!podeSeguir) {
    throw createError({
      statusCode: 429,
      statusMessage: "Muitas tentativas. Tente novamente mais tarde.",
    });
  }

  const body = await readBody(event);

  // Honeypot: campo escondido no formulário que uma pessoa nunca preenche,
  // mas um bot preenchendo tudo automaticamente costuma preencher. Resposta
  // igual à de sucesso — não avisa o bot que foi pego.
  if (body?.website) {
    return { success: true };
  }

  const email = typeof body?.submitterEmail === "string" ? body.submitterEmail.trim() : "";
  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const registro = {
    organization_name: textoObrigatorio(body?.organizationName, 200),
    title: textoObrigatorio(body?.title, 200),
    link: textoObrigatorio(body?.link, 500),
    description: textoObrigatorio(body?.description, 3000),
    type: TIPOS_VALIDOS.includes(body?.type) ? body.type : null,
    deadline: textoObrigatorio(body?.deadline, 100),
    level: arrayValido(body?.level, NIVEIS_VALIDOS),
    areas: arrayValido(body?.areas, AREAS_VALIDAS),
    location: textoObrigatorio(body?.location, 200),
    cost: CUSTOS_VALIDOS.includes(body?.cost) ? body.cost : null,
    format: FORMATOS_VALIDOS.includes(body?.format) ? body.format : null,
    eligibility: textoObrigatorio(body?.eligibility, 3000),
    submitter_name: textoObrigatorio(body?.submitterName, 200),
    submitter_email: emailValido ? email : null,
    submitter_note: textoObrigatorio(body?.submitterNote, 1000) || "",
  };

  // link precisa parecer uma URL de verdade (com protocolo) — evita "diga
  // pro Instagram" ou texto livre no campo que vira o botão de inscrição.
  if (registro.link && !/^https?:\/\//i.test(registro.link)) {
    registro.link = null;
  }

  const faltando = Object.entries(registro)
    .filter(([chave, valor]) => chave !== "submitter_note" && !valor)
    .map(([chave]) => chave);

  if (faltando.length) {
    throw createError({
      statusCode: 400,
      statusMessage: `Preencha todos os campos obrigatórios (faltando: ${faltando.join(", ")}).`,
    });
  }

  const supabase = useSupabase();
  const { error } = await supabase.from("opportunity_submissions").insert(registro);

  if (error) {
    console.error("[opportunities/submit] erro ao gravar submissão:", error.message);
    throw createError({
      statusCode: 500,
      statusMessage: "Não foi possível registrar sua oportunidade agora. Tente novamente em instantes.",
    });
  }

  return { success: true };
});
