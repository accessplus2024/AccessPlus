<script setup>
// Faixa de logos logo abaixo da hero: prova rápida, em uma linha, de onde a
// equipe e a comunidade já foram aprovadas. Logos em cinza (grayscale) pra
// nenhuma marca competir com o roxo/lima do site.
//
// `h` é a altura de cada logo em px — cada arquivo tem uma proporção e uma
// "sobra" de margem diferente (o da Oxford, por exemplo, vem com bastante
// espaço vazio em volta), então a altura é ajustada um a um pra que todos
// pareçam ter o mesmo peso visual. `m` (opcional) é uma margem vertical
// negativa: o arquivo da Oxford tem muito espaço vazio em volta, então ele
// precisa ser bem mais alto pra aparecer do tamanho dos outros — a margem
// negativa evita que isso deixe a linha inteira mais alta.
const logos = [
  { key: "harvard", alt: "Harvard", src: "/images/Harvard_University_logo.svg", h: 32 },
  { key: "yale", alt: "Yale", src: "/images/Yale_University_logo.svg", h: 30 },
  { key: "mit", alt: "MIT", src: "/images/MIT_Logo_and_Wordmark.svg", h: 26 },
  { key: "oxford", alt: "Oxford", src: "/images/University_of_Oxford-Logo.wine.svg", h: 64, m: -18 },
  { key: "google", alt: "Google", src: "/images/Google_2015_logo.svg", h: 28 },
  { key: "northwestern", alt: "Northwestern", src: "/images/Northwestern_University_wordmark.svg", h: 22 },
  { key: "ubc", alt: "UBC", src: "/images/British_columbia_ca_univ_logo.svg", h: 28 },
  { key: "fgv", alt: "FGV", src: "/images/Logo_FGV_-_Fundação_Getulio_Vargas.png", h: 22 },
  { key: "insper", alt: "Insper", src: "/images/Logo_Insper.png", h: 28 },
]

// Se um arquivo sumir/quebrar, esconde o logo em vez de mostrar o ícone de
// imagem quebrada no meio da faixa.
const quebradas = ref(new Set())
function marcarQuebrada(key) {
  quebradas.value = new Set(quebradas.value).add(key)
}
</script>

<template>
  <section class="logo-strip" aria-label="Onde a equipe e a comunidade foram aprovadas">
    <div class="wrap logo-strip-inner">
      <p class="logo-strip-label">Aprovações e bolsas integrais da equipe e comunidade em</p>

      <ul class="logo-strip-list" role="list">
        <template v-for="l in logos" :key="l.key">
          <li v-if="!quebradas.has(l.key)">
            <img
              :src="l.src"
              :alt="l.alt"
              :style="{ height: `${l.h}px`, margin: l.m ? `${l.m}px 0` : undefined }"
              class="logo-strip-img"
              loading="lazy"
              @error="marcarQuebrada(l.key)"
            />
          </li>
        </template>
        <li class="logo-strip-more">
          <span class="logo-strip-more-num">+60</span> programas
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.logo-strip {
  background: var(--color-paper-2);
  border-top: 1px solid rgba(21, 17, 31, 0.08);
  border-bottom: 1px solid rgba(21, 17, 31, 0.08);
}

.logo-strip-inner {
  padding-top: 32px;
  padding-bottom: 32px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 24px 48px;
}

.logo-strip-label {
  margin: 0;
  flex: 0 1 230px;
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  line-height: 1.5;
  color: rgba(21, 17, 31, 0.66);
}

.logo-strip-list {
  flex: 1 1 600px;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 22px 40px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.logo-strip-img {
  display: block;
  width: auto;
  max-width: 160px;
  filter: grayscale(1);
  opacity: 0.72;
  transition: filter 0.25s ease, opacity 0.25s ease;
}
/* Passar o mouse devolve a cor original do logo. */
.logo-strip-img:hover {
  filter: none;
  opacity: 1;
}

.logo-strip-more {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  padding: 7px 14px;
  border-radius: var(--r-pill);
  border: 1.5px dashed rgba(75, 63, 228, 0.45);
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 600;
}
.logo-strip-more-num {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 17px;
}

@media (max-width: 640px) {
  .logo-strip-inner {
    padding-top: 28px;
    padding-bottom: 28px;
  }
  .logo-strip-label {
    flex-basis: 100%;
  }
  .logo-strip-list {
    gap: 18px 28px;
  }
}
</style>
