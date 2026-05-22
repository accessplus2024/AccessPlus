<template>
  <div class="bg-surface rounded-3xl p-8 mb-16 shadow-xl border border-text/10" data-aos="fade-up">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <!-- Deadline Card -->
      <div class="text-center group">
        <div class="bg-accent-red w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
        </div>
        <h3 class="font-display text-lg font-bold text-text mb-2">Prazo de Inscrição</h3>
        <p class="font-body text-2xl font-black text-accent-red">{{ opportunity.deadline }}</p>
      </div>

      <!-- Area Card -->
      <div class="text-center group">
        <div class="bg-primary w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
          </svg>
        </div>
        <h3 class="font-display text-lg font-bold text-text mb-2">Área de Atuação</h3>
        <p class="font-body text-xl font-bold text-primary">{{ opportunity.fields.join(", ") }}</p>
      </div>

      <!-- Level Card -->
      <div class="text-center group">
        <div class="bg-accent-cyan w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
          <svg class="w-8 h-8 text-[#0D0B1A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
          </svg>
        </div>
        <h3 class="font-display text-lg font-bold text-text mb-2">Nível</h3>
        <p class="font-body text-xl font-bold text-accent-cyan">{{ opportunity.level }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({ opportunity: { type: Object, required: true } })
</script>
