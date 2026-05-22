<template>
  <div class="lg:col-span-4 space-y-3">
    <h2 class="font-display text-3xl font-bold text-text mb-8 flex items-center">
      <div
        class="w-2 h-8 bg-primary rounded-full mr-4"
      ></div>
      Detalhes
    </h2>

    <!-- Guide Tab -->
    <button
      :class="[
        'w-full p-6 rounded-2xl text-left font-semibold transition-all duration-300 border-2 group',
        activeTab === 'guide'
          ? 'bg-primary text-white border-primary shadow-xl transform scale-105'
          : 'bg-surface text-text border-text/10 hover:border-primary hover:shadow-lg',
      ]"
      @click="
        $emit(
          'changeContent',
          'Elegibilidade e Guia de Aplicação',
          opportunity.guide,
          'guide'
        )
      "
    >
      <div class="flex items-center">
        <div
          :class="[
            'w-12 h-12 rounded-xl flex items-center justify-center mr-4 transition-all duration-300',
            activeTab === 'guide'
              ? 'bg-white/20'
              : 'bg-primary/10 group-hover:bg-primary/20',
          ]"
        >
          <svg
            :class="[
              'w-6 h-6 transition-all duration-300',
              activeTab === 'guide'
                ? 'text-white'
                : 'text-primary group-hover:text-primary/80',
            ]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            ></path>
          </svg>
        </div>
        <div>
          <div class="text-lg font-bold">Elegibilidade e Guia</div>
          <div
            :class="[
              'text-sm transition-all duration-300',
              activeTab === 'guide' ? 'text-white/80' : 'text-gray-500',
            ]"
          >
            Critérios e processo de aplicação
          </div>
        </div>
      </div>
    </button>

    <!-- Process Tab -->
    <button
      :class="[
        'w-full p-6 rounded-2xl text-left font-semibold transition-all duration-300 border-2 group',
        activeTab === 'process'
          ? 'bg-primary text-white border-primary shadow-xl transform scale-105'
          : 'bg-surface text-text border-text/10 hover:border-primary hover:shadow-lg',
      ]"
      @click="
        $emit(
          'changeContent',
          'Sobre o Processo',
          opportunity.regInfo,
          'process'
        )
      "
    >
      <div class="flex items-center">
        <div
          :class="[
            'w-12 h-12 rounded-xl flex items-center justify-center mr-4 transition-all duration-300',
            activeTab === 'process'
              ? 'bg-white/20'
              : 'bg-primary/10 group-hover:bg-primary/20',
          ]"
        >
          <svg
            :class="[
              'w-6 h-6 transition-all duration-300',
              activeTab === 'process'
                ? 'text-white'
                : 'text-primary group-hover:text-primary/80',
            ]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
        </div>
        <div>
          <div class="text-lg font-bold">Sobre o Processo</div>
          <div
            :class="[
              'text-sm transition-all duration-300',
              activeTab === 'process' ? 'text-white/80' : 'text-gray-500',
            ]"
          >
            Informações do processo seletivo
          </div>
        </div>
      </div>
    </button>

    <!-- Tips Tab -->
    <button
      :class="[
        'w-full p-6 rounded-2xl text-left font-semibold transition-all duration-300 border-2 group',
        activeTab === 'tips'
          ? 'bg-primary text-white border-primary shadow-xl transform scale-105'
          : 'bg-surface text-text border-text/10 hover:border-primary hover:shadow-lg',
      ]"
      @click="
        $emit(
          'changeContent',
          'Dicas de contemplados',
          opportunity.appTips,
          'tips'
        )
      "
    >
      <div class="flex items-center">
        <div
          :class="[
            'w-12 h-12 rounded-xl flex items-center justify-center mr-4 transition-all duration-300',
            activeTab === 'tips'
              ? 'bg-white/20'
              : 'bg-primary/10 group-hover:bg-primary/20',
          ]"
        >
          <svg
            :class="[
              'w-6 h-6 transition-all duration-300',
              activeTab === 'tips'
                ? 'text-white'
                : 'text-primary group-hover:text-primary/80',
            ]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            ></path>
          </svg>
        </div>
        <div>
          <div class="text-lg font-bold">Dicas de Contemplados</div>
          <div
            :class="[
              'text-sm transition-all duration-300',
              activeTab === 'tips' ? 'text-white/80' : 'text-gray-500',
            ]"
          >
            Experiências de quem foi aprovado
          </div>
        </div>
      </div>
    </button>

    <!-- Additional Info Tab -->
    <button
      :class="[
        'w-full p-6 rounded-2xl text-left font-semibold transition-all duration-300 border-2 group',
        activeTab === 'additional'
          ? 'bg-primary text-white border-primary shadow-xl transform scale-105'
          : 'bg-surface text-text border-text/10 hover:border-primary hover:shadow-lg',
      ]"
      @click="
        $emit(
          'changeContent',
          'Informações adicionais',
          opportunity.addInfo,
          'additional'
        )
      "
    >
      <div class="flex items-center">
        <div
          :class="[
            'w-12 h-12 rounded-xl flex items-center justify-center mr-4 transition-all duration-300',
            activeTab === 'additional'
              ? 'bg-white/20'
              : 'bg-primary/10 group-hover:bg-primary/20',
          ]"
        >
          <svg
            :class="[
              'w-6 h-6 transition-all duration-300',
              activeTab === 'additional'
                ? 'text-white'
                : 'text-primary group-hover:text-primary/80',
            ]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            ></path>
          </svg>
        </div>
        <div>
          <div class="text-lg font-bold">Informações Adicionais</div>
          <div
            :class="[
              'text-sm transition-all duration-300',
              activeTab === 'additional' ? 'text-white/80' : 'text-gray-500',
            ]"
          >
            Detalhes complementares
          </div>
        </div>
      </div>
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  opportunity: {
    type: Object,
    required: true,
  },
  activeTab: {
    type: String,
    required: true,
  },
});

defineEmits(["changeContent"]);
</script>
