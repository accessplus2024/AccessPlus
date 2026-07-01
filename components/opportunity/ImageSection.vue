<script setup>
const props = defineProps({
  opportunity: { type: Object, required: true },
})
const hasImage = computed(() => !!props.opportunity.image)
</script>

<template>
  <div class="bg-card border border-ink/8 overflow-hidden h-full" style="border-radius: var(--r-card)">
    <div class="relative w-full" style="aspect-ratio: 16 / 10; background: var(--color-paper-2)">
      <img
        v-if="hasImage"
        :src="opportunity.image"
        :alt="opportunity.Nome"
        class="absolute inset-0 w-full h-full object-cover"
      />
    </div>
  </div>
</template>
