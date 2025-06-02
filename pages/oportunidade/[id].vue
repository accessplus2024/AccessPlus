<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import { gsap } from "gsap";
import AOS from "aos";
import "aos/dist/aos.css";

// Import components
import HeroSection from "~/components/opportunity/HeroSection.vue";
import StatsBanner from "~/components/opportunity/StatsBanner.vue";
import ImageSection from "~/components/opportunity/ImageSection.vue";
import InfoCards from "~/components/opportunity/InfoCards.vue";
import TabNavigation from "~/components/opportunity/TabNavigation.vue";
import ContentDisplay from "~/components/opportunity/ContentDisplay.vue";

// Fetch opportunity data based on id.
const { data, loading, error, fetchRow } = useOpportunity();
const opp = ref(null);

// Create a reactive title that will update when the opportunity data is loaded
const pageTitle = computed(() => {
  return opp.value ? opp.value.name : "Oportunidades";
});

useHead(() => ({
  title: pageTitle.value,
  meta: [
    { charset: "UTF-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1.0" },
    {
      hid: "description",
      name: "description",
      content: opp.value ? `Detalhes sobre ${opp.value.name}` : "",
    },
  ],
  htmlAttrs: {
    lang: "pt-br",
  },
  link: [
    {
      rel: "icon",
      type: "image/png",
      href: "/images/estrelinhas.png",
    },
  ],
}));

// Retrieve the opportunity id from the route.
const route = useRoute();
const opportunityId = route.params.id;

const typeDisplayNames = {
  olympiad: "Olimpíadas Científicas",
  mun: "MUNs",
  academic: "Programas Acadêmicos",
  exchange: "Programas de Intercâmbios",
  scholarship: "Bolsas de Estudo",
  competition: "Competições",
  writing: "Competições de Escrita",
  tutoring: "Mentorias",
};

// Content refs
const contentTitle = ref("");
const contentText = ref("");
const activeTab = ref("guide");

// Function to update content
function changeContent(title, text, tabKey) {
  contentTitle.value = title;
  contentText.value = text;
  activeTab.value = tabKey;
}

onMounted(async () => {
  try {
    await fetchRow(opportunityId);
    opp.value = data.value[0];
    console.log(opp.value);

    // Set default content after data is loaded
    changeContent(
      "Elegibilidade e Guia de Aplicação",
      opp.value.guide || "Nenhuma informação disponível.",
      "guide"
    );

    // Initialize AOS
    AOS.init({
      duration: 800,
      once: true,
    });

    // GSAP animations
    gsap.from(".hero-title", {
      duration: 1.2,
      y: 50,
      opacity: 0,
      ease: "power3.out",
      delay: 0.3,
    });

    gsap.from(".hero-image", {
      duration: 1.2,
      scale: 0.9,
      opacity: 0,
      ease: "power3.out",
      delay: 0.5,
    });

    gsap.from(".info-card", {
      duration: 1,
      y: 30,
      opacity: 0,
      stagger: 0.2,
      ease: "power3.out",
      delay: 0.8,
    });
  } catch (e) {
    console.error(e);
  }
});
</script>

<template>
  <!-- Loading state -->
  <Loading :watch="!data" />
  <!-- Main Content -->
  <div v-if="opp" class="relative">
    <!-- Hero Section -->
    <HeroSection
      :opportunity="opp"
      :type-display-name="typeDisplayNames[opp.type]"
    />

    <!-- Stats Banner -->
    <div class="max-w-7xl mx-auto px-4 sm:px-8 py-20">
      <StatsBanner :opportunity="opp" />

      <!-- Main Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-20">
        <!-- Image Section -->
        <div class="lg:col-span-7" data-aos="fade-right">
          <ImageSection :opportunity="opp" />
        </div>

        <!-- Info Cards -->
        <div class="lg:col-span-5 space-y-6" data-aos="fade-left">
          <InfoCards :opportunity="opp" />
        </div>
      </div>

      <!-- Details Section -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8" data-aos="fade-up">
        <!-- Tab Navigation -->
        <TabNavigation
          :opportunity="opp"
          :active-tab="activeTab"
          @changeContent="changeContent"
        />
        <!-- Content Display -->
        <ContentDisplay
          :content-title="contentTitle"
          :content-text="contentText"
        />
      </div>
    </div>
  </div>
</template>
