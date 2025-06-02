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

  modules: [
    "@nuxt/fonts",
    [
      "@nuxtjs/google-gtag",
      {
        id: 'G-KTGB0TMBDP',
        config: {
          anonymize_ip: true,
          send_page_view: false,
        },
        debug: false,
        disableAutoPageTrack: false,
      }
    ]
  ],

  plugins: [{ src: '~/plugins/vercel-analytics.client.ts', mode: 'client' }],
  compatibilityDate: "2025-05-09",
});