<script setup>
import { computed } from "vue"
import { ArrowRight } from "@iconoir/vue"

const props = defineProps({
  opportunity: { type: Object, required: true },
})

const keywordsList = computed(() => {
  if (!props.opportunity.keywords) return []
  return Array.isArray(props.opportunity.keywords)
    ? props.opportunity.keywords
    : props.opportunity.keywords.split(",")
})
</script>

<template>
  <!-- Quick access -->
  <div class="relative overflow-hidden text-white" style="background: var(--color-primary); border-radius: var(--r-card); padding: 30px">
    <h3 class="relative font-body font-bold" style="font-size: 20px">Acesso rápido</h3>
    <p class="relative text-white/85 mt-2" style="font-size: 15px">
      Vá direto para o site oficial da oportunidade.
    </p>
    <a
      v-if="opportunity.site"
      :href="opportunity.site"
      target="_blank"
      rel="noopener"
      class="btn btn-lime mt-5"
    >
      Aplicar agora <ArrowRight class="w-[18px] h-[18px]" />
    </a>
  </div>

  <!-- Tags -->
  <div v-if="keywordsList.length" class="bg-card border border-ink/8" style="border-radius: var(--r-card); padding: 30px">
    <h3 class="font-body font-bold text-ink mb-4" style="font-size: 18px">Tags relacionadas</h3>
    <div class="flex flex-wrap gap-2">
      <span
        v-for="(keyword, index) in keywordsList"
        :key="index"
        class="rounded-full border border-ink/15 text-ink/70 capitalize"
        style="font-size: 13px; font-weight: 500; padding: 6px 14px"
      >
        {{ keyword.trim() }}
      </span>
    </div>
  </div>
</template>
