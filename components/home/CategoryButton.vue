<script setup>
import { categoryIcon, categoryIconHover, isLightColor } from "~/utils/categories"

const props = defineProps({
  category: { type: String, required: true },
  icon: { type: String, required: true },
  color: { type: String, required: true },
})

const hover = ref(false)
const light = computed(() => isLightColor(props.color))
const ink = computed(() => (light.value ? "#15111F" : "#FFFFFF"))
</script>

<template>
  <NuxtLink
    to="/oportunidades"
    class="relative flex flex-col justify-between overflow-hidden text-left transition-all duration-300 ease-brand"
    :style="{
      background: color, color: ink, borderRadius: 'var(--r-card)',
      padding: '26px 24px', minHeight: '168px',
      transform: hover ? 'translateY(-6px)' : 'none',
      boxShadow: hover ? `0 20px 38px ${color}55` : 'none',
    }"
    @mouseenter="hover = true"
    @mouseleave="hover = false"
  >
    <span
      class="inline-flex items-center justify-center rounded-full"
      :style="{ width: '64px', height: '64px', background: light ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.9)' }"
    >
      <img :src="hover ? categoryIcon(icon) : categoryIconHover(icon)" alt="" style="width: 44px; height: 44px" />
    </span>
    <div>
      <div class="font-body font-semibold" style="font-size: 18px; line-height: 1.15">{{ category }}</div>
    </div>
  </NuxtLink>
</template>
