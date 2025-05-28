<script setup>
import { onMounted } from "vue";
import { gsap } from "gsap";
import AOS from "aos";
import "aos/dist/aos.css";

useHead({
  link: [
    {
      rel: "icon",
      type: "image/png",
      href: "/images/estrelinhas.png",
    },
  ],
});

useHead({
  title: "Home",
  meta: [
    { charset: "UTF-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1.0" },
    { hid: "description", name: "description", content: "" },
  ],
  htmlAttrs: {
    lang: "pt-br",
  },
});

onMounted(() => {
  // Initialize AOS
  AOS.init({
    duration: 1000,
    once: true,
  });
});
</script>

<template>
  <HomeHeader />
  <HomeFeaturesSection />
  <HomeOpportunitiesSection />
  <HomeNewsSection />
  <HomeAboutSection />
  <HomeContactSection />
  <HomeAwardsSection />
</template>
