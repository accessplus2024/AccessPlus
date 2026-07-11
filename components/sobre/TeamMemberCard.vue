<script setup>
defineProps({
  name: String,
  role: String,
  location: String,
  image: String,
})
</script>

<template>
  <div
    class="group bg-card border border-ink/8 overflow-hidden transition-all duration-300 ease-brand hover:-translate-y-1.5 hover:shadow-lg"
    style="border-radius: var(--r-card)"
  >
    <div class="overflow-hidden" style="aspect-ratio: 4 / 3">
      <img
        :src="image"
        :alt="name"
        class="w-full h-full object-cover transition-transform duration-500 ease-brand group-hover:scale-105"
      />
    </div>
    <div class="p-5">
      <h3 class="font-body font-bold text-ink" style="font-size: 18px">{{ name }}</h3>
      <p class="text-primary font-medium mt-0.5" style="font-size: 14px">{{ role }}</p>
      <p class="text-ink/55 mt-0.5" style="font-size: 13.5px">{{ location }}</p>
    </div>
  </div>
</template>
