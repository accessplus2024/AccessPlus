<script setup>
useHead({
  title: "Oportunidades",
  meta: [
    { charset: "UTF-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1.0" },
    { name: "description", content: "" },
  ],
  htmlAttrs: {
    lang: "pt-br",
  },
});

const searchTerm = ref("");

const keywordFilters = [
  "Olimpíadas Científicas",
  "MUNs",
  "Programas Acadêmicos",
  "Programas de Intercâmbios",
  "Bolsas de Estudo",
  "Competições",
  "Competições de Escrita",
  "Mentorias",
];

const interestFilters = [
  "Meio Ambiente",
  "Humanas",
  "STEM",
  "Linguagens",
  "Artes",
];

const opportunities = [
  {
    image: "https://placehold.co/400x200",
    category: "Categoria",
    deadline: "Deadline",
    level: "Nível",
    name: "Nome",
    description: "Descrição breve da oportunidade",
    link: "oportunidade",
  },
  {
    image: "https://placehold.co/400x200",
    category: "Categoria",
    deadline: "Deadline",
    level: "Nível",
    name: "exemplo",
    description: "Descrição breve da oportunidade",
    link: "oportunidade",
  },
  {
    image: "https://placehold.co/400x200",
    category: "Categoria",
    deadline: "Deadline",
    level: "Nível",
    name: "arroz",
    description: "Descrição breve da oportunidade",
    link: "oportunidade",
  },
  {
    image: "https://placehold.co/400x200",
    category: "Categoria",
    deadline: "Deadline",
    level: "Nível",
    name: "Nome",
    description: "Descrição breve da oportunidade",
    link: "oportunidade",
  },
  {
    image: "https://placehold.co/400x200",
    category: "Categoria",
    deadline: "Deadline",
    level: "Nível",
    name: "Nome",
    description: "Descrição breve da oportunidade",
    link: "oportunidade",
  },
  {
    image: "https://placehold.co/400x200",
    category: "Categoria",
    deadline: "Deadline",
    level: "Nível",
    name: "Nome",
    description: "Descrição breve da oportunidade",
    link: "oportunidade",
  },
];

const tempOpps = ref([]);

const filteredOpportunities = computed(() =>
  tempOpps.value.filter((o) =>
    [o.name, o.description]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.value.toLowerCase())
  )
);

// Using the composition API with script setup
const { data, loading, error, fetchSheetData } = useSteinData();

// Fetch data when the component mounts
onMounted(async () => {
  await fetchSheetData("Programas Acadêmicos")
    .then(() => {
      console.log("Programas Acadêmicos:", data.value);
      tempOpps.value = data.value;
    })
    .catch((error) => {
      console.error(error);
    });
});
</script>

<template>
  <header
    class="relative bg-gradient-to-r from-purple-600 to-pink-600 pb-16 rounded-b-lg bg-cover bg-center"
    :style="{ backgroundImage: 'url(/images/oportunidades_page_header.png)' }"
  >
    <div class="container mx-auto px-6 flex flex-col items-center">
      <Navbar transparent="true" />
      <div class="text-left w-full max-w-4xl mt-12">
        <h1 class="text-3xl sm:text-4xl lg:text-5xl mb-4 leading-none">
          <p class="font-bold">Todas as</p>
          <span class="block font-semibold">Oportunidades</span>
        </h1>
      </div>
    </div>
  </header>

  <main class="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
    <div class="flex flex-col md:flex-row items-center gap-6 mb-8">
      <div class="bg-gray-100 p-3 rounded-lg mb-4 md:mb-0">
        <h4 class="text-xl font-semibold text-black">Filtre:</h4>
      </div>
      <div class="w-full flex">
        <input
          type="text"
          v-model="searchTerm"
          placeholder="Olimpíada Brasileira de Investimentos"
          class="w-full text-black bg-gray-100 font-light p-4 rounded-lg border border-gray-300"
        />
      </div>
    </div>

    <div class="flex flex-col md:flex-row gap-6">
      <div
        class="w-full md:w-1/4 bg-gray-100 text-black p-6 rounded-lg h-fit"
        style="min-width: 300px"
      >
        <h2 class="text-xl font-semibold mb-4 text-black">Filtros</h2>
        <div class="mb-4">
          <h3 class="text-lg font-semibold mb-2">Palavras-chave</h3>
          <div>
            <label
              v-for="keyword in keywordFilters"
              :key="keyword"
              class="block"
            >
              <input type="checkbox" class="mr-2" /> {{ keyword }}
            </label>
          </div>
        </div>
        <div class="mb-4">
          <h3 class="text-lg font-semibold mb-2">Interesses</h3>
          <div>
            <label
              v-for="interest in interestFilters"
              :key="interest"
              class="block"
            >
              <input type="checkbox" class="mr-2" /> {{ interest }}
            </label>
          </div>
        </div>
      </div>

      <div class="w-full md:w-3/4">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div
            v-for="(opportunity, index) in filteredOpportunities"
            :key="index"
            class="bg-white rounded-xl overflow-hidden border border-gray-200"
          >
            <img
              src="https://placehold.co/400x200"
              class="w-full h-48 object-cover"
            />
            <div class="p-6">
              <div class="flex space-x-2 mb-4">
                <span
                  class="bg-purple-600 text-white text-xs px-3 py-1 rounded-full"
                >
                </span>
                <span
                  class="bg-red-500 text-white text-xs px-3 py-1 rounded-full"
                >
                </span>
                <span
                  class="bg-blue-500 text-white text-xs px-3 py-1 rounded-full"
                >
                </span>
              </div>
              <h3 class="text-lg font-bold text-gray-800 mb-2">
                {{ opportunity.Nome }}
              </h3>
              <p class="text-sm text-gray-600 mb-4"></p>
              <a :href="opportunity.link" class="text-purple-600 font-semibold"
                >Veja mais</a
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
