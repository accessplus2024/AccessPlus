<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import { categoryFor } from "~/utils/categories";

import HeroSection from "~/components/opportunity/HeroSection.vue";
import StatsBanner from "~/components/opportunity/StatsBanner.vue";
import ImageSection from "~/components/opportunity/ImageSection.vue";
import InfoCards from "~/components/opportunity/InfoCards.vue";
import TabNavigation from "~/components/opportunity/TabNavigation.vue";
import ContentDisplay from "~/components/opportunity/ContentDisplay.vue";

const { data, loading, error, fetchRow } = useOpportunity();
const opp = ref(null);

const pageTitle = computed(() => (opp.value ? opp.value.Nome : "Oportunidade"));
const cat = computed(() => categoryFor(opp.value?.type));

useHead(() => ({
  title: pageTitle.value,
  meta: [
    { charset: "UTF-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1.0" },
    { name: "description", content: opp.value ? `Detalhes sobre ${opp.value.Nome}` : "" },
  ],
  htmlAttrs: { lang: "pt-br" },
  link: [{ rel: "icon", type: "image/png", href: "/images/estrelinhas.png" }],
}));

const route = useRoute();
const opportunityId = route.params.id;

const contentTitle = ref("");
const contentText = ref("");
const activeTab = ref("guide");

function changeContent(title, text, tabKey) {
  contentTitle.value = title;
  contentText.value = text;
  activeTab.value = tabKey;
}

onMounted(async () => {
  try {
    await fetchRow(opportunityId);
    opp.value = data.value[0];
    changeContent(
      "Elegibilidade e guia de aplicação",
      opp.value?.guide || "Nenhuma informação disponível.",
      "guide"
    );
  } catch (e) {
    console.error(e);
  }
});
</script>

<template>
  <Loading :watch="!data" />

  <div v-if="opp" class="relative">
    <HeroSection :opportunity="opp" :category="cat" />

    <div class="wrap" style="padding-top: 64px; padding-bottom: 40px">
      <StatsBanner :opportunity="opp" :category="cat" />

      <!-- Image + Info -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-12 mb-12">
        <div class="lg:col-span-7">
          <ImageSection :opportunity="opp" />
        </div>
        <div class="lg:col-span-5 space-y-5">
          <InfoCards :opportunity="opp" />
        </div>
      </div>

      <!-- Details -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <TabNavigation
          :opportunity="opp"
          :active-tab="activeTab"
          @changeContent="changeContent"
        />
        <ContentDisplay :content-title="contentTitle" :content-text="contentText" />
      </div>
    </div>
  </div>
</template>
