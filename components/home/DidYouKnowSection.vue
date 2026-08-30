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

// Carrossel em vez de grade de 3 colunas: um card só, mais compacto,
// evita a faixa de espaço vazio que sobrava com os três lado a lado.
// Pausa ao passar o mouse — ninguém gosta de ler pela metade e o card trocar.
const ativo = ref(0)
const pausado = ref(false)
const historiaAtual = computed(() => historias[ativo.value])
let timer = null

function ir(i) { ativo.value = i }

onMounted(() => {
  timer = setInterval(() => {
    if (!pausado.value) ativo.value = (ativo.value + 1) % historias.length
  }, 6000)
})
onBeforeUnmount(() => { if (timer) clearInterval(timer) })
</script>

<template>
  <section id="historias" class="section dyk-section">
    <div class="wrap">
      <div class="dyk-intro" data-aos="fade-up">
        <span class="kicker">Histórias reais</span>
        <h2 class="mt-3.5" style="font-size: clamp(38px, 5.5vw, 68px); line-height: 1.22; text-wrap: balance">
          Não é falta de capacidade. <span class="text-primary">É falta de contato.</span>
        </h2>
        <p class="dyk-lead">
          Três pessoas comuns, muitas portas fechadas até acharem a certa. Você também pode achar a sua.
        </p>
      </div>

      <div
        class="dyk-carousel mt-14"
        data-aos="fade-up"
        @mouseenter="pausado = true"
        @mouseleave="pausado = false"
      >
        <Transition name="dyk-fade" mode="out-in">
          <article :key="historiaAtual.key" class="dyk-card">
            <div class="dyk-frame" :style="{ borderColor: historiaAtual.accent }">
              <img
                v-if="!quebradas.has(historiaAtual.key)"
                :src="historiaAtual.photo"
                :alt="historiaAtual.name"
                class="dyk-photo"
                @error="marcarQuebrada(historiaAtual.key)"
              />
              <div v-else class="dyk-photo dyk-photo--fallback" :style="{ background: historiaAtual.accent }">
                {{ iniciais(historiaAtual.name) }}
              </div>
            </div>

            <div class="dyk-card-text">
              <p class="dyk-headline">
                {{ historiaAtual.before }}<span :style="{ color: historiaAtual.accent }">{{ historiaAtual.highlight }}</span>{{ historiaAtual.after }}
              </p>
              <p class="dyk-name">{{ historiaAtual.name }}</p>
              <p class="dyk-role">{{ historiaAtual.role }}</p>
            </div>
          </article>
        </Transition>

        <div class="dyk-thumbs">
          <button
            v-for="(h, i) in historias" :key="h.key" type="button"
            class="dyk-thumb" :class="{ 'dyk-thumb--ativo': i === ativo }"
            :style="{ borderColor: i === ativo ? h.accent : 'transparent' }"
            :aria-label="`Ver história de ${h.name}`"
            @click="ir(i)"
          >
            <img
              v-if="!quebradas.has(h.key)"
              :src="h.photo" :alt="h.name" class="dyk-thumb-photo"
              @error="marcarQuebrada(h.key)"
            />
            <div v-else class="dyk-thumb-photo dyk-photo--fallback" :style="{ background: h.accent }">
              {{ iniciais(h.name) }}
            </div>
            <span class="dyk-thumb-name">{{ h.name }}</span>
          </button>
        </div>
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
/* .section (assets/css/main.css) dá 96px de padding-top — fazia sentido
   quando o hero acima era mais alto (stats + botão empilhados). Com o hero
   mais enxuto, esse respiro fixo virou vão vazio. Reduz só aqui, sem mexer
   na classe global usada pelas outras seções da home. */
.dyk-section {
  padding-top: 24px;
}

.dyk-intro {
  max-width: 820px;
}

.dyk-lead {
  margin-top: 16px;
  font-size: 17px;
  color: color-mix(in srgb, var(--color-ink) 65%, transparent);
  max-width: 46ch;
}

/* Card único, centralizado, foto em cima — largura própria (não a seção
   inteira) pra não esticar a foto/texto até ficar estranho, mas com
   presença suficiente pra não parecer perdido no espaço da seção. */
.dyk-carousel {
  max-width: 620px;
  margin-left: auto;
  margin-right: auto;
}

.dyk-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.dyk-card-text {
  min-width: 0;
  margin-top: 28px;
}

/* Moldura paisagem: uma foto de grupo/retrato inteiro fica cortada e
   "quadrada" numa moldura alta (3:4) — 16:10 mostra mais gente/contexto e
   lê como foto de verdade, não como crop apertado. */
.dyk-frame {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
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
  font-family: var(--font-display);
  font-size: clamp(22px, 2.4vw, 30px);
  line-height: 1.28;
  letter-spacing: -0.01em;
  text-wrap: balance;
}

.dyk-name {
  margin-top: 20px;
  font-weight: 700;
  font-size: 16px;
  color: var(--color-ink);
}

.dyk-role {
  margin-top: 6px;
  font-size: 15px;
  line-height: 1.6;
  color: color-mix(in srgb, var(--color-ink) 62%, transparent);
}

/* Miniaturas das outras histórias em vez de bolinhas — dá pra ver quem
   vem a seguir (preenche o vão embaixo do card) em vez de só um indicador
   abstrato de posição. */
.dyk-thumbs {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 32px;
}
.dyk-thumb {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  opacity: 0.55;
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.dyk-thumb:hover {
  opacity: 0.85;
  transform: translateY(-2px);
}
.dyk-thumb--ativo {
  opacity: 1;
}
.dyk-thumb-photo {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  object-fit: cover;
  display: block;
  border: 3px solid;
  border-color: inherit;
  font-size: 20px;
}
.dyk-thumb-name {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--color-ink);
}

.dyk-fade-enter-active, .dyk-fade-leave-active {
  transition: opacity 0.3s ease;
}
.dyk-fade-enter-from, .dyk-fade-leave-to {
  opacity: 0;
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
