<script setup>
import { ArrowRight } from "@iconoir/vue"

const props = defineProps({
  post: { type: Object, required: true },
  accent: { type: String, default: "var(--color-primary)" },
})

const { formatDate, formatDateForDatetime, truncateContent } = useBeehiiv()
</script>

<template>
  <NuxtLink
    :to="`/newsletter/${post.id}`"
    class="group flex flex-col h-full bg-card overflow-hidden border border-ink/8 transition-all duration-300 ease-brand hover:-translate-y-1.5 hover:shadow-lg"
    style="border-radius: var(--r-card)"
    itemscope
    itemtype="https://schema.org/BlogPosting"
  >
    <!-- Color accent bar -->
    <div class="h-1 w-full flex-shrink-0" :style="{ background: accent }" />

    <!-- Content -->
    <div class="flex flex-col flex-1" style="padding: 28px 28px 26px">
      <!-- Date -->
      <span
        class="inline-flex items-center gap-2 mb-4"
        style="font-size: 12px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; opacity: .45"
      >
        <span class="rounded-full flex-shrink-0" style="width: 6px; height: 6px; background: var(--color-cyan)" />
        <time :datetime="formatDateForDatetime(post.publish_date)" itemprop="datePublished">
          {{ formatDate(post.publish_date) }}
        </time>
      </span>

      <!-- Title -->
      <h3
        class="font-body font-bold text-ink line-clamp-3"
        style="font-size: 20px; line-height: 1.2; margin-bottom: 14px"
        itemprop="headline"
      >
        {{ post.title }}
      </h3>

      <!-- Excerpt -->
      <p
        class="text-ink/60 line-clamp-3 leading-relaxed"
        style="font-size: 14px; margin-bottom: 22px"
        itemprop="description"
      >
        {{ truncateContent(post.subtitle || post.content, 140) }}
      </p>

      <!-- CTA -->
      <span class="mt-auto inline-flex items-center gap-1.5 font-semibold text-primary" style="font-size: 14px">
        Ler post
        <ArrowRight class="w-4 h-4 transition-transform duration-200 ease-brand group-hover:translate-x-1" />
      </span>
    </div>
  </NuxtLink>
</template>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
