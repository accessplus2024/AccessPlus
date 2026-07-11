<script setup>
const props = defineProps({
  contentTitle: { type: String, required: true },
  contentText: { type: String, required: true },
})
</script>

<template>
  <div class="lg:col-span-7">
    <div class="bg-card border border-ink/8" style="border-radius: var(--r-card); padding: 36px; min-height: 420px">
      <h3 class="mb-6" style="font-size: clamp(24px, 3vw, 32px)">{{ contentTitle }}</h3>
      <div
        class="font-body text-ink/80 leading-relaxed whitespace-pre-line"
        style="font-size: 16px; max-width: 70ch"
      >
        {{ contentText || "Nenhuma informação disponível." }}
      </div>
    </div>
  </div>
</template>
