<script setup>
const props = defineProps({
  n: String,
  title: String,
  color: { type: String, required: true },
  ink: { type: String, default: "#fff" },
})
</script>

<template>
  <div
    class="relative flex flex-col justify-between overflow-hidden"
    :style="{ background: color, color: ink, borderRadius: 'var(--r-card)', padding: '30px', minHeight: '230px' }"
  >
    <div class="font-display" style="font-size: 16px; opacity: .8">{{ n }}</div>
    <div>
      <h3 class="mb-3" style="font-size: 32px">{{ title }}</h3>
      <p style="font-size: 15.5px; line-height: 1.55"><slot /></p>
    </div>
  </div>
</template>
