<template>
  <div class="lg:col-span-5 space-y-6" data-aos="fade-left">
    <!-- Quick Access Card -->
    <div
      class="info-card bg-primary rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden"
    >
      <!-- Background Pattern -->
      <div
        class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"
      ></div>
      <div
        class="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"
      ></div>

      <div class="relative z-10">
        <h3 class="text-2xl font-bold mb-4 flex items-center">
          <div
            class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mr-3"
          >
            <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              ></path>
            </svg>
          </div>
          Acesso Rápido
        </h3>
        <p class="text-white/80 mb-6 text-lg">
          Vá direto para o site oficial da oportunidade
        </p>
        <a
          :href="opportunity.site"
          target="_blank"
          class="inline-flex items-center bg-white text-violet-700 font-bold px-6 py-3 rounded-xl hover:bg-white/90 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
        >
          <span>Aplicar Agora</span>
          <svg
            class="w-5 h-5 ml-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            ></path>
          </svg>
        </a>
      </div>
    </div>

    <!-- Keywords Card with Enhanced Design -->
    <div
      class="info-card bg-surface rounded-3xl p-8 shadow-xl border border-text/10"
    >
      <h3 class="font-display text-xl font-bold text-text mb-6 flex items-center">
        <div
          class="w-10 h-10 bg-primary rounded-xl flex items-center justify-center mr-3"
        >
          <svg
            class="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.997 1.997 0 013 12V7a4 4 0 014-4z"
            ></path>
          </svg>
        </div>
        Tags Relacionadas
      </h3>
      <div class="flex flex-wrap gap-3">
        <span
          v-for="(keyword, index) in keywordsList"
          :key="index"
          class="group px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-2xl text-sm font-body font-semibold border border-primary/20 transition-all duration-300 hover:scale-105"
        >
          #{{ keyword.trim() }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  opportunity: {
    type: Object,
    required: true,
  },
});

const keywordsList = computed(() => {
  if (!props.opportunity.keywords) return [];
  return Array.isArray(props.opportunity.keywords)
    ? props.opportunity.keywords
    : props.opportunity.keywords.split(",");
});
</script>
