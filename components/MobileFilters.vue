<script setup>
import FilterGroup from "./FilterGroup.vue";

const props = defineProps({
  show: Boolean,
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

const emit = defineEmits(["toggle-filter", "close"]);

const toggleFilter = (filter, filterType) => {
  emit("toggle-filter", filter, filterType);
};

const closeFilters = () => {
  emit("close");
};
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto md:hidden">
    <div
      class="flex items-end justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0"
    >
      <div
        class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        @click="closeFilters"
      ></div>
      <div
        class="relative inline-block w-full max-w-md p-6 my-8 overflow-y-auto text-left align-middle transform bg-white shadow-xl rounded-2xl"
        style="max-height: 80vh; overflow-y: auto"
      >
        <button
          @click="closeFilters"
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

        <div class="mt-6">
          <button
            @click="closeFilters"
            class="w-full bg-[#FFB84C] text-white px-6 py-3 rounded-lg hover:bg-[#FF9F00] transition duration-200"
          >
            Aplicar Filtros
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
