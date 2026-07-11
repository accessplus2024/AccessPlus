<script setup>
import { Search } from "@iconoir/vue"

const props = defineProps({
  searchTerm: { type: String, default: "" },
})
const emit = defineEmits(["update:searchTerm"])
const updateSearchTerm = (event) => emit("update:searchTerm", event.target.value)
</script>

<template>
  <div class="relative w-full">
    <span class="absolute left-[22px] top-1/2 -translate-y-1/2 text-ink/45 pointer-events-none">
      <Search class="w-[22px] h-[22px]" />
    </span>
    <input
      type="text"
      :value="searchTerm"
      @input="updateSearchTerm"
      placeholder="Buscar por nome, área ou palavra-chave…"
      class="w-full bg-card text-ink font-body border border-ink/12 rounded-pill focus:outline-none focus:border-primary transition-colors"
      style="padding: 17px 22px 17px 56px; font-size: 16px"
    />
  </div>
</template>
