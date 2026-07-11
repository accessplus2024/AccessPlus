<script setup>
import { NavArrowLeft, NavArrowRight } from "@iconoir/vue"

const props = defineProps({
  currentPage: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  displayedPages: { type: Array, required: true },
})

const emit = defineEmits(["update-page"])
const changePage = (page) => emit("update-page", page)
</script>

<template>
  <div v-if="totalPages > 1" class="mt-10 flex flex-wrap items-center justify-center gap-2">
    <button
      @click="changePage(currentPage - 1)"
      :disabled="currentPage === 1"
      aria-label="Página anterior"
      class="w-11 h-11 inline-flex items-center justify-center rounded-full border border-ink/15 text-ink hover:bg-ink hover:text-paper transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink"
    >
      <NavArrowLeft class="w-5 h-5" />
    </button>

    <button
      v-for="page in displayedPages"
      :key="page"
      @click="changePage(page)"
      class="min-w-11 h-11 px-3 inline-flex items-center justify-center rounded-full font-body font-medium transition-colors"
      :class="currentPage === page
        ? 'bg-primary text-white'
        : 'text-ink/70 hover:bg-ink/5'"
      style="font-size: 15px"
    >
      {{ page }}
    </button>

    <button
      @click="changePage(currentPage + 1)"
      :disabled="currentPage === totalPages"
      aria-label="Próxima página"
      class="w-11 h-11 inline-flex items-center justify-center rounded-full border border-ink/15 text-ink hover:bg-ink hover:text-paper transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink"
    >
      <NavArrowRight class="w-5 h-5" />
    </button>
  </div>
</template>
