export default defineEventHandler(async (event) => {
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
