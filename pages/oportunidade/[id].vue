<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import { categoryFor } from "~/utils/categories";

import HeroSection from "~/components/opportunity/HeroSection.vue";
import StatsBanner from "~/components/opportunity/StatsBanner.vue";
import InfoCards from "~/components/opportunity/InfoCards.vue";
import TabNavigation from "~/components/opportunity/TabNavigation.vue";
import ContentDisplay from "~/components/opportunity/ContentDisplay.vue";
import Comments from "~/components/opportunity/Comments.vue";
import AccessGate from "~/components/opportunity/AccessGate.vue";
import ApplicationTracker from "~/components/opportunity/ApplicationTracker.vue";
import { OpenNewWindow } from "@iconoir/vue";

const { data, loading, error, fetchRow } = useOpportunity();
const opp = ref(null);

const pageTitle = computed(() => (opp.value ? opp.value.title : "Oportunidade"));
const cat = computed(() => categoryFor(opp.value?.type));

useHead(() => ({
  title: pageTitle.value,
  meta: [
    { charset: "UTF-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1.0" },
    { name: "description", content: opp.value ? `Detalhes sobre ${opp.value.title}` : "" },
  ],
  htmlAttrs: { lang: "pt-br" },
  link: [{ rel: "icon", href: "/favicon.ico" }],
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
      opp.value?.eligibility || "Nenhuma informação disponível.",
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
      <ClientOnly>
        <AccessGate>
          <ApplicationTracker :opportunity="opp" />

          <a
            v-if="opp.link"
            :href="opp.link"
            target="_blank"
            rel="noopener"
            class="btn btn-ink mb-10"
          >
            Acessar oportunidade <OpenNewWindow class="w-[18px] h-[18px]" />
          </a>

          <StatsBanner :opportunity="opp" :category="cat" />

          <!-- Info -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-12 mb-12">
            <InfoCards :opportunity="opp" />
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

          <!-- Comentários da comunidade -->
          <Comments :opportunity-id="opportunityId" />
        </AccessGate>
        <template #fallback>
          <p class="text-ink/50" style="font-size: 14px">Carregando...</p>
        </template>
      </ClientOnly>
    </div>
  </div>
</template>
