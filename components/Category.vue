<script setup>
defineProps({
  category: String,
  icon: String,
});
</script>

<template>
  <div
    class="bg-gray-100 rounded-lg flex items-center justify-start p-3 md:p-6">
    <img 
      :src="`/images/i-${icon}.svg`" 
      class="w-8 h-8 md:w-auto md:h-auto flex-shrink-0 mr-3"
    />
    <span
      class="text-black border-l border-stone-900 pl-3 min-h-[2.5rem] flex items-center break-words text-left text-sm md:text-base"
    >{{ category }}</span>
  </div>
</template>