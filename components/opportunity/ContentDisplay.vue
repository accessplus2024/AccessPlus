<script setup>
import { OpenNewWindow } from "@iconoir/vue"
import { getResourceIcon } from "@/utils/resourceIcon"

const props = defineProps({
  contentTitle: { type: String, required: true },
  contentText: { type: [String, Array], required: true },
})

const isResourceList = computed(() => Array.isArray(props.contentText))

const resources = computed(() =>
  isResourceList.value
    ? props.contentText.map((r) => ({ ...r, style: getResourceIcon(r.platform) }))
    : []
)
</script>

<template>
  <div class="lg:col-span-7">
    <div class="bg-card border border-ink/8" style="border-radius: var(--r-card); padding: 36px; min-height: 420px">
      <h3 class="mb-6" style="font-size: clamp(24px, 3vw, 32px)">{{ contentTitle }}</h3>

      <div v-if="isResourceList" class="space-y-3">
        <a
          v-for="(r, i) in resources"
          :key="i"
          :href="r.url"
          target="_blank"
          rel="noopener"
          class="flex items-center gap-4 border border-ink/8 hover:border-primary/40 hover:shadow-sm transition-all duration-200 ease-brand"
          style="border-radius: var(--r-card); padding: 16px 18px"
        >
          <span
            class="inline-flex items-center justify-center rounded-lg flex-none"
            :class="!r.style.color && 'bg-primary/10 text-primary'"
            :style="{
              width: '36px',
              height: '36px',
              ...(r.style.color ? { backgroundColor: r.style.color + '1A', color: r.style.color } : {}),
            }"
          >
            <component :is="r.style.icon" class="w-4 h-4" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block font-body font-semibold text-ink truncate" style="font-size: 15px">{{ r.label }}</span>
            <span class="block text-ink/50 capitalize" style="font-size: 13px">
              {{ r.platform }}<template v-if="r.status === 'a confirmar'"> · a confirmar</template>
            </span>
          </span>
          <OpenNewWindow class="w-[18px] h-[18px] flex-none text-ink/40" />
        </a>
        <p v-if="!resources.length" class="font-body text-ink/80" style="font-size: 16px">Nenhum link disponível.</p>
      </div>

      <div
        v-else
        class="font-body text-ink/80 leading-relaxed whitespace-pre-line"
        style="font-size: 16px; max-width: 70ch"
      >
        {{ contentText || "Nenhuma informação disponível." }}
      </div>
    </div>
  </div>
</template>