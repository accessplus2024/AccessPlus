<script setup>
// Seção de resultados/autoridade: entra logo depois do HomeHeader.
// Os logos vêm do Wikimedia Commons (Special:FilePath resolve pelo nome do
// arquivo). Enquanto/se algum nome mudar lá, o nome da instituição aparece
// em texto no lugar — mesmo padrão do HomeAwardsSection.
const commons = (arquivo) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(arquivo)}`

const instituicoes = [
  { key: "harvard", nome: "Harvard", logo: commons("Harvard University logo.svg"), padding: 14 },
  { key: "stanford", nome: "Stanford", logo: commons("Stanford wordmark (2012).svg"), padding: 14 },
  { key: "yale", nome: "Yale", logo: commons("Yale University Shield 1.svg"), padding: 14 },
  { key: "mit", nome: "MIT", logo: commons("MIT logo.svg"), padding: 20 },
  { key: "oxford", nome: "Oxford", logo: commons("University of Oxford.svg"), padding: 14 },
  { key: "onu", nome: "ONU", logo: commons("Emblem of the United Nations.svg"), padding: 14 },
  { key: "google", nome: "Google", logo: commons("Google 2015 logo.svg"), padding: 22 },
  { key: "northwestern", nome: "Northwestern", logo: commons("Northwestern University seal.svg"), padding: 14 },
  { key: "ubc", nome: "UBC", logo: commons("British columbia ca univ logo.svg"), padding: 14 },
  { key: "fgv", nome: "FGV", logo: commons("Logo FGV - Fundação Getulio Vargas.png"), padding: 16 },
  { key: "insper", nome: "Insper", logo: commons("Logo Insper.png"), padding: 16 },
]

// `carregados` some com o texto quando o logo aparece; `quebradas` some com a
// imagem quando ela falha. Sem isso, nome comprido (Northwestern) vaza em
// volta do logo, que é menor que a célula.
const carregados = ref(new Set())
const quebradas = ref(new Set())
function marcarCarregada(key) { carregados.value = new Set(carregados.value).add(key) }
function marcarQuebrada(key) { quebradas.value = new Set(quebradas.value).add(key) }
</script>

<template>
  <section class="section-sm">
    <div class="wrap">
      <div style="max-width: 760px" data-aos="fade-up">
        <span class="kicker">Quem constrói o Access+</span>
        <h2 class="mt-3.5" style="font-size: clamp(32px, 4.4vw, 52px); text-wrap: balance">
          Criado por estudantes de escola pública que já
          <span class="relative inline-block text-primary">
            passaram por essas portas
            <svg viewBox="0 0 320 24" preserveAspectRatio="none" class="title-mark">
              <path d="M3 16 C 80 6, 240 6, 317 14" stroke="var(--color-lime)" stroke-width="8" fill="none" stroke-linecap="round" />
            </svg>
          </span>.
        </h2>
        <p class="lead">
          Nós somos um time de estudantes de escola pública, de baixa renda, e é a nossa própria
          equipe que segue mantendo esta plataforma de pé. As aprovações abaixo são nossas e da
          nossa comunidade: prova de que o caminho existe e de que ele passa por informação na
          hora certa.
        </p>
      </div>

      <div class="results-grid" data-aos="fade-up" data-aos-delay="80">
        <div class="numero-card">
          <div>
            <span class="numero-eyebrow">Bolsas acumuladas</span>
            <div class="numero">
              <span class="numero-moeda">R$</span>
              <span class="numero-valor">12</span>
              <span class="numero-unidade">mi</span>
            </div>
            <p class="numero-legenda">
              em bolsas e programas com tudo pago conquistados pela equipe e pela comunidade Access+.
            </p>
          </div>
          <div class="numero-extras">
            <div class="numero-extra">
              <span class="numero-extra-valor">+60</span>
              <span class="numero-extra-texto">programas acadêmicos com aprovação</span>
            </div>
            <div class="numero-extra">
              <span class="numero-extra-valor">100%</span>
              <span class="numero-extra-texto">do time fundador vindo da escola pública</span>
            </div>
          </div>
        </div>

        <div class="logos-card">
          <div class="logos-head">
            <span class="kicker" style="letter-spacing: .14em">Aprovações e bolsas integrais em</span>
            <span class="logos-tag">equipe + comunidade</span>
          </div>

          <div class="logos-grid">
            <div v-for="i in instituicoes" :key="i.key" class="logo-cell">
              <span v-if="!carregados.has(i.key)" class="logo-nome">{{ i.nome }}</span>
              <img
                v-if="!quebradas.has(i.key)"
                :src="i.logo"
                :alt="i.nome"
                class="logo-img"
                :style="{ inset: `${i.padding}px` }"
                @load="marcarCarregada(i.key)"
                @error="marcarQuebrada(i.key)"
              />
            </div>
            <div class="logo-cell logo-cell--mais">
              <span class="mais-valor">+60</span>
              <span class="mais-texto">outros programas</span>
            </div>
          </div>

          <div class="logos-foot">
            <p>
              Parte da equipe estuda hoje com bolsa integral, no Brasil e fora dele. Todas essas
              vagas foram encontradas do mesmo jeito: procurando.
            </p>
            <a href="#historias">Ver as histórias →</a>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.title-mark {
  position: absolute;
  left: 0;
  bottom: -8px;
  width: 100%;
  height: 14px;
}

.lead {
  margin-top: 22px;
  max-width: 56ch;
  font-size: 17px;
  line-height: 1.7;
  color: color-mix(in srgb, var(--color-ink) 70%, transparent);
}

.results-grid {
  display: grid;
  grid-template-columns: 0.86fr 1.14fr;
  gap: 20px;
  margin-top: 40px;
  align-items: stretch;
}

/* Card do número: indigo cheio, o único bloco colorido da seção — o resto é
   creme/branco pra não competir com a grade de logos. */
.numero-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 28px;
  background: var(--color-primary);
  border-radius: var(--r-lg);
  padding: 38px 36px;
  color: #fff;
}

.numero-eyebrow {
  display: block;
  font-weight: 600;
  font-size: 12.5px;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, .7);
}

.numero {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-top: 14px;
  font-family: var(--font-display);
  font-weight: 800;
  letter-spacing: -.04em;
  line-height: .86;
}
.numero-moeda, .numero-unidade { font-size: 36px; margin-top: 12px; }
.numero-unidade { color: var(--color-lime); }
.numero-valor { font-size: clamp(80px, 9vw, 120px); }

.numero-legenda {
  margin-top: 18px;
  max-width: 30ch;
  font-size: 15.5px;
  line-height: 1.65;
  color: rgba(255, 255, 255, .82);
}

.numero-extras {
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-top: 1px solid rgba(255, 255, 255, .22);
  padding-top: 22px;
}
.numero-extra { display: flex; align-items: baseline; gap: 12px; }
.numero-extra-valor {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 32px;
  line-height: 1;
  color: var(--color-lime);
}
.numero-extra-texto {
  font-size: 14.5px;
  line-height: 1.45;
  color: rgba(255, 255, 255, .82);
}

.logos-card {
  background: var(--color-card);
  border: 1px solid rgba(21, 17, 31, .08);
  border-radius: var(--r-lg);
  box-shadow: 0 8px 24px rgba(21, 17, 31, .06);
  padding: 32px 32px 28px;
}

.logos-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.logos-tag {
  display: inline-flex;
  align-items: center;
  background: rgba(200, 241, 53, .28);
  border-radius: var(--r-pill);
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 600;
}

.logos-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-top: 22px;
}

.logo-cell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 72px;
  padding: 12px;
  background: var(--color-paper);
  border-radius: var(--r-card);
  overflow: hidden;
}

.logo-nome {
  font-weight: 700;
  font-size: 13.5px;
  line-height: 1.2;
  text-align: center;
  color: color-mix(in srgb, var(--color-ink) 72%, transparent);
}

/* `inset` vem do dado (cada marca precisa de respiro diferente); largura e
   altura saem do inset via calc pra imagem nunca estourar a célula. */
.logo-img {
  position: absolute;
  width: auto;
  height: auto;
  max-width: calc(100% - 28px);
  max-height: calc(100% - 28px);
  margin: auto;
  object-fit: contain;
}

.logo-cell--mais {
  flex-direction: column;
  gap: 2px;
  background: rgba(75, 63, 228, .07);
  border: 1.5px dashed rgba(75, 63, 228, .32);
  text-align: center;
}
.mais-valor {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 18px;
  color: var(--color-primary);
}
.mais-texto {
  font-size: 11.5px;
  font-weight: 600;
  line-height: 1.2;
  color: color-mix(in srgb, var(--color-ink) 60%, transparent);
}

.logos-foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 24px;
  border-top: 1px solid rgba(21, 17, 31, .08);
  padding-top: 18px;
}
.logos-foot p {
  margin: 0;
  max-width: 52ch;
  font-size: 14.5px;
  line-height: 1.55;
  color: color-mix(in srgb, var(--color-ink) 62%, transparent);
}
.logos-foot a {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-ink);
  opacity: .7;
  text-decoration: none;
}
.logos-foot a:hover { opacity: 1; }

@media (max-width: 980px) {
  .results-grid { grid-template-columns: 1fr; }
  .logos-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 560px) {
  .logos-grid { grid-template-columns: repeat(2, 1fr); }
  .numero-card { padding: 30px 26px; }
}
</style>
