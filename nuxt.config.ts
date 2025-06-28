// nuxt.config.ts
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  nitro: { compatibilityDate: "2024-04-03" },
  devtools: { enabled: true },
  css: ["~/assets/css/main.css"],

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  modules: ["@nuxt/fonts"],

  plugins: [
    { src: "~/plugins/vercel-analytics.client.ts", mode: "client" },
    { src: "~/plugins/google-analytics.ts", mode: "client" },
  ],

  runtimeConfig: {
    // Private keys (only available on server-side)
    beehiivApiKey: process.env.BEEHIV_API_KEY,

    // Public keys (exposed to client-side)
    public: {
      beehiivPublicationId: process.env.BEEHIV_PUBLICATION_ID,
    },
  },

  compatibilityDate: "2025-05-09",
});
