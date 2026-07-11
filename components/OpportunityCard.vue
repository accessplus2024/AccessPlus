<script setup>
import { ArrowRight } from "@iconoir/vue"
import { categoryFor, categoryIcon, isLightColor } from "~/utils/categories"

const props = defineProps({
  opportunity: { type: Object, required: true },
  // kept for backwards compat with the catalog page; styling now derives from category.
  getKeywordColor: { type: Function, required: false, default: null },
})

const cat = computed(() => categoryFor(props.opportunity.type))
const open = computed(() => props.opportunity.status === "sim")
const tags = computed(() => (props.opportunity.keywords || []).slice(0, 3))
const labelColor = computed(() => (isLightColor(cat.value.color) ? "#15111F" : cat.value.color))
const hover = ref(false)
</script>

<template>
  <NuxtLink
    :to="`/oportunidade/${opportunity.id}`"
    class="group relative flex flex-col overflow-hidden bg-card border border-ink/8 transition-all duration-300 ease-brand"
    :style="{
      borderRadius: 'var(--r-card)', padding: '26px',
      transform: hover ? 'translateY(-6px)' : 'none',
      boxShadow: hover ? `0 22px 40px ${cat.color}33` : '0 1px 2px rgba(21,17,31,.05)',
    }"
    @mouseenter="hover = true"
    @mouseleave="hover = false"
  >
    <!-- colored top bar -->
    <div class="absolute top-0 left-0 right-0" style="height: 6px" :style="{ background: cat.color }" />

    <div class="flex items-start justify-between mt-1.5">
      <span class="kicker" style="opacity: 1" :style="{ color: labelColor }">{{ cat.label }}</span>
      <span
        class="inline-flex items-center justify-center rounded-full flex-none bg-white"
        style="width: 48px; height: 48px; box-shadow: 0 2px 8px rgba(21,17,31,.1)"
        :style="{ outline: `2px solid ${cat.color}`, outlineOffset: '-2px' }"
      >
        <img :src="categoryIcon(cat.key)" alt="" style="width: 27px; height: 27px" />
      </span>
    </div>

    <h3 class="font-body font-bold text-ink" style="font-size: 24px; line-height: 1.1; margin: 16px 0 12px; max-width: 92%">
      {{ opportunity.Nome }}
    </h3>
    <p class="text-ink/66 leading-snug" style="font-size: 14.5px; margin-bottom: 18px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden">
      {{ opportunity.description }}
    </p>

    <div v-if="tags.length" class="flex flex-wrap gap-1.5" style="margin-bottom: 20px">
      <span
        v-for="t in tags"
        :key="t"
        class="rounded-full border border-ink/15 text-ink/70 capitalize"
        style="font-size: 12.5px; font-weight: 500; padding: 5px 12px"
      >{{ t }}</span>
    </div>

    <div class="mt-auto flex items-center justify-between border-t border-ink/8" style="padding-top: 16px">
      <span class="inline-flex items-center gap-2" style="font-size: 13px; font-weight: 500"
            :style="{ color: open ? 'var(--color-teal)' : 'rgba(21,17,31,.45)' }">
        <span class="rounded-full" style="width: 8px; height: 8px"
              :style="{ background: open ? 'var(--color-teal)' : 'rgba(21,17,31,.3)' }" />
        {{ open ? "Inscrições abertas" : "Encerrado" }}
      </span>
      <span class="inline-flex items-center gap-1.5 font-semibold text-ink transition-transform duration-200 ease-brand group-hover:translate-x-1" style="font-size: 14.5px">
        Ver mais <ArrowRight class="w-[17px] h-[17px]" />
      </span>
    </div>
  </NuxtLink>
</template>
