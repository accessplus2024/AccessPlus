<script setup>
const props = defineProps({
  items: { type: Array, required: true },
})
// Duplicate the row so the -50% translate loops seamlessly.
const row = computed(() => [...props.items, ...props.items])
</script>

<template>
  <div class="bg-ink text-paper overflow-hidden whitespace-nowrap py-[18px]">
    <div class="inline-flex" style="animation: scrollx 28s linear infinite">
      <span
        v-for="(t, i) in row"
        :key="i"
        class="inline-flex items-center gap-[22px] px-[22px] font-display"
        style="font-size: 26px; letter-spacing: -.01em"
      >
        {{ t }}
      </span>
    </div>
  </div>
</template>
