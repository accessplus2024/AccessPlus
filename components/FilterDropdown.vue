<script setup>
import { computed } from "vue"
import { NavArrowDown } from "@iconoir/vue"

const props = defineProps({
  title: String,
  filters: Array,
  selectedFilters: Object, // Set
  displayNames: { type: Object, default: () => ({}) },
  filterType: String,
  isOpen: Boolean,
  color: { type: String, default: "var(--color-primary)" },
})

const emit = defineEmits(["toggle-open", "toggle-filter"])

const selectedCount = computed(() => props.selectedFilters?.size || 0)
</script>

<template>
  <div class="filter-dd" :class="{ 'is-open': isOpen }">
    <button
      type="button"
      class="filter-trigger"
      :class="{ 'has-selected': selectedCount > 0 }"
      :style="selectedCount > 0 ? { borderColor: color, color } : {}"
      @click="emit('toggle-open', filterType)"
    >
      <span>{{ title }}</span>
      <span v-if="selectedCount" class="filter-badge" :style="{ background: color }">{{ selectedCount }}</span>
      <NavArrowDown class="chevron" :class="{ flipped: isOpen }" />
    </button>

    <Transition name="dd-fade">
      <div v-if="isOpen" class="filter-panel">
        <label v-for="filter in filters" :key="filter" class="filter-option group/opt">
          <input
            type="checkbox"
            :checked="selectedFilters.has(filter)"
            @change="emit('toggle-filter', filter, filterType)"
            class="peer sr-only"
          />
          <span
            class="option-box peer-checked:border-transparent"
            :style="selectedFilters.has(filter) ? { background: color, borderColor: color } : {}"
          >
            <svg
              class="w-3 h-3 text-white transition-opacity"
              :style="{ opacity: selectedFilters.has(filter) ? 1 : 0 }"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"
              stroke-linecap="round" stroke-linejoin="round"
            >
              <path d="M4 12.5 9 17.5 20 6.5" />
            </svg>
          </span>
          <span class="option-label">{{ displayNames[filter] || filter }}</span>
        </label>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.filter-dd {
  position: relative;
}
.filter-trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 16px;
  border-radius: var(--r-pill);
  border: 2px solid color-mix(in srgb, var(--color-ink) 14%, transparent);
  background: #fff;
  color: var(--color-ink);
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 14px;
  white-space: nowrap;
  cursor: pointer;
  transition: border-color .2s ease, color .2s ease, box-shadow .2s ease;
}
.filter-trigger:hover { border-color: color-mix(in srgb, var(--color-ink) 30%, transparent); }
.filter-trigger.has-selected { background: color-mix(in srgb, currentColor 8%, #fff); }
.is-open .filter-trigger {
  border-color: var(--color-primary);
  color: var(--color-primary);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-primary) 12%, transparent);
}

.filter-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 19px;
  height: 19px;
  padding: 0 5px;
  border-radius: 999px;
  color: #fff;
  font-size: 11.5px;
  font-weight: 700;
}

.chevron {
  width: 15px;
  height: 15px;
  transition: transform .2s ease;
}
.chevron.flipped { transform: rotate(180deg); }

.filter-panel {
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  z-index: 30;
  min-width: 240px;
  max-height: 320px;
  overflow-y: auto;
  padding: 14px;
  border-radius: 18px;
  border: 2px solid color-mix(in srgb, var(--color-ink) 8%, transparent);
  background: #fff;
  box-shadow: 0 18px 40px rgba(21, 17, 31, .16);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 8px;
  border-radius: 10px;
  cursor: pointer;
  transition: background .15s ease;
}
.filter-option:hover { background: color-mix(in srgb, var(--color-ink) 4%, transparent); }

.option-box {
  flex: none;
  width: 18px;
  height: 18px;
  border-radius: 6px;
  border: 2px solid color-mix(in srgb, var(--color-ink) 25%, transparent);
  display: grid;
  place-items: center;
  transition: background .15s ease, border-color .15s ease;
}

.option-label {
  font-family: var(--font-body);
  font-size: 14.5px;
  color: color-mix(in srgb, var(--color-ink) 82%, transparent);
}

.dd-fade-enter-active, .dd-fade-leave-active { transition: opacity .15s ease, transform .15s ease; }
.dd-fade-enter-from, .dd-fade-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
