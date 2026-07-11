<script setup>
import { Calendar, Compass, GraduationCap, MapPin } from "@iconoir/vue"

const props = defineProps({
  opportunity: { type: Object, required: true },
  category: { type: Object, required: true },
})

const stats = computed(() => [
  { icon: Calendar, label: "Prazo de inscrição", value: props.opportunity.deadline || "A confirmar" },
  { icon: Compass, label: "Área de atuação", value: (props.opportunity.areas || []).join(", ") || "Diversas" },
  { icon: GraduationCap, label: "Nível", value: (props.opportunity.level || []).join(", ") || "Todos" },
  { icon: MapPin, label: "Localização", value: props.opportunity.location || "A confirmar" },
])
</script>

<template>
  <div class="bg-card border border-ink/8 grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-ink/8"
       style="border-radius: var(--r-card); overflow: hidden">
    <div v-for="s in stats" :key="s.label" class="flex items-center gap-4" style="padding: 26px 28px">
      <span class="inline-flex items-center justify-center rounded-full flex-none"
            style="width: 48px; height: 48px" :style="{ background: `${category.color}1f`, color: category.color }">
        <component :is="s.icon" class="w-6 h-6" />
      </span>
      <div class="min-w-0">
        <p class="text-ink/55 font-medium" style="font-size: 12px; letter-spacing: .06em; text-transform: uppercase">{{ s.label }}</p>
        <p class="font-body font-bold text-ink mt-0.5 truncate" style="font-size: 17px">{{ s.value }}</p>
      </div>
    </div>
  </div>
</template>
