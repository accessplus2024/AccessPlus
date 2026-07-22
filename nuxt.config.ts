// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    compatibilityDate: "2024-04-03",
    // A rota /api/rag/search chama a IA (embedding + geração) e pode passar dos
    // ~10s padrão da Vercel, causando 504. Damos mais tempo à função.
    // 60s é o máximo no plano Hobby/grátis da Vercel.
    vercel: {
      functions: {
        maxDuration: 60,
      },
    },
  },
  devtools: { enabled: true },
  css: ["~/assets/css/main.css"],

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  modules: ["@nuxt/fonts"],

  fonts: {
    families: [{ name: "Poppins", weights: [300, 400, 500, 600, 700] }],
  },

  plugins: [
    { src: "~/plugins/vercel-analytics.client.ts", mode: "client" },
    { src: "~/plugins/google-analytics.ts", mode: "client" },
    { src: "~/plugins/supabase-auth.client.js", mode: "client" },
    { src: "~/plugins/vlibras.client.ts", mode: "client" },
  ],

  runtimeConfig: {
    beehiivApiKey: process.env.BEEHIV_API_KEY,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_KEY,
    public: {
      beehiivPublicationId: process.env.BEEHIV_PUBLICATION_ID,
      // Credenciais PÚBLICAS do Supabase (chave anon/publishable — pode ir pro navegador).
      // Usadas para login com Google e para postar/ler comentários no site.
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    },
  },

  compatibilityDate: "2025-05-09",
});
