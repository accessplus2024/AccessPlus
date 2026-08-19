import { checkRateLimit, getClientIp } from "../../utils/rateLimit"

export default defineEventHandler(async (event) => {
  // No máximo 5 inscrições por IP a cada 10 minutos — evita que alguém
  // martele o endpoint inscrevendo e-mails de terceiros sem consentimento.
  const ip = getClientIp(event)
  const podeSeguir = checkRateLimit(`newsletter-subscribe:${ip}`, {
    limit: 5,
    windowMs: 10 * 60 * 1000,
  })
  if (!podeSeguir) {
    throw createError({
      statusCode: 429,
      statusMessage: "Muitas tentativas. Tente novamente em alguns minutos.",
    })
  }

  const { email } = await readBody(event)
  const config = useRuntimeConfig()

  if (!email || !email.includes("@")) {
    throw createError({ statusCode: 400, statusMessage: "E-mail inválido" })
  }

  if (!config.beehiivApiKey || !config.public.beehiivPublicationId) {
    throw createError({ statusCode: 500, statusMessage: "Newsletter não configurada" })
  }

  await $fetch(
    `https://api.beehiiv.com/v2/publications/${config.public.beehiivPublicationId}/subscriptions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.beehiivApiKey}`,
        "Content-Type": "application/json",
      },
      body: { email, reactivate_existing: true, send_welcome_email: true },
    }
  )

  return { success: true }
})
