<template>
  <div :class="['flex space-x-4 justify-center', themeClass]">
    <a href="https://www.youtube.com/@AccessPlusOficial"
      ><Youtube class="hover:text-gray-900 transition duration-300"
    /></a>
    <a href="https://www.instagram.com/accessplusoficial/"
      ><Instagram class="hover:text-gray-900 transition duration-300"
    /></a>
    <a href="https://www.linkedin.com/company/accesspluseducation"
      ><Linkedin class="hover:text-gray-900 transition duration-300"
    /></a>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { Youtube, Instagram, Linkedin } from "@iconoir/vue";

const props = defineProps({
  theme: String,
});

const themeClass = computed(() => {
  return props.theme === "dark" ? "text-white" : "text-gray-700";
});
</script>
