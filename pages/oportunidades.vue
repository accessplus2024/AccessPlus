<script setup>
import { ref, computed, onMounted } from "vue";
import Navbar from "./components/Navbar.vue";
import { Filter, Search } from "@iconoir/vue";

useHead({
  title: "Oportunidades",
  meta: [
    { charset: "UTF-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1.0" },
    { name: "description", content: "" },
  ],
  htmlAttrs: { lang: "pt-br" },
  link: [
    {
      rel: "icon",
      type: "image/png",
      href: "/images/estrelinhas.png",
    },
  ],
});

// Variables for search and filters
const searchTerm = ref("");
const showMobileFilters = ref(false);
const selectedTypeFilters = ref(new Set());
const selectedStatusFilters = ref(new Set());
const selectedLevelFilters = ref(new Set());
const selectedAudienceFilters = ref(new Set());
const selectedTuitionFilters = ref(new Set());
const selectedFieldFilters = ref(new Set()); // Novo filtro para fields (Interesse)
const currentPage = ref(1);
const itemsPerPage = 12;

// Change from keywordFilters to typeFilters
const typeFilters = ref([
  "olympiad",
  "mun",
  "academic",
  "exchange",
  "scholarship",
  "competition",
  "writing",
  "tutoring",
]);

// Add type display mapping
const typeDisplayNames = {
  olympiad: "Olimpíadas Científicas",
  mun: "MUNs",
  academic: "Programas Acadêmicos",
  exchange: "Programas de Intercâmbio",
  scholarship: "Bolsas de Estudo",
  competition: "Competições",
  writing: "Competições de Escrita",
  tutoring: "Mentorias",
};

// Filtros de Interesse (Fields)
const fieldFilters = ref([
  "Meio Ambiente",
  "Humanas",
  "STEM",
  "Linguagens",
  "Artes",
]);

// Update openFilters to match database values
const openFilters = ref(["yes", "no"]);

// Add status display mapping
const statusDisplayNames = {
  yes: "Sim",
  no: "Não",
};

const levelFilters = ref(["Fundamental", "Ensino Médio", "Gap"]);
const audienceFilters = ref([
  "Negros",
  "LGBT",
  "Baixa Renda",
  "Indígenas",
  "Deficientes",
  "Meninas",
  "Escola Pública",
]);
const tuitionFilters = ref(["Bolsa", "Gratuito", "Totalmente Financiado"]);

const tempOpps = ref([]);

// Replace the single toggle method with a new one that handles filter types
const toggleFilter = (filter, filterType) => {
  let filterSet;
  switch (filterType) {
    case "type":
      filterSet = selectedTypeFilters;
      break;
    case "status":
      filterSet = selectedStatusFilters;
      break;
    case "level":
      filterSet = selectedLevelFilters;
      break;
    case "audience":
      filterSet = selectedAudienceFilters;
      break;
    case "tuition":
      // Filtros de custo são exclusivos
      selectedTuitionFilters.value.clear();
      selectedTuitionFilters.value.add(filter);
      return;
    case "field":
      filterSet = selectedFieldFilters;
      break;
    default:
      return;
  }
  if (filterSet.value.has(filter)) {
    filterSet.value.delete(filter);
  } else {
    filterSet.value.add(filter);
  }
};

