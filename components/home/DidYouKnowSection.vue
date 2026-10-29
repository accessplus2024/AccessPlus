<script setup>
import { ArrowRight } from "@iconoir/vue"

// Histórias reais da própria equipe fundadora (Paula, Iza, Camilly — já
// públicas no pitch deck do Access+; a 4ª, a da Ester, vira o destaque
// lá no topo da hero em vez de ficar empilhada aqui). `role` deixa claro
// de onde a pessoa veio e pra onde ela foi, com números e nomes de
// lugar/conquista concretos — isso impressiona mais que adjetivo.
//
// As três aparecem lado a lado (grade), sem carrossel: dá pra comparar as
// histórias de uma vez, sem esperar o card trocar. `tag` é a etiqueta sobre a
// foto; `tagBg`/`tagFg` são as cores dela (fundo/texto).
const historias = [
  {
    key: "paula",
    photo: "/images/founder-paula.jpg",
    alt: "Paula com colegas na ONU, em Genebra",
    tag: "ONU · Genebra",
    tagBg: "var(--color-primary)",
    tagFg: "#FFFFFF",
    before: "Com 19 anos, Paula viajou para ",
    highlight: "Genebra sem pagar nada",
    after: " para discursar na ONU representando o Brasil.",
    name: "Paula",
    role: "Nascida e criada na periferia carioca, estudou a vida inteira em escola pública. Ganhou um concurso de redação e discursou na ONU ao lado de diplomatas.",
  },
  {
    key: "iza",
    photo: "/images/founder-iza.jpg",
    alt: "Iza com colegas do programa de verão",
    tag: "Universidade de Washington",
    tagBg: "var(--color-magenta)",
    tagFg: "var(--color-ink)",
    before: "Iza passou um verão na ",
    highlight: "Universidade de Washington",
    after: " com tudo pago, depois de ouvir que intercâmbio era só pra gente rica.",
    name: "Iza",
    role: "Estudante do IFBA, hoje faz graduação na UFPE.",
  },
  {
    key: "camily",
    photo: "/images/founder-camilly.jpg",
    alt: "Camily e amigas com a bandeira do Brasil",
    tag: "São Franciso",
    tagBg: "var(--color-lime)",
    tagFg: "var(--color-ink)",
    before: "Camily foi para ",
    highlight: "São Francisco",
    after: " depois de vencer, com as amigas, a maior competição de tecnologia feminina.",
    name: "Camily",
    role: "Ex-estudante do IFBA, achava que tecnologia não era para ela. Hoje estuda Ciência da Computação no Bowdoin College.",
  },
]

const quebradas = ref(new Set())
function marcarQuebrada(key) {
  quebradas.value = new Set(quebradas.value).add(key)
}
function iniciais(nome) {
  return nome.trim().charAt(0).toUpperCase()
}
</script>

<template>
  <section id="historias" class="dyk-section">
    <div class="wrap">
      <div class="dyk-top" data-aos="fade-up">
        <div class="dyk-intro">
          <span class="kicker">Histórias reais</span>
          <h2 class="dyk-title">
            Não é falta de capacidade. <span class="text-primary">É falta de contato.</span>
          </h2>
        </div>
        <p class="dyk-lead">
          Três pessoas comuns, muitas portas fechadas até acharem a certa. Você também pode achar a sua.
        </p>
      </div>

      <div class="dyk-grid">
        <article
          v-for="(h, i) in historias"
          :key="h.key"
          class="dyk-card"
          data-aos="fade-up"
          :data-aos-delay="i * 80"
        >
          <div class="dyk-frame">
            <img
              v-if="!quebradas.has(h.key)"
              :src="h.photo"
              :alt="h.alt"
              class="dyk-photo"
              loading="lazy"
              @error="marcarQuebrada(h.key)"
            />
            <div v-else class="dyk-photo dyk-photo--fallback" :style="{ background: h.tagBg, color: h.tagFg }">
              {{ iniciais(h.name) }}
            </div>
            <span class="dyk-tag" :style="{ background: h.tagBg, color: h.tagFg }">{{ h.tag }}</span>
          </div>

          <div class="dyk-card-text">
            <p class="dyk-headline">
              {{ h.before }}<span class="dyk-highlight">{{ h.highlight }}</span>{{ h.after }}
            </p>
            <p class="dyk-name">{{ h.name }}</p>
            <p class="dyk-role">{{ h.role }}</p>
          </div>
        </article>
      </div>

      <div class="dyk-cta" data-aos="fade-up">
        <p>Essa também pode ser a sua história.</p>
        <NuxtLink to="/oportunidades" class="btn btn-ink">
          Encontrar minha oportunidade <ArrowRight class="w-[18px] h-[18px]" />
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Vem logo depois da faixa de logos (HomeLogoStrip), que não tem respiro
   embaixo — então o espaço de cima é o mesmo de baixo. */
