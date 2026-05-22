<template>
  <button
    @click="cycleMode"
    class="p-2 rounded-full hover:bg-white/10 transition-colors"
    :title="modeLabel"
  >
    <SunLight v-if="colorMode.value !== 'dark'" class="w-5 h-5" />
    <HalfMoon v-else class="w-5 h-5" />
  </button>
</template>

<script setup>
import { SunLight, HalfMoon } from '@iconoir/vue'

const colorMode = useColorMode()
const modes = ['system', 'light', 'dark']
const modeLabels = { system: 'Tema do sistema', light: 'Tema claro', dark: 'Tema escuro' }
const modeLabel = computed(() => modeLabels[colorMode.preference] || 'Tema do sistema')

const cycleMode = () => {
  const current = modes.indexOf(colorMode.preference)
  colorMode.preference = modes[(current + 1) % modes.length]
}
</script>
