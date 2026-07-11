<script setup>
const props = defineProps({
  title: String,
  filters: Array,
  selectedFilters: Object,
  displayNames: Object,
  filterType: String,
})

const emit = defineEmits(["toggle-filter"])
const toggleFilter = (filter) => emit("toggle-filter", filter, props.filterType)
</script>

<template>
  <div class="mb-6 last:mb-0">
    <h3 class="font-body font-semibold uppercase text-ink/55 mb-3" style="font-size: 12px; letter-spacing: .12em">
      {{ title }}
    </h3>
    <div class="space-y-1.5">
      <label
        v-for="filter in filters"
        :key="filter"
        class="flex items-center gap-2.5 cursor-pointer group/check"
      >
        <input
          type="checkbox"
          :checked="selectedFilters.has(filter)"
          @change="toggleFilter(filter)"
          class="peer sr-only"
        />
        <span class="flex-none w-[18px] h-[18px] rounded-md border border-ink/25 grid place-items-center transition-colors peer-checked:bg-primary peer-checked:border-primary">
          <svg class="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 12.5 9 17.5 20 6.5" />
          </svg>
        </span>
        <span class="text-ink/75 group-hover/check:text-ink transition-colors font-body" style="font-size: 14.5px">
          {{ displayNames[filter] || filter }}
        </span>
      </label>
    </div>
  </div>
</template>
