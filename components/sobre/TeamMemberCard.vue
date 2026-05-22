<template>
  <div class="bg-surface shadow-md rounded-lg p-6 flex flex-col justify-start items-start team-member hover:border-accent-cyan border border-transparent transition-colors duration-300">
    <img :src="image" :alt="name" class="w-full h-48 object-cover rounded-lg" />
    <div class="p-4">
      <h3 class="font-display text-xl font-bold mb-2 text-text">{{ name }}</h3>
      <p class="font-body text-text/70">{{ role }}</p>
      <p class="font-body text-text/70">{{ location }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  name: String,
  role: String,
  location: String,
  image: String,
})
</script>
