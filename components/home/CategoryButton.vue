<script setup>
defineProps({
  category: { type: String, required: true },
  icon: { type: String, required: true },
})
</script>

<template>
  <div class="bg-surface rounded-lg flex items-center justify-start p-3 md:p-6 border border-text/10 hover:border-primary transition-colors duration-200">
    <div class="flex items-center">
      <img :src="`./images/i-${icon}.svg`" alt="" class="w-8 h-8" />
    </div>
    <div class="w-px h-8 bg-text/20 mx-4"></div>
    <span class="font-body text-sm font-medium text-text">{{ category }}</span>
  </div>
</template>
