<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useSteinData } from "@/composables/useSteinData"; // adjust import as needed

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
});

// Retrieve the opportunity id from the route.
const route = useRoute();
const opportunityId = route.params.id;
console.log("Loaded opportunityId:", opportunityId); // debug

// Initialize content refs.
const contentTitle = ref(`Detalhes da Oportunidade ${opportunityId}`);
const contentText = ref("Carregando os detalhes da oportunidade...");

// Fetch opportunity data based on id.
const { data, loading, error, fetchSheetData } = useSteinData();

onMounted(async () => {
  try {
    await fetchSheetData("Programas Acadêmicos");
    // Assuming data.value is an array of opportunities and each has an id property.
    const opp = data.value.find((o) => String(o.id) === String(opportunityId));
    if (opp) {
      contentTitle.value = opp.Nome || `Oportunidade ${opportunityId}`;
      contentText.value = opp.description || "Sem descrição disponível.";
    } else {
      contentTitle.value = "Oportunidade não encontrada";
      contentText.value = "";
    }
  } catch (e) {
    console.error(e);
    contentTitle.value = "Erro ao carregar oportunidade";
    contentText.value = "";
  }
});

function changeContent(title, text) {
  contentTitle.value = title;
  contentText.value = text;
}
</script>

<template>
  <!-- Navbar -->
  <Navbar />

  <!-- Main Content -->
  <div class="max-w-6xl mx-auto px-8 py-12">
    <!-- Title Section -->
    <div class="mb-8">
      <h2 class="text-[18px] font-medium text-gray-800">CATEGORIA</h2>
      <h1 class="text-[48px] font-bold text-gray-800">Nome</h1>
    </div>

    <!-- Main Grid -->
    <div class="grid grid-cols-12 gap-6">
      <!-- Left Content -->
      <div class="col-span-7">
        <img
          src="https://placehold.co/625x320"
          alt="Placeholder image with a gray background and rounded corners"
          class="w-full rounded-lg"
        />
      </div>

      <!-- Right Content -->
      <div class="col-span-5 space-y-4">
        <!-- Tags -->
        <div class="flex space-x-4">
          <span
            class="bg-red-400 text-white px-7 py-2 rounded-[7px] text-sm font-medium"
            >Deadline</span
          >
          <span
            class="bg-purple-400 text-white px-7 py-2 rounded-[7px] text-sm font-medium"
            >Interesse</span
          >
          <span
            class="bg-indigo-600 text-white px-7 py-2 rounded-[7px] text-sm font-medium"
            >Nível</span
          >
        </div>

        <!-- Summary Section -->
        <div class="bg-gray-100 p-4 rounded-lg">
          <h3 class="font-semibold text-lg text-gray-800">
            Resumo sobre a Nome
          </h3>
          <p class="text-sm text-gray-600 mt-2">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam
          </p>
          <a href="#" class="text-indigo-500 text-sm font-medium mt-4 block"
            >Link do Site Oficial</a
          >
        </div>

        <!-- Keywords Section -->
        <div class="bg-gray-100 p-4 rounded-lg">
          <h3 class="font-semibold text-lg text-gray-800">Palavras-chave</h3>
          <p class="text-sm text-gray-600 mt-2">
            Lorem ipsum &nbsp;&nbsp; Lorem ipsum &nbsp;&nbsp; Lorem ipsum
          </p>
        </div>
      </div>
    </div>

    <!-- Bottom Section -->
    <div class="grid grid-cols-12 gap-6 mt-12">
      <!-- Left Column -->
      <div class="col-span-5 space-y-4">
        <button
          class="bg-gray-200 w-full py-3 rounded-lg font-semibold text-[#140E3F] text-center px-4"
          @click="
            changeContent(
              'Elegibilidade e Guia de Aplicação',
              'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
            )
          "
        >
          Elegibilidade e Guia de Aplicação
        </button>
        <button
          class="bg-gray-200 w-full py-3 rounded-lg font-semibold text-[#140E3F] text-center px-4"
          @click="
            changeContent(
              'Sobre o Processo',
              'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'
            )
          "
        >
          Sobre o Processo
        </button>
        <button
          class="bg-gray-200 w-full py-3 rounded-lg font-semibold text-[#140E3F] text-center px-4"
          @click="
            changeContent(
              'Dicas de Premiados',
              'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.'
            )
          "
        >
          Dicas de Premiados
        </button>
        <button
          class="bg-gray-200 w-full py-3 rounded-lg font-semibold text-[#140E3F] text-center px-4"
          @click="
            changeContent(
              'Prêmios',
              'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
            )
          "
        >
          Prêmios
        </button>
      </div>

      <!-- Right Column -->
      <div class="col-span-7">
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
