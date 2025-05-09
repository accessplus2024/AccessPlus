<script setup>
import { Search } from "@iconoir/vue";

const props = defineProps({
  searchTerm: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:searchTerm"]);

const updateSearchTerm = (event) => {
  emit("update:searchTerm", event.target.value);
};
</script>

<template>
  <div class="relative w-full sm:w-auto flex-grow">
    <input
      type="text"
      :value="searchTerm"
      @input="updateSearchTerm"
      placeholder="Buscar"
      class="w-full text-black bg-[#F0F0F0] font-light p-4 rounded-lg border border-gray-300 pr-12 focus:outline-none focus:border-gray-400 transition-colors"
    />
    <button
      class="absolute top-1/2 right-4 transform -translate-y-1/2 text-gray-500 hover:text-black transition-all duration-500"
    >
      <Search class="w-6 h-6 hover:w-8 hover:h-8 transition-all duration-500" />
    </button>
  </div>
</template>
