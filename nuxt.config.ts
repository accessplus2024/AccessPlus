// nuxt.config.ts
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

  modules: ["@nuxt/fonts", "@nuxtjs/color-mode"],

  fonts: {
    families: [{ name: "Poppins", weights: [300] }],
  },

  colorMode: {
    preference: "system",
    fallback: "light",
    classSuffix: "",
    storageKey: "nuxt-color-mode",
  },

  plugins: [
    { src: "~/plugins/vercel-analytics.client.ts", mode: "client" },
    { src: "~/plugins/google-analytics.ts", mode: "client" },
  ],

  runtimeConfig: {
    beehiivApiKey: process.env.BEEHIV_API_KEY,
    public: {
      beehiivPublicationId: process.env.BEEHIV_PUBLICATION_ID,
    },
  },

  compatibilityDate: "2025-05-09",
});
