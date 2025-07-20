<script setup>
import { Filter } from "@iconoir/vue";

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
      tuition: opp.tuition ? opp.tuition.trim() : "", //fix tuition filter
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
  <OpportunitiesHeader />

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

        <SearchInput v-model:search-term="searchTerm" />
      </div>
    </div>

    <!-- Content Section -->
    <div class="flex flex-col md:flex-row gap-6">
      <!-- Desktop Filters -->
      <FiltersSidebar
        :type-filters="typeFilters"
        :open-filters="openFilters"
        :level-filters="levelFilters"
        :audience-filters="audienceFilters"
        :tuition-filters="tuitionFilters"
        :field-filters="fieldFilters"
        :selected-type-filters="selectedTypeFilters"
        :selected-status-filters="selectedStatusFilters"
        :selected-level-filters="selectedLevelFilters"
        :selected-audience-filters="selectedAudienceFilters"
        :selected-tuition-filters="selectedTuitionFilters"
        :selected-field-filters="selectedFieldFilters"
        :type-display-names="typeDisplayNames"
        :status-display-names="statusDisplayNames"
        @toggle-filter="toggleFilter"
      />

      <!-- Mobile Filters -->
      <MobileFilters
        :show="showMobileFilters"
        :type-filters="typeFilters"
        :open-filters="openFilters"
        :level-filters="levelFilters"
        :audience-filters="audienceFilters"
        :tuition-filters="tuitionFilters"
        :field-filters="fieldFilters"
        :selected-type-filters="selectedTypeFilters"
        :selected-status-filters="selectedStatusFilters"
        :selected-level-filters="selectedLevelFilters"
        :selected-audience-filters="selectedAudienceFilters"
        :selected-tuition-filters="selectedTuitionFilters"
        :selected-field-filters="selectedFieldFilters"
        :type-display-names="typeDisplayNames"
        :status-display-names="statusDisplayNames"
        @toggle-filter="toggleFilter"
        @close="showMobileFilters = false"
      />

      <!-- Opportunities Grid -->
      <div class="w-full md:w-3/4">
        <Loading :watch="!data" />

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <OpportunityCard
            v-for="opportunity in paginatedOpportunities"
            :key="opportunity.id"
            :opportunity="opportunity"
            :get-keyword-color="getKeywordColor"
          />
        </div>

        <!-- Pagination -->
        <Pagination
          :current-page="currentPage"
          :total-pages="totalPages"
          :displayed-pages="displayedPages"
          @update-page="currentPage = $event"
        />
      </div>
    </div>
  </main>
</template>
