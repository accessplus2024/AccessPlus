<script setup>
const props = defineProps({
  title: String,
  filters: Array,
  selectedFilters: Object, // Filter set
  displayNames: Object,
  filterType: String,
});

const emit = defineEmits(["toggle-filter"]);

const toggleFilter = (filter) => {
  emit("toggle-filter", filter, props.filterType);
};
</script>

<template>
  <div class="mb-6">
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
          :checked="selectedFilters.has(filter)"
          @change="toggleFilter(filter)"
          class="form-checkbox h-4 w-4 text-purple-600 mr-2"
        />
        <span class="text-gray-700">{{ displayNames[filter] || filter }}</span>
      </label>
    </div>
  </div>
</template>
