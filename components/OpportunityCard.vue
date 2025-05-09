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
});
</script>

<template>
  <div class="bg-white rounded-xl overflow-hidden border border-gray-200">
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
            color: 'white',
          }"
          class="text-white px-3 py-1 rounded-full"
          style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis"
        >
          {{ keyword }}
        </span>
      </div>
      <h3 class="text-lg font-bold text-gray-800 mb-2">
        {{ opportunity.Nome }}
      </h3>
      <p class="text-sm text-gray-600 mb-4">
        {{ opportunity.description }}
      </p>
      <NuxtLink
        :to="`/oportunidade/${opportunity.id}`"
        class="text-purple-600 font-semibold hover:text-purple-700"
      >
        Veja mais
      </NuxtLink>
    </div>
  </div>
</template>
