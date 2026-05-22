<script setup>
import { Search } from "@iconoir/vue"

const props = defineProps({
  searchTerm: { type: String, default: "" },
})

const emit = defineEmits(["update:searchTerm"])
const updateSearchTerm = (event) => emit("update:searchTerm", event.target.value)
</script>

<template>
  <div class="relative w-full sm:w-auto flex-grow">
    <input
      type="text"
      :value="searchTerm"
      @input="updateSearchTerm"
      placeholder="Buscar"
      class="w-full text-text bg-surface font-body font-light p-4 rounded-lg border border-text/20 pr-12 focus:outline-none focus:border-primary transition-colors"
    />
    <button class="absolute top-1/2 right-4 transform -translate-y-1/2 text-text/50 hover:text-primary transition-colors duration-300">
      <Search class="w-6 h-6" />
    </button>
  </div>
</template>
