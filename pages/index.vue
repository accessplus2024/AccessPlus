<script setup>
const marquee = [
  "Olimpíadas", "Bolsas", "Intercâmbios", "MUNs",
  "Mentorias", "Competições", "Redação", "Estágios", "Programas Acadêmicos",
]

useHead({
  title: "Access+ — Oportunidades educacionais para jovens",
  meta: [
    { charset: "UTF-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1.0" },
    { name: "description", content: "A maior plataforma gratuita do Brasil focada em trazer oportunidades educacionais atualizadas para jovens." },
  ],
  htmlAttrs: { lang: "pt-br" },
  link: [{ rel: "icon", href: "/favicon.ico" }],
})
</script>

<template>
  <main>
    <HomeHeader />
    <Marquee :items="marquee" />
    <HomeOpportunitiesSection />
    <HomeFeaturesSection />
    <HomeNewsSection />
    <NewsletterCta />
    <HomeAboutSection />
    <HomeContactSection />
    <HomeAwardsSection />
  </main>
</template>
