<script setup>
import { ArrowRight } from "@iconoir/vue"

// Histórias reais da própria equipe fundadora (Paula, Iza, Camilly — já
// públicas no pitch deck do Access+; a 4ª, a da Ester, vira o destaque
// lá no topo da hero em vez de ficar empilhada aqui). `role` deixa claro
// de onde a pessoa veio e pra onde ela foi, sem travessão, com números e
// nomes de lugar/conquista concretos — isso impressiona mais que adjetivo.
const historias = [
  {
    key: "paula",
    accent: "var(--color-primary)",
    before: "é possível discursar na ",
    highlight: "ONU",
    after: " com tudo pago aos 19 anos?",
    name: "Paula",
    role: "Estudou a vida inteira em escolas públicas. Ganhou um concurso de redação e foi discursar na ONU, em Genebra, ao lado de diplomatas reais.",
    photo: "/images/founder-paula.jpg",
  },
  {
    key: "iza",
    accent: "var(--color-magenta)",
    before: "é possível fazer um ",
    highlight: "curso de verão",
    after: " em universidade americana com tudo pago no ensino médio?",
    name: "Iza",
    role: 'Achava que intercâmbio era "coisa de rico". Fez um curso de verão em universidade americana, com tudo pago, ainda no ensino médio.',
    photo: "/images/founder-iza.jpg",
  },
  {
    key: "camilly",
    accent: "var(--color-lime)",
    before: "existem ",
    highlight: "competições de tecnologia",
    after: " pro Fundamental e Médio com viagem grátis e prêmio em dinheiro?",
    name: "Camilly",
    role: "Veio de uma família de baixa renda no interior da Bahia. Representou o Brasil em uma competição internacional de tecnologia, com viagem e prêmio pagos.",
    photo: "/images/founder-camilly.jpg",
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
  <section id="historias" class="section dyk-section">
    <div class="wrap">
      <div class="dyk-intro" data-aos="fade-up">
        <span class="kicker">Histórias reais</span>
        <h2 class="mt-3.5" style="font-size: clamp(32px, 4.5vw, 54px); text-wrap: balance">
          Não é falta de capacidade. <span class="text-primary">É falta de contato.</span>
        </h2>
        <p class="dyk-lead">
          Três pessoas comuns, muitas portas fechadas até acharem a certa. Você também pode achar a sua.
        </p>
      </div>

      <div class="dyk-scroll mt-14">
        <article v-for="h in historias" :key="h.key" class="dyk-card" data-aos="fade-up">
          <div class="dyk-frame" :style="{ borderColor: h.accent }">
            <img
              v-if="!quebradas.has(h.key)"
              :src="h.photo"
              :alt="h.name"
              class="dyk-photo"
              @error="marcarQuebrada(h.key)"
            />
            <div v-else class="dyk-photo dyk-photo--fallback" :style="{ background: h.accent }">
              {{ iniciais(h.name) }}
            </div>
          </div>

          <p class="dyk-headline">
            {{ h.before }}<span :style="{ color: h.accent }">{{ h.highlight }}</span>{{ h.after }}
          </p>
          <p class="dyk-name">{{ h.name }}</p>
          <p class="dyk-role">{{ h.role }}</p>
        </article>
      </div>

      <div class="dyk-punchline" data-aos="zoom-in">
        <p>
          <span class="text-lime">Essa também pode ser</span> a sua história.
        </p>
        <NuxtLink to="/oportunidades" class="btn btn-lime mt-8">
          Encontrar minha oportunidade <ArrowRight class="w-[18px] h-[18px]" />
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
.dyk-intro {
  max-width: 640px;
}

.dyk-lead {
  margin-top: 16px;
  font-size: 17px;
  color: color-mix(in srgb, var(--color-ink) 65%, transparent);
  max-width: 46ch;
}

.dyk-scroll {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 28px;
}

.dyk-card {
  min-width: 0;
}

/* Moldura landscape de tamanho fixo: fotos reais vão chegar em proporções
   diferentes, e essa moldura garante que todas apareçam do mesmo jeito,
   organizadas, em vez de cada card ter uma altura diferente. */
.dyk-frame {
  position: relative;
  aspect-ratio: 3 / 2;
  border-radius: var(--r-card);
  border: 4px solid;
  padding: 6px;
  background: #fff;
}

.dyk-photo {
  width: 100%;
  height: 100%;
  border-radius: calc(var(--r-card) - 4px);
  object-fit: cover;
  display: block;
}

.dyk-photo--fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 44px;
  color: #fff;
}

.dyk-headline {
  margin-top: 18px;
  font-family: var(--font-display);
  font-size: clamp(19px, 1.8vw, 23px);
  line-height: 1.28;
  letter-spacing: -0.01em;
  text-wrap: balance;
}

.dyk-name {
  margin-top: 16px;
  font-weight: 700;
  font-size: 14.5px;
  color: var(--color-ink);
}

.dyk-role {
  margin-top: 4px;
  font-size: 14px;
  line-height: 1.5;
  color: color-mix(in srgb, var(--color-ink) 62%, transparent);
}

@media (max-width: 900px) {
  .dyk-scroll {
    display: flex;
    gap: 20px;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    padding-bottom: 12px;
  }
  .dyk-scroll::-webkit-scrollbar {
    height: 6px;
  }
  .dyk-scroll::-webkit-scrollbar-thumb {
    background: color-mix(in srgb, var(--color-ink) 15%, transparent);
    border-radius: 999px;
  }
  .dyk-card {
    flex: none;
    width: min(320px, 82vw);
    scroll-snap-align: start;
  }
}

.dyk-punchline {
  margin-top: 90px;
  padding: 64px 32px;
  border-radius: var(--r-lg);
  background: var(--color-primary);
  text-align: center;
}
.dyk-punchline p {
  font-family: var(--font-display);
  font-size: clamp(26px, 4vw, 42px);
  line-height: 1.2;
  color: #fff;
  text-wrap: balance;
  max-width: 20ch;
  margin: 0 auto;
}

@media (max-width: 860px) {
  .dyk-punchline {
    margin-top: 56px;
    padding: 48px 24px;
  }
}
</style>
