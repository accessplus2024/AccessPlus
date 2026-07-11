<script setup>
import { Page, InfoCircle, LightBulb, BookmarkBook } from "@iconoir/vue"

const props = defineProps({
  opportunity: { type: Object, required: true },
  activeTab: { type: String, required: true },
})
const emit = defineEmits(["changeContent"])

const tabs = computed(() => [
  { key: "guide", icon: BookmarkBook, title: "Elegibilidade e guia", sub: "Critérios e processo de aplicação",
    contentTitle: "Elegibilidade e guia de aplicação", text: props.opportunity.guide },
  { key: "process", icon: InfoCircle, title: "Sobre o processo", sub: "Informações do processo seletivo",
    contentTitle: "Sobre o processo", text: props.opportunity.regInfo },
  { key: "tips", icon: LightBulb, title: "Dicas de contemplados", sub: "Experiências de quem foi aprovado",
    contentTitle: "Dicas de contemplados", text: props.opportunity.appTips },
  { key: "additional", icon: Page, title: "Informações adicionais", sub: "Detalhes complementares",
    contentTitle: "Informações adicionais", text: props.opportunity.addInfo },
])
</script>

<template>
  <div class="lg:col-span-5 space-y-2.5">
    <h2 class="mb-6" style="font-size: clamp(28px, 3.5vw, 40px)">Detalhes</h2>
    <button
      v-for="t in tabs"
      :key="t.key"
      class="w-full flex items-center gap-4 text-left transition-all duration-200 ease-brand border"
      :class="activeTab === t.key
        ? 'bg-primary text-white border-primary shadow-md'
        : 'bg-card text-ink border-ink/8 hover:border-primary/40 hover:shadow-sm'"
      style="border-radius: var(--r-card); padding: 20px 22px"
      @click="emit('changeContent', t.contentTitle, t.text, t.key)"
    >
      <span
        class="inline-flex items-center justify-center rounded-xl flex-none"
        style="width: 44px; height: 44px"
        :class="activeTab === t.key ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'"
      >
        <component :is="t.icon" class="w-5 h-5" />
      </span>
      <span class="min-w-0">
        <span class="block font-body font-semibold" style="font-size: 16px">{{ t.title }}</span>
        <span class="block" :class="activeTab === t.key ? 'text-white/80' : 'text-ink/50'" style="font-size: 13px">{{ t.sub }}</span>
      </span>
    </button>
  </div>
</template>
