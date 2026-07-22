export default defineNuxtPlugin(() => {
  const script = document.createElement("script");
  script.src = "https://vlibras.gov.br/app/vlibras-plugin.js";
  script.onload = () => {
    new (window as any).VLibras.Widget("https://vlibras.gov.br/app");
  };
  document.body.appendChild(script);
});