// Update filtered opportunities to handle multiple filter types correctly
const filteredOpportunities = computed(() => {
  let filtered = tempOpps.value;

  // Apply type filters
  if (selectedTypeFilters.value.size > 0) {
    filtered = filtered.filter((opportunity) =>
      selectedTypeFilters.value.has(opportunity.type)
    );
  }

  // Apply status filters
  if (selectedStatusFilters.value.size > 0) {
    filtered = filtered.filter((opportunity) =>
      selectedStatusFilters.value.has(opportunity.status)
    );
  }

  // Apply level filters
  if (selectedLevelFilters.value.size > 0) {
    filtered = filtered.filter((opportunity) =>
      selectedLevelFilters.value.has(opportunity.level)
    );
  }

  // Apply audience filters (accumulative logic)
  if (selectedAudienceFilters.value.size > 0) {
    filtered = filtered.filter((opportunity) => {
      return Array.from(selectedAudienceFilters.value).some((filter) =>
        opportunity.audience.includes(filter)
      );
    });
  }

  // Apply tuition filters (exclusive logic)
  if (selectedTuitionFilters.value.size > 0) {
    filtered = filtered.filter((opportunity) =>
      selectedTuitionFilters.value.has(opportunity.tuition)
    );
  }

  // Apply field filters (accumulative logic)
  if (selectedFieldFilters.value.size > 0) {
    filtered = filtered.filter((opportunity) => {
      return Array.from(selectedFieldFilters.value).some((filter) =>
        opportunity.fields.includes(filter)
      );
    });
  }

  // Apply search term
  if (searchTerm.value) {
    const searchTermLower = searchTerm.value.toLowerCase();
    filtered = filtered.filter((o) =>
      [o.Nome, o.description, ...(o.keywords || [])]
        .join(" ")
        .toLowerCase()
        .includes(searchTermLower)
    );
  }

  return filtered;
});

// Paginate opportunities
const paginatedOpportunities = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredOpportunities.value.slice(start, end);
});

// Calcular o intervalo de páginas a serem exibidas (máximo de 10 páginas)
const displayedPages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const range = 10; // Número máximo de páginas exibidas
  let start = Math.max(1, current - Math.floor(range / 2));
  let end = Math.min(total, start + range - 1);

  // Ajustar o início se o fim ultrapassar o total de páginas
  if (end === total) {
    start = Math.max(1, end - range + 1);
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
});

// Total pages computed property
const totalPages = computed(() => {
  return Math.ceil(filteredOpportunities.value.length / itemsPerPage);
});

// Fetch opportunities data
const { data, loading, error, fetchSheetData } = useSteinData();

onMounted(async () => {
  try {
    await fetchSheetData("All");
    tempOpps.value = data.value.map((opp, index) => ({
      id: String(index + 1), // assign id if missing
      ...opp,
      keywords: opp.keywords
        ? opp.keywords.split(",").map((k) => k.trim().toLowerCase())
        : [],
      audience: opp.audience
        ? opp.audience.split(",").map((a) => a.trim())
        : [], // Convert audience to an array
      fields: opp.fields ? opp.fields.split(",").map((f) => f.trim()) : [], // Convert fields to an array
    }));
  } catch (error) {
    console.error(error);
  }
});

// Method to return the keyword color
const getKeywordColor = (index) => {
  const colors = ["#3D30A2", "#F16767", "#A459D1"];
  return colors[index % colors.length];
};
</script>

