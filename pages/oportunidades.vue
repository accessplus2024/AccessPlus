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
  link: [{ rel: "icon", href: "/favicon.ico" }],
});

// Variables for search and filters
const searchTerm = ref("");
const showMobileFilters = ref(false);
const selectedTypeFilters = ref(new Set());
const selectedLevelFilters = ref(new Set());
const selectedAudienceFilters = ref(new Set());
const selectedTuitionFilters = ref(new Set());
const selectedFieldFilters = ref(new Set()); // Filtro de Interesse (Areas)
const selectedFormatFilters = ref(new Set()); // Remoto / Presencial / Híbrido
const selectedInscricoesFilters = ref(new Set()); // Aberta / Encerrada
const currentPage = ref(1);
const itemsPerPage = 12;

// Filtro de Tipo (categoria)
const typeFilters = ref([
  "Olimpíadas Científicas",
  "MUNs",
  "Programas de Intercâmbio",
  "Bolsas de Estudo",
  "Programas Acadêmicos",
  "Competições",
  "Competições de Escrita",
  "Mentorias",
  "Estágios",
]);

// Filtros de Interesse (Areas)
// Vocabulário FECHADO do banco, alinhado com scripts/reanotar-catalogo.js.
// O filtro compara por igualdade exata contra a coluna `areas`, então
// qualquer rótulo que não exista lá vira um chip morto (retorna zero).
// Antes desta correção o site oferecia 5 áreas e o banco tinha 9 — Tech (54
// linhas), Empreendedorismo (65), Política (49) e Ativismo (47) eram
// inalcançáveis pelo filtro.
const fieldFilters = ref([
  "STEM",
  "Tech",
  "Humanas",
  "Linguagens",
  "Artes",
  "Política",
  "Ativismo",
  "Meio Ambiente",
  "Empreendedorismo",
]);

// `level` no banco guarda "Gap", não "Gap Year" — o chip antigo dizia
// "Gap Year" e não casava com nenhuma das 132 linhas que têm o valor.
// O nome bonito vive em `displayNames`, o valor comparado é o do banco.
const levelFilters = ref(["Fundamental", "Ensino Médio", "Gap", "Faculdade"]);
const levelDisplayNames = { Gap: "Gap Year" };

// `audience` é RECORTE AFIRMATIVO (o programa reserva ou prioriza vagas),
// não "para quem o programa é". Vocabulário fechado de 5 valores; os chips
// antigos ("Negros", "Indígenas", "LGBT", "Deficientes") não existiam no
// banco e retornavam zero resultados.
const audienceFilters = ref([
  "Baixa Renda",
  "Escola Pública",
  "Meninas",
  "Negro/Pardo",
  "Indígena/Quilombola",
]);

// Modalidade. Coluna `format`, hoje em 100% de cobertura — antes da
// reanotação 89% das linhas guardavam a modalidade em `location` também.
const formatFilters = ref(["Remoto", "Presencial", "Híbrido"]);

// Estado da inscrição. Coluna `inscricoes` (schema novo); nos bancos ainda
// não migrados o servidor deriva o valor do `status` antigo, então este
// filtro funciona dos dois lados.
const inscricoesFilters = ref(["Aberta", "Encerrada"]);
const inscricoesDisplayNames = {
  Aberta: "Inscrições abertas",
  Encerrada: "Inscrições encerradas",
};

const tuitionFilters = ref(["Bolsa", "Gratuito", "Totalmente Financiado"]);

const tempOpps = ref([]);

