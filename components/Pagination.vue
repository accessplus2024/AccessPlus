<script setup>
const props = defineProps({
  currentPage: {
    type: Number,
    required: true,
  },
  totalPages: {
    type: Number,
    required: true,
  },
  displayedPages: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(["update-page"]);

const changePage = (page) => {
  emit("update-page", page);
};
</script>

<template>
  <div class="mt-8 flex flex-wrap justify-center gap-2">
    <button
      @click="changePage(currentPage - 1)"
      :disabled="currentPage === 1"
      class="px-4 py-2 rounded-lg bg-purple-600 text-white disabled:bg-gray-300"
    >
      Anterior
    </button>
    <div class="flex flex-wrap items-center gap-2">
      <button
        v-for="page in displayedPages"
        :key="page"
        @click="changePage(page)"
        :class="{
          'bg-purple-600 text-white': currentPage === page,
          'bg-gray-200 text-gray-600': currentPage !== page,
        }"
        class="px-4 py-2 rounded-lg text-sm sm:text-base"
      >
        {{ page }}
      </button>
    </div>
    <button
      @click="changePage(currentPage + 1)"
      :disabled="currentPage === totalPages"
      class="px-4 py-2 rounded-lg bg-purple-600 text-white disabled:bg-gray-300"
    >
      Próxima
    </button>
  </div>
</template>
