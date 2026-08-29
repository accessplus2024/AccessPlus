import AOS from "aos"
import "aos/dist/aos.css"

// Nunca tinha sido inicializado — a biblioteca já estava instalada e vários
// componentes já tinham atributos data-aos (ex: NewsletterCard), mas sem
// isso eles não faziam nada. Reinicializa a cada troca de rota porque o
// Nuxt não remonta o <body> inteiro em navegação client-side.
export default defineNuxtPlugin((nuxtApp) => {
  const start = () => AOS.init({
    duration: 700,
    easing: "ease-out-cubic",
    once: true,
    offset: 60,
  })

  nuxtApp.hook("app:mounted", () => start())
  nuxtApp.hook("page:finish", () => AOS.refreshHard())
})
