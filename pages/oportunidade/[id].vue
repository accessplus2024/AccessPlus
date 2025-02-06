<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";

useHead({
  title: "Oportunidades",
  meta: [
    { charset: "UTF-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1.0" },
    { hid: "description", name: "description", content: "" },
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
});

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

// Fetch opportunity data based on id.
const { data, loading, error, fetchRow } = useOpportunity();
const opp = ref(null);

// Content refs
const contentTitle = ref("");
const contentText = ref("");

// Function to update content
function changeContent(title, text) {
  contentTitle.value = title;
  contentText.value = text;
}

onMounted(async () => {
  try {
    await fetchRow(opportunityId);
    opp.value = data.value[0];
    console.log(opp.value);

    // Set default content after data is loaded
    changeContent(
      "Elegibilidade e Guia de Aplicação",
      opp.value.guide || "Nenhuma informação disponível."
    );
  } catch (e) {
    console.error(e);
  }
});
</script>

<template>
  <!-- Navbar -->
  <Navbar />

  <!-- Loading state -->
  <Loading :watch="!data" />

  <!-- Main Content -->
  <div v-if="opp" class="max-w-6xl mx-auto px-4 sm:px-8 py-12">
    <!-- Title Section -->
    <div class="mb-8">
      <h2 class="text-[16px] sm:text-[18px] font-medium text-gray-800">
        {{ typeDisplayNames[opp.type] }}
      </h2>
      <h1 class="text-[32px] sm:text-[48px] font-bold text-gray-800">
        {{ opp.Nome }}
      </h1>
    </div>

    <!-- Main Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-12 gap-6">
      <!-- Left Content -->
      <div class="sm:col-span-7">
        <img
          :src="opp.image || 'https://placehold.co/625x320'"
          alt="Placeholder image with a gray background and rounded corners"
          class="w-full rounded-lg"
        />
      </div>

      <!-- Right Content -->
      <!-- Right Content -->
      <div class="sm:col-span-5 space-y-4">
        <!-- Tags -->
        <div class="flex flex-col gap-2 w-full">
          <span
            class="bg-red-400 text-white px-4 sm:px-7 py-2 rounded-[7px] text-sm font-medium w-full text-center"
          >
            {{ opp.deadline }}
          </span>
          <span
            class="bg-purple-400 text-white px-4 sm:px-7 py-2 rounded-[7px] text-sm font-medium w-full text-center"
          >
            {{ opp.fields }}
          </span>
          <span
            class="bg-indigo-600 text-white px-4 sm:px-7 py-2 rounded-[7px] text-sm font-medium w-full text-center"
          >
            {{ opp.level }}
          </span>
        </div>

        <!-- Summary Section -->
        <div class="bg-gray-100 p-4 rounded-lg">
          <h3 class="font-semibold text-lg text-gray-800">
            Resumo sobre a {{ opp.Nome }}
          </h3>
          <p class="text-sm text-gray-600 mt-2">
            {{ opp.about }}
          </p>
          <a
            :href="opp.site"
            target="_blank"
            class="text-indigo-500 text-sm font-medium mt-4 block"
            >Link da oportunidade</a
          >
        </div>

        <!-- Keywords Section -->
        <div class="bg-gray-100 p-4 rounded-lg">
          <h3 class="font-semibold text-lg text-gray-800">Palavras-chave</h3>
          <p class="text-sm text-gray-600 mt-2">
            {{
              Array.isArray(opp.keywords)
                ? opp.keywords.join(" • ")
                : opp.keywords.replace(/,/g, " • ")
            }}
          </p>
        </div>
      </div>
    </div>
    <!-- Bottom Section -->
    <div class="grid grid-cols-1 sm:grid-cols-12 gap-6 mt-12">
      <!-- Left Column -->
      <div class="sm:col-span-5 space-y-4">
        <button
          class="bg-gray-200 w-full py-3 rounded-lg font-semibold text-[#140E3F] text-center px-4"
          @click="changeContent('Elegibilidade e Guia de Aplicação', opp.guide)"
        >
          Elegibilidade e Guia de Aplicação
        </button>
        <button
          class="bg-gray-200 w-full py-3 rounded-lg font-semibold text-[#140E3F] text-center px-4"
          @click="changeContent('Sobre o Processo', opp.regInfo)"
        >
          Sobre o Processo
        </button>
        <button
          class="bg-gray-200 w-full py-3 rounded-lg font-semibold text-[#140E3F] text-center px-4"
          @click="changeContent('Dicas de contemplados', opp.appTips)"
        >
          Dicas de contemplados
        </button>
        <button
          class="bg-gray-200 w-full py-3 rounded-lg font-semibold text-[#140E3F] text-center px-4"
          @click="changeContent('Informações adicionais', opp.addInfo)"
        >
          Informações adicionais
        </button>
      </div>

      <!-- Right Column -->
      <div class="sm:col-span-7">
        <div id="content-section" class="bg-gray-100 p-6 rounded-lg">
          <h3 id="content-title" class="font-semibold text-lg text-gray-800">
            {{ contentTitle }}
          </h3>
          <p id="content-text" class="text-sm text-gray-600 mt-2">
            {{ contentText }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
