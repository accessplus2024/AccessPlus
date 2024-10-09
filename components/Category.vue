<script setup>
defineProps({
  category: String,
  icon: String,
});
</script>

<template>
  <div class="bg-gray-100 rounded-lg p-6 flex items-center justify-center">
    <img :src="`/images/i-${icon}.svg`" />
    <span
      class="text-black border-l pl-3 ml-3 border-stone-900 h-10 flex justify-center items-center"
      >{{ category }}</span
    >
  </div>
</template>
