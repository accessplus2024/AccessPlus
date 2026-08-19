<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue"
import FilterDropdown from "./FilterDropdown.vue"

const props = defineProps({
  typeFilters: Array,
  levelFilters: Array,
  audienceFilters: Array,
  tuitionFilters: Array,
  fieldFilters: Array,
  selectedTypeFilters: Object,
  selectedLevelFilters: Object,
  selectedAudienceFilters: Object,
  selectedTuitionFilters: Object,
  selectedFieldFilters: Object,
});

const emit = defineEmits(["toggle-filter"]);

const toggleFilter = (filter, filterType) => {
  emit("toggle-filter", filter, filterType);
};

// Só um dropdown aberto por vez — clicar em outro fecha o anterior, e clicar
// fora de qualquer um fecha tudo.
const openFilter = ref(null)
const toggleOpen = (filterType) => {
  openFilter.value = openFilter.value === filterType ? null : filterType
}

const rootEl = ref(null)
function onClickOutside(e) {
  if (rootEl.value && !rootEl.value.contains(e.target)) openFilter.value = null
}
onMounted(() => document.addEventListener("click", onClickOutside))
onBeforeUnmount(() => document.removeEventListener("click", onClickOutside))

const palette = {
  type: "var(--color-primary)",
  level: "var(--color-magenta)",
  audience: "var(--color-teal)",
  tuition: "var(--color-amber)",
  field: "var(--color-purple)",
}
</script>

<template>
  <div ref="rootEl" class="hidden md:flex filters-bar">
    <FilterDropdown
      title="Tipo"
      :filters="typeFilters"
      :selected-filters="selectedTypeFilters"
      :display-names="{}"
      filter-type="type"
      :is-open="openFilter === 'type'"
      :color="palette.type"
      @toggle-open="toggleOpen"
      @toggle-filter="toggleFilter"
    />

    <FilterDropdown
      title="Nível"
      :filters="levelFilters"
      :selected-filters="selectedLevelFilters"
      :display-names="{}"
      filter-type="level"
      :is-open="openFilter === 'level'"
      :color="palette.level"
      @toggle-open="toggleOpen"
      @toggle-filter="toggleFilter"
    />

    <FilterDropdown
      title="Público Alvo"
      :filters="audienceFilters"
      :selected-filters="selectedAudienceFilters"
      :display-names="{}"
      filter-type="audience"
      :is-open="openFilter === 'audience'"
      :color="palette.audience"
      @toggle-open="toggleOpen"
      @toggle-filter="toggleFilter"
    />

    <FilterDropdown
      title="Custo"
      :filters="tuitionFilters"
      :selected-filters="selectedTuitionFilters"
      :display-names="{}"
      filter-type="tuition"
      :is-open="openFilter === 'tuition'"
      :color="palette.tuition"
      @toggle-open="toggleOpen"
      @toggle-filter="toggleFilter"
    />

    <FilterDropdown
      title="Interesse"
      :filters="fieldFilters"
      :selected-filters="selectedFieldFilters"
      :display-names="{}"
      filter-type="field"
      :is-open="openFilter === 'field'"
      :color="palette.field"
      @toggle-open="toggleOpen"
      @toggle-filter="toggleFilter"
    />
  </div>
</template>

<style scoped>
.filters-bar {
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
}
</style>
