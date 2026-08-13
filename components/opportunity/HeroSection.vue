<script setup>
import { ref } from "vue"
import { NavArrowLeft } from "@iconoir/vue"
import { categoryIcon, isLightColor } from "~/utils/categories"

const props = defineProps({
  opportunity: { type: Object, required: true },
  category: { type: Object, required: true },
})

const onColor = computed(() => (isLightColor(props.category.color) ? "#15111F" : "#FFFFFF"))
const showFullText = ref(false)
const longAbout = computed(() => (props.opportunity.description || "").length > 220)
</script>

<template>
  <header
    class="relative overflow-hidden text-[color:var(--on)]"
    :style="{ '--on': onColor, background: category.color, paddingTop: '108px' }"
  >
    <div class="wrap relative" style="padding-top: 24px; padding-bottom: 56px">
      <NuxtLink
        to="/oportunidades"
        class="inline-flex items-center gap-2 rounded-full px-4 py-2 font-medium transition-colors"
        :style="{ background: isLightColor(category.color) ? 'rgba(21,17,31,.08)' : 'rgba(255,255,255,.15)', color: onColor }"
      >
        <NavArrowLeft class="w-4 h-4" /> Voltar para oportunidades
      </NuxtLink>

      <div class="flex items-center gap-3 mt-10">
        <span class="inline-flex items-center justify-center rounded-full bg-white/90" style="width: 54px; height: 54px">
          <img :src="categoryIcon(category.key)" alt="" style="width: 30px; height: 30px" />
        </span>
        <span class="kicker" style="opacity: 1" :style="{ color: onColor }">{{ category.label }}</span>
      </div>

      <h1 class="mt-5" style="font-size: clamp(34px, 5.5vw, 72px); max-width: 18ch; text-wrap: balance">
        {{ opportunity.title }}
      </h1>

      <p
        v-if="opportunity.description"
        class="mt-6 leading-relaxed"
        :class="{ 'line-clamp-4': !showFullText }"
        :style="{ maxWidth: '70ch', fontSize: '17px', opacity: .92 }"
      >
        {{ opportunity.description }}
      </p>
      <button
        v-if="longAbout"
        class="mt-3 underline underline-offset-4 font-medium"
        :style="{ color: onColor, fontSize: '14px' }"
        @click="showFullText = !showFullText"
      >
        {{ showFullText ? "Mostrar menos" : "Ler mais" }}
      </button>
    </div>
  </header>
</template>

<style scoped>
.line-clamp-4 {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
