<template>
  <div :class="bgClass + ' text-white p-6 rounded-lg w-full md:w-80 h-64 flex flex-col justify-start items-start'" data-aos="fade-up" :data-aos-delay="aosDelay">
    <p class="font-display text-2xl font-bold">{{ title }}</p>
    <p class="font-body text-base text-left">
      <slot />
    </p>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  bgClass: String,
  aosDelay: { type: [Number, String], default: 0 }
})
</script>
