export default defineNuxtPlugin(() => {
  const head = useHead({
    script: [
      {
        src: 'https://www.googletagmanager.com/gtag/js?id=G-KTGB0TMBDP',
        async: true
      },
      {
        innerHTML: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-KTGB0TMBDP');
        `
      }
    ]
  })
})