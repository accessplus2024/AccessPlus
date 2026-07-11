<script setup>
const email = ref("")
const state = ref("idle") // idle | loading | success | error
const errorMsg = ref("")

const submit = async () => {
  if (!email.value) return
  state.value = "loading"
  try {
    await $fetch("/api/newsletter/subscribe", { method: "POST", body: { email: email.value } })
    state.value = "success"
  } catch (e) {
    errorMsg.value = e?.data?.statusMessage || "Algo deu errado. Tente novamente."
    state.value = "error"
  }
}
</script>

<template>
  <section id="newsletter-subscription" class="wrap">
    <div
      class="relative overflow-hidden text-white"
      style="background: var(--color-primary); border-radius: var(--r-lg); padding: 64px 48px"
    >
      <div class="relative" style="max-width: 620px">
        <span class="kicker text-white" style="opacity: .8; color: #fff">Newsletter</span>
        <h2 class="mt-4" style="font-size: clamp(32px, 4vw, 52px); text-wrap: balance">
          Não perca nenhuma novidade!
        </h2>
        <p class="mt-4 text-white/85 leading-relaxed" style="font-size: 18px">
          Inscreva-se na nossa newsletter e receba semanalmente as melhores
          oportunidades e dicas para turbinar sua jornada educacional.
        </p>

        <div v-if="state !== 'success'" class="mt-7 flex gap-2 flex-wrap">
          <input
            v-model="email"
            type="email"
            placeholder="Digite seu e-mail"
            :disabled="state === 'loading'"
            class="font-body flex-1 min-w-0 bg-white text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-lime"
            style="padding: 14px 20px; border-radius: var(--r-pill); font-size: 15px; border: none; min-width: 200px"
            @keydown.enter="submit"
          />
          <button
            class="btn btn-lime flex-shrink-0"
            :disabled="state === 'loading' || !email"
            @click="submit"
          >
            {{ state === 'loading' ? 'Enviando…' : 'Inscrever-se' }}
          </button>
        </div>
        <p v-if="state === 'error'" class="mt-3 text-white/85" style="font-size: 14px">{{ errorMsg }}</p>

        <div v-if="state === 'success'" class="mt-7 bg-white/15 rounded-card" style="padding: 20px 24px">
          <p class="font-body font-semibold" style="font-size: 17px">Inscrição confirmada!</p>
          <p class="text-white/80 mt-1" style="font-size: 14px">Você receberá nossas novidades toda quarta-feira.</p>
        </div>
      </div>
    </div>
  </section>
</template>
