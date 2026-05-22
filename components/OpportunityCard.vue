<script setup>
const props = defineProps({
  opportunity: {
    type: Object,
    required: true,
  },
  getKeywordColor: {
    type: Function,
    required: true,
  },
})
</script>

<template>
  <div class="bg-surface rounded-xl overflow-hidden border border-text/10 hover:shadow-lg transition-shadow duration-300">
    <img
      :src="opportunity.image || 'https://placehold.co/400x200'"
      class="w-full h-48 object-cover"
      alt="Opportunity image"
    />
    <div class="p-6">
      <div class="flex flex-wrap gap-2 mb-4 text-xs">
        <span
          v-for="(keyword, keywordIndex) in opportunity.keywords"
          :key="keywordIndex"
          :style="{
            backgroundColor: getKeywordColor(keywordIndex),
            color: keywordIndex % 3 === 0 ? 'white' : '#0D0B1A',
          }"
          class="px-3 py-1 rounded-full font-body"
          style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis"
        >
          {{ keyword }}
        </span>
      </div>
      <h3 class="text-lg font-display font-bold text-text mb-2">
        {{ opportunity.Nome }}
      </h3>
      <p class="text-sm text-text/70 font-body mb-4">
        {{ opportunity.description }}
      </p>
      <NuxtLink
        :to="`/oportunidade/${opportunity.id}`"
        class="text-primary font-semibold hover:text-primary/80 font-body"
      >
        Veja mais
      </NuxtLink>
    </div>
  </div>
</template>
