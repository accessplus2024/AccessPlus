<script setup>
const STORAGE_KEY = "ap_newsletter_modal_seen"

const visible = ref(false)
const email = ref("")
const state = ref("idle") // idle | loading | success | error
const errorMsg = ref("")

const close = () => {
  visible.value = false
  document.body.style.overflow = ""
  try {
    localStorage.setItem(STORAGE_KEY, "1")
  } catch (e) {}
}

const submit = async () => {
  if (!email.value) return
  state.value = "loading"
  try {
    await $fetch("/api/newsletter/subscribe", { method: "POST", body: { email: email.value } })
    state.value = "success"
    try {
      localStorage.setItem(STORAGE_KEY, "1")
    } catch (e) {}
  } catch (e) {
    errorMsg.value = e?.data?.statusMessage || "Algo deu errado. Tente novamente."
    state.value = "error"
  }
}

onMounted(() => {
  let seen = null
  try {
    seen = localStorage.getItem(STORAGE_KEY)
  } catch (e) {}
  if (!seen) {
    setTimeout(() => {
      visible.value = true
      document.body.style.overflow = "hidden"
    }, 1200)
  }
})
</script>

<template>
  <Transition name="modal-slide">
    <div v-if="visible" class="modal-overlay">
      <button class="close-btn" aria-label="Fechar" @click="close">✕</button>

      <div class="modal-content">
        <span class="kicker text-white" style="opacity: .8; color: #fff">Newsletter</span>
        <h2 class="mt-4" style="font-size: clamp(28px, 5vw, 48px); text-wrap: balance">
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

        <button class="mt-6 text-white/60 underline" style="font-size: 14px; background: none; border: none; cursor: pointer" @click="close">
          Agora não
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  overflow-y: auto;
}

.modal-content {
  max-width: 620px;
  width: 100%;
  color: #fff;
}

.close-btn {
  position: absolute;
  top: 24px;
  right: 24px;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: #fff;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
}

.modal-slide-enter-active,
.modal-slide-leave-active {
  transition: transform 0.4s ease, opacity 0.4s ease;
}
.modal-slide-enter-from,
.modal-slide-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
