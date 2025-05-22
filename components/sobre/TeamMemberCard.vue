<template>
  <div class="bg-gray-200 shadow-md rounded-lg p-6 flex flex-col justify-start items-start team-member">
    <img :src="image" :alt="name" class="w-full h-48 object-cover rounded-lg" />
    <div class="p-4">
      <h3 class="text-xl font-semibold mb-2">{{ name }}</h3>
      <p class="text-gray-700">{{ role }}</p>
      <p class="text-gray-700">{{ location }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  name: String,
  role: String,
  location: String,
  image: String
});
</script>