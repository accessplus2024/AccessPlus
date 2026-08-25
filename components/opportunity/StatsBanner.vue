<script setup>
import { Calendar, Compass, GraduationCap, MapPin, Language, Laptop } from "@iconoir/vue"

const props = defineProps({
  opportunity: { type: Object, required: true },
  category: { type: Object, required: true },
})

// Schema novo (2026-08-24): `inscricoes` diz se dá pra se inscrever hoje;
// `format` e `language` passaram a ter 100% de cobertura depois da
// reanotação e por isso viraram informação de primeira linha aqui.
const aberta = computed(() => {
  const v = props.opportunity.inscricoes ?? (props.opportunity.status === "Encerrada" ? "Encerrada" : "Aberta")
  return v === "Aberta"
})

// O prazo é a informação de maior custo pro aluno quando falta (62 linhas
// abertas sem prazo, medido em lab/gaps-banco.mjs). Quando as inscrições já
// fecharam, dizer isso importa mais do que repetir uma data vencida.
const prazo = computed(() => {
  if (!aberta.value) return "Inscrições encerradas"
  return props.opportunity.deadline || "A confirmar"
})

const stats = computed(() => [
  { icon: Calendar, label: "Prazo de inscrição", value: prazo.value },
  { icon: Compass, label: "Área de atuação", value: (props.opportunity.areas || []).join(", ") || "Diversas" },
  { icon: GraduationCap, label: "Nível", value: (props.opportunity.level || []).join(", ") || "Todos" },
  { icon: MapPin, label: "Localização", value: props.opportunity.location || "A confirmar" },
  { icon: Laptop, label: "Formato", value: props.opportunity.format || "A confirmar" },
  { icon: Language, label: "Idioma", value: props.opportunity.language || "A confirmar" },
])
</script>

<template>
  <div class="border border-ink/8 grid grid-cols-1 md:grid-cols-3 gap-px bg-ink/8"
       style="border-radius: var(--r-card); overflow: hidden">
    <div v-for="s in stats" :key="s.label" class="flex items-center gap-4 bg-card" style="padding: 26px 28px">
      <span class="inline-flex items-center justify-center rounded-full flex-none"
            style="width: 48px; height: 48px" :style="{ background: `${category.color}1f`, color: category.color }">
        <component :is="s.icon" class="w-6 h-6" />
      </span>
      <div class="flex flex-wrap gap-4 items-start">
        <div class="min-w-0">
        <p class="text-ink/55 font-medium" style="font-size: 12px; letter-spacing: .06em; text-transform: uppercase">
          {{ s.label }}
        </p>
        <p class="font-body font-bold text-ink mt-0.5 leading-tight" style="font-size: 17px">
          {{ s.value }}
        </p>
        </div>
      </div>
    </div>
  </div>
</template>