<template>
  <header
    class="relative bg-gradient-to-r from-purple-600 to-pink-600 pb-16 rounded-b-lg bg-cover bg-center"
    :style="{ backgroundImage: 'url(/images/voluntariado.svg)' }"
  >
    <div class="absolute inset-0 bg-[#C47FEF6B] z-0"></div>

    <div
      class="container mx-auto px-6 flex flex-col items-center relative z-10"
    >
      <Navbar transparent="true" />
      <div class="text-left w-full max-w-4xl mt-12">
        <h1
          class="text-3xl sm:text-4xl lg:text-5xl mb-4 leading-none md:text-left lg:text-left sm:text-center"
        >
          <p class="font-bold">Todas as</p>
          <span class="block font-semibold">Oportunidades</span>
        </h1>
      </div>
    </div>
  </header>

  <main class="container mx-auto py-8 px-4 sm:px-8 md:px-16">
    <!-- Search and Filter Section -->
    <div class="flex flex-col md:flex-row items-center gap-6 mb-8">
      <div
        class="w-full flex flex-col sm:flex-row gap-4 items-center sm:items-start"
      >
        <button
          @click="showMobileFilters = true"
          class="relative w-full md:hidden flex justify-center items-center bg-[#EAEAEA] text-[#898989] px-4 py-2 rounded-lg hover:bg-[#DADADA] transition-colors"
        >
          <span class="flex items-center gap-2">
            Filtrar
            <Filter class="w-6 h-6" />
          </span>
        </button>

        <div class="relative w-full sm:w-auto flex-grow">
          <input
            type="text"
            v-model="searchTerm"
            placeholder="Buscar"
            class="w-full text-black bg-[#F0F0F0] font-light p-4 rounded-lg border border-gray-300 pr-12 focus:outline-none focus:border-gray-400 transition-colors"
          />
          <button
            @click="console.log('Search:', searchTerm)"
            class="absolute top-1/2 right-4 transform -translate-y-1/2 text-gray-500 hover:text-black transition-all duration-500"
          >
            <Search
              class="w-6 h-6 hover:w-8 hover:h-8 transition-all duration-500"
            />
          </button>
        </div>
      </div>
    </div>

    <!-- Content Section -->
    <div class="flex flex-col md:flex-row gap-6">
      <!-- Desktop Filters -->
      <aside
        class="hidden md:block w-1/4 bg-gray-100 text-black p-6 rounded-lg h-fit sticky top-4"
        style="min-width: 300px"
      >
        <h2 class="text-xl font-semibold text-black mb-3">Filtros</h2>

        <div
          v-for="(filters, title, index) in {
            Tipo: typeFilters,
            'Inscrições abertas': openFilters,
            Nível: levelFilters,
            'Público Alvo': audienceFilters,
            Custo: tuitionFilters,
            Interesse: fieldFilters,
          }"
          :key="index"
          class="mb-6"
        >
          <template v-if="title !== 'Palavras-chave'">
            <hr class="border-t border-[#CCCCCC] mb-4" />
          </template>
          <h3 class="text-lg font-semibold mb-2 text-[#1D1128]">{{ title }}</h3>
          <div class="space-y-2">
            <label
              v-for="filter in filters"
              :key="filter"
              class="flex items-center cursor-pointer"
            >
              <input
                type="checkbox"
                :checked="
                  {
                    Tipo: selectedTypeFilters,
                    'Inscrições abertas': selectedStatusFilters,
                    Nível: selectedLevelFilters,
                    'Público Alvo': selectedAudienceFilters,
                    Custo: selectedTuitionFilters,
                    Interesse: selectedFieldFilters,
                  }[title].has(filter)
                "
                @change="
                  toggleFilter(
                    filter,
                    {
                      Tipo: 'type',
                      'Inscrições abertas': 'status',
                      Nível: 'level',
                      'Público Alvo': 'audience',
                      Custo: 'tuition',
                      Interesse: 'field',
                    }[title]
                  )
                "
                class="form-checkbox h-4 w-4 text-purple-600 mr-2"
              />
              <span class="text-gray-700">{{
                typeDisplayNames[filter] || statusDisplayNames[filter] || filter
              }}</span>
            </label>
          </div>
        </div>
      </aside>

      <!-- Mobile Filters -->
      <div
        v-if="showMobileFilters"
        class="fixed inset-0 z-50 overflow-y-auto md:hidden"
      >
        <div
          class="flex items-end justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0"
        >
          <div
            class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
            @click="showMobileFilters = false"
          ></div>
          <div
            class="relative inline-block w-full max-w-md p-6 my-8 overflow-y-auto text-left align-middle transform bg-white shadow-xl rounded-2xl"
            style="max-height: 80vh; overflow-y: auto"
          >
            <button
              @click="showMobileFilters = false"
              class="absolute top-4 right-4 text-gray-400 hover:text-gray-500 transition duration-200"
            >
              <span class="sr-only">Close</span>
              <svg
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div
              v-for="(filters, title, index) in {
                Tipo: typeFilters,
                'Inscrições abertas': openFilters,
                Nível: levelFilters,
                'Público Alvo': audienceFilters,
                Custo: tuitionFilters,
                Interesse: fieldFilters,
              }"
              :key="index"
              class="mb-2"
            >
              <template v-if="title !== 'Palavras-chave'">
                <hr class="border-t-2 border-[#E5E5E5] mb-4 mt-4" />
              </template>
              <h3 class="text-lg font-semibold mb-3 text-[#1D1128]">
                {{ title }}
              </h3>
              <div class="space-y-2">
                <label
                  v-for="filter in filters"
                  :key="filter"
                  class="flex items-center cursor-pointer text-sm hover:bg-gray-50 transition p-1 rounded-md"
                >
                  <input
                    type="checkbox"
                    :checked="
                      {
                        Tipo: selectedTypeFilters,
                        'Inscrições abertas': selectedStatusFilters,
                        Nível: selectedLevelFilters,
                        'Público Alvo': selectedAudienceFilters,
                        Custo: selectedTuitionFilters,
                        Interesse: selectedFieldFilters,
                      }[title].has(filter)
                    "
                    @change="
                      toggleFilter(
                        filter,
                        {
                          Tipo: 'type',
                          'Inscrições abertas': 'status',
                          Nível: 'level',
                          'Público Alvo': 'audience',
                          Custo: 'tuition',
                          Interesse: 'field',
                        }[title]
                      )
                    "
                    class="form-checkbox h-4 w-4 text-purple-600 mr-2"
                  />
                  <span class="text-sm text-gray-700">{{
                    typeDisplayNames[filter] ||
                    statusDisplayNames[filter] ||
                    filter
                  }}</span>
                </label>
              </div>
            </div>

            <div class="mt-6">
              <button
                @click="showMobileFilters = false"
                class="w-full bg-[#FFB84C] text-white px-6 py-3 rounded-lg hover:bg-[#FF9F00] transition duration-200"
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Opportunities Grid -->
      <div class="w-full md:w-3/4">
        <Loading :watch="!data" />

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="opportunity in paginatedOpportunities"
            :key="opportunity.id"
            class="bg-white rounded-xl overflow-hidden border border-gray-200"
          >
            <img
              :src="opportunity.image || 'https://placehold.co/400x200'"
              class="w-full h-48 object-cover"
              alt="Opportunity image"
            />
            <div class="p-6">
              <div class="flex flex-wrap gap-2 mb-4 text-xs">
                <span
                  v-for="(keyword, keywordIndex) in opportunity.keywords"
                  :key="keywordIndex"
                  :style="{
                    backgroundColor: getKeywordColor(keywordIndex),
                    color: 'white',
                  }"
                  class="text-white px-3 py-1 rounded-full"
                  style="
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                  "
                >
                  {{ keyword }}
                </span>
              </div>
              <h3 class="text-lg font-bold text-gray-800 mb-2">
                {{ opportunity.Nome }}
              </h3>
              <p class="text-sm text-gray-600 mb-4">
                {{ opportunity.description }}
              </p>
              <!-- Changed link element to router-link -->
              <NuxtLink
                :to="`/oportunidade/${opportunity.id}`"
                class="text-purple-600 font-semibold hover:text-purple-700"
              >
                Veja mais
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div class="mt-8 flex flex-wrap justify-center gap-2">
          <button
            @click="currentPage--"
            :disabled="currentPage === 1"
            class="px-4 py-2 rounded-lg bg-purple-600 text-white disabled:bg-gray-300"
          >
            Anterior
          </button>
          <div class="flex flex-wrap items-center gap-2">
            <button
              v-for="page in displayedPages"
              :key="page"
              @click="currentPage = page"
              :class="{
                'bg-purple-600 text-white': currentPage === page,
                'bg-gray-200 text-gray-600': currentPage !== page,
              }"
              class="px-4 py-2 rounded-lg text-sm sm:text-base"
            >
              {{ page }}
            </button>
          </div>
          <button
            @click="currentPage++"
            :disabled="currentPage === totalPages"
            class="px-4 py-2 rounded-lg bg-purple-600 text-white disabled:bg-gray-300"
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  </main>
</template>