// Embaralha o array (Fisher-Yates). As oportunidades vêm do banco agrupadas
// por categoria (lote de cadastro), então sem isso a primeira página sempre
// mostrava só um tipo (ex.: só "Programas Acadêmicos"). Embaralhamos uma vez
// ao carregar os dados — os filtros continuam funcionando normalmente em
// cima dessa ordem já randomizada.
function embaralhar(array) {
  const copia = [...array];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

// Replace the single toggle method with a new one that handles filter types
const toggleFilter = (filter, filterType) => {
  let filterSet;
  switch (filterType) {
    case "type":
      filterSet = selectedTypeFilters;
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
    case "format":
      filterSet = selectedFormatFilters;
      break;
    case "inscricoes":
      filterSet = selectedInscricoesFilters;
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

  // Apply type filters (accumulative logic)
  if (selectedTypeFilters.value.size > 0) {
    filtered = filtered.filter((opportunity) =>
      selectedTypeFilters.value.has(opportunity.type)
    );
  }

  // Apply level filters (accumulative logic)
  if (selectedLevelFilters.value.size > 0) {
    filtered = filtered.filter((opportunity) => {
      return Array.from(selectedLevelFilters.value).some((filter) =>
        (opportunity.level || []).includes(filter)
      );
    });
  }

  // Apply audience filters (accumulative logic)
  if (selectedAudienceFilters.value.size > 0) {
    filtered = filtered.filter((opportunity) => {
      return Array.from(selectedAudienceFilters.value).some((filter) =>
        (opportunity.audience || []).includes(filter)
      );
    });
  }

  // Apply tuition filters (exclusive logic)
  if (selectedTuitionFilters.value.size > 0) {
    filtered = filtered.filter((opportunity) =>
      selectedTuitionFilters.value.has(opportunity.cost)
    );
  }

  // Apply field filters (accumulative logic)
  if (selectedFieldFilters.value.size > 0) {
    filtered = filtered.filter((opportunity) => {
      return Array.from(selectedFieldFilters.value).some((filter) =>
        (opportunity.areas || []).includes(filter)
      );
    });
  }

  // Apply format filters (accumulative logic)
  if (selectedFormatFilters.value.size > 0) {
    filtered = filtered.filter((opportunity) =>
      selectedFormatFilters.value.has(opportunity.format)
    );
  }

  // Apply inscricoes filters (accumulative logic)
  // `aberta`/`inscricoes` vêm normalizados do servidor — ver
  // server/utils/opportunitiesCache.js. Aqui só comparamos o rótulo.
  if (selectedInscricoesFilters.value.size > 0) {
    filtered = filtered.filter((opportunity) =>
      selectedInscricoesFilters.value.has(
        opportunity.inscricoes ??
          (opportunity.status === "Encerrada" ? "Encerrada" : "Aberta")
      )
    );
  }

  // Apply search term
  if (searchTerm.value) {
    const searchTermLower = searchTerm.value.toLowerCase();
    filtered = filtered.filter((o) =>
      [o.title, o.description, o.location, ...(o.keywords || []), ...(o.areas || [])]
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

// Fetch opportunities data from cached API
const { data, loading, error, cacheInfo, fetchOpportunities } = useCachedOpportunities();

const route = useRoute();

onMounted(async () => {
  try {
    await fetchOpportunities();
    // Data is already processed by the server API, so we can use it directly.
    // Embaralhamos aqui para não mostrar sempre a mesma categoria primeiro.
    tempOpps.value = embaralhar(data.value || []);

    // Pre-select the "Tipo" filter when arriving from a homepage category tile
    const typeParam = route.query.type;
    if (typeParam && typeFilters.value.includes(typeParam)) {
      selectedTypeFilters.value.add(typeParam);
    }

    // Pre-fill the search box when arriving from the homepage search bar
    if (route.query.q) {
      searchTerm.value = String(route.query.q);
    }
  } catch (error) {
    console.error('Error loading opportunities:', error);
  }
});

</script>

<template>
  <OpportunitiesHeader />

  <main class="wrap" style="padding-top: 32px; padding-bottom: 40px">
    <!-- Search and Filter Section -->
    <div class="flex flex-col sm:flex-row gap-3 items-stretch mb-4" style="max-width: 720px">
      <SearchInput v-model:search-term="searchTerm" />
      <button
        @click="showMobileFilters = true"
        class="md:hidden btn btn-out flex-none"
        style="padding: 14px 20px"
      >
        Filtrar <Filter class="w-5 h-5" />
      </button>
    </div>

    <!-- Desktop Filters: dropdowns horizontais, acima da lista de oportunidades -->
    <FiltersSidebar
      class="mb-5"
      :type-filters="typeFilters"
      :level-filters="levelFilters"
      :audience-filters="audienceFilters"
      :tuition-filters="tuitionFilters"
      :field-filters="fieldFilters"
      :format-filters="formatFilters"
      :inscricoes-filters="inscricoesFilters"
      :level-display-names="levelDisplayNames"
      :inscricoes-display-names="inscricoesDisplayNames"
      :selected-type-filters="selectedTypeFilters"
      :selected-level-filters="selectedLevelFilters"
      :selected-audience-filters="selectedAudienceFilters"
      :selected-tuition-filters="selectedTuitionFilters"
      :selected-field-filters="selectedFieldFilters"
      :selected-format-filters="selectedFormatFilters"
      :selected-inscricoes-filters="selectedInscricoesFilters"
      @toggle-filter="toggleFilter"
    />

    <!-- Mobile Filters -->
    <MobileFilters
      :show="showMobileFilters"
      :type-filters="typeFilters"
      :level-filters="levelFilters"
      :audience-filters="audienceFilters"
      :tuition-filters="tuitionFilters"
      :field-filters="fieldFilters"
      :format-filters="formatFilters"
      :inscricoes-filters="inscricoesFilters"
      :level-display-names="levelDisplayNames"
      :inscricoes-display-names="inscricoesDisplayNames"
      :selected-type-filters="selectedTypeFilters"
      :selected-level-filters="selectedLevelFilters"
      :selected-audience-filters="selectedAudienceFilters"
      :selected-tuition-filters="selectedTuitionFilters"
      :selected-field-filters="selectedFieldFilters"
      :selected-format-filters="selectedFormatFilters"
      :selected-inscricoes-filters="selectedInscricoesFilters"
      @toggle-filter="toggleFilter"
      @close="showMobileFilters = false"
    />

    <!-- Result count -->
    <p class="text-ink/55 font-medium mb-6" style="font-size: 14px">
      {{ filteredOpportunities.length }}
      {{ filteredOpportunities.length === 1 ? "oportunidade encontrada" : "oportunidades encontradas" }}
    </p>

    <!-- Opportunities Grid -->
    <div class="w-full">
      <Loading :watch="!data" />

      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        <OpportunityCard
          v-for="opportunity in paginatedOpportunities"
          :key="opportunity.id"
          :opportunity="opportunity"
        />
      </div>

      <!-- Empty state -->
      <div
        v-if="data && filteredOpportunities.length === 0"
        class="text-center text-ink/55"
        style="padding: 60px 0"
      >
        <p style="font-size: 18px">Nenhuma oportunidade encontrada. Tente outros filtros.</p>
      </div>

      <!-- Pagination -->
      <Pagination
        :current-page="currentPage"
        :total-pages="totalPages"
        :displayed-pages="displayedPages"
        @update-page="currentPage = $event"
      />
    </div>
  </main>
</template>
