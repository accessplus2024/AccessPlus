<script setup>
import FilterGroup from "./FilterGroup.vue";

const props = defineProps({
  typeFilters: Array,
  openFilters: Array,
  levelFilters: Array,
  audienceFilters: Array,
  tuitionFilters: Array,
  fieldFilters: Array,
  selectedTypeFilters: Object,
  selectedStatusFilters: Object,
  selectedLevelFilters: Object,
  selectedAudienceFilters: Object,
  selectedTuitionFilters: Object,
  selectedFieldFilters: Object,
  typeDisplayNames: Object,
  statusDisplayNames: Object,
});

const emit = defineEmits(["toggle-filter"]);

const toggleFilter = (filter, filterType) => {
  emit("toggle-filter", filter, filterType);
};
</script>

<template>
  <aside
    class="hidden md:block w-1/4 bg-gray-100 text-black p-6 rounded-lg h-fit sticky top-4"
    style="min-width: 300px"
  >
    <h2 class="text-xl font-semibold text-black mb-3">Filtros</h2>

    <FilterGroup
      title="Tipo"
      :filters="typeFilters"
      :selected-filters="selectedTypeFilters"
      :display-names="typeDisplayNames"
      filter-type="type"
      @toggle-filter="toggleFilter"
    />

    <FilterGroup
      title="Inscrições abertas"
      :filters="openFilters"
      :selected-filters="selectedStatusFilters"
      :display-names="statusDisplayNames"
      filter-type="status"
      @toggle-filter="toggleFilter"
    />

    <FilterGroup
      title="Nível"
      :filters="levelFilters"
      :selected-filters="selectedLevelFilters"
      :display-names="{}"
      filter-type="level"
      @toggle-filter="toggleFilter"
    />

    <FilterGroup
      title="Público Alvo"
      :filters="audienceFilters"
      :selected-filters="selectedAudienceFilters"
      :display-names="{}"
      filter-type="audience"
      @toggle-filter="toggleFilter"
    />

    <FilterGroup
      title="Custo"
      :filters="tuitionFilters"
      :selected-filters="selectedTuitionFilters"
      :display-names="{}"
      filter-type="tuition"
      @toggle-filter="toggleFilter"
    />

    <FilterGroup
      title="Interesse"
      :filters="fieldFilters"
      :selected-filters="selectedFieldFilters"
      :display-names="{}"
      filter-type="field"
      @toggle-filter="toggleFilter"
    />
  </aside>
</template>