.dyk-section {
  padding-top: clamp(64px, 8vw, 104px);
  padding-bottom: clamp(64px, 8vw, 104px);
}

/* Título à esquerda, texto de apoio à direita, alinhados pela base. */
.dyk-top {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px 48px;
}

.dyk-intro {
  flex: 1 1 560px;
  min-width: 0;
}

.dyk-title {
  margin-top: 14px;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: clamp(36px, 4.6vw, 60px);
  line-height: 1.02;
  letter-spacing: -0.035em;
  text-wrap: balance;
  hyphens: manual;
}

.dyk-lead {
  flex: 0 1 380px;
  margin: 0;
  font-size: 16.5px;
  line-height: 1.65;
  color: rgba(21, 17, 31, 0.7);
}

/* auto-fit + minmax: 3 colunas no desktop, e cai sozinho pra 2 ou 1 coluna
   quando não cabe um card de 300px — sem precisar de media query. */
.dyk-grid {
  margin-top: 48px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
  gap: 20px;
}

.dyk-card {
  display: flex;
  flex-direction: column;
  background: var(--color-card);
  border: 1px solid rgba(21, 17, 31, 0.08);
  border-radius: var(--r-card);
  padding: 10px;
  box-shadow: 0 8px 24px rgba(21, 17, 31, 0.05);
}

.dyk-frame {
  position: relative;
}

.dyk-photo {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 10;
  object-fit: cover;
  border-radius: 16px;
}

.dyk-photo--fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 44px;
}

.dyk-tag {
  position: absolute;
  left: 12px;
  bottom: 12px;
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: var(--r-pill);
  font-size: 12.5px;
  font-weight: 600;
  line-height: 1.3;
}

/* flex: 1 + margin-top: auto no nome = o nome/descrição ficam alinhados no
   pé do card, mesmo quando as manchetes têm tamanhos diferentes. */
.dyk-card-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px 14px 18px;
}

.dyk-headline {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 21px;
  line-height: 1.3;
  letter-spacing: -0.01em;
  text-wrap: pretty;
}

/* Efeito "marca-texto": gradiente transparente nos 60% de cima e lima nos
   40% de baixo, atrás do texto. */
.dyk-highlight {
  background: linear-gradient(transparent 60%, var(--color-lime) 60%);
  padding: 0 2px;
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
}

.dyk-name {
  margin-top: auto;
  padding-top: 20px;
  font-size: 15.5px;
  font-weight: 700;
}

.dyk-role {
  margin-top: 4px;
  font-size: 14.5px;
  line-height: 1.6;
  color: rgba(21, 17, 31, 0.68);
}

/* ---- Faixa lima de chamada ---- */
.dyk-cta {
  margin-top: 28px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px 24px;
  padding: 18px 18px 18px 32px;
  background: var(--color-lime);
  border-radius: var(--r-lg);
}

.dyk-cta p {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: clamp(22px, 2.4vw, 30px);
  line-height: 1.15;
  letter-spacing: -0.02em;
}

@media (max-width: 640px) {
  .dyk-cta {
    padding: 24px;
    border-radius: var(--r-card);
  }
  .dyk-cta .btn {
    width: 100%;
  }
}
</style>
