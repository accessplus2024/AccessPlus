<template>
  <div class="lg:col-span-8">
    <div
      class="bg-surface rounded-3xl p-10 shadow-xl border border-text/10 min-h-[500px] relative overflow-hidden"
    >
      <!-- Background decoration -->
      <div
        class="bg-primary/5 rounded-full -translate-y-16 translate-x-16 absolute top-0 right-0 w-32 h-32 opacity-50"
      ></div>
      <div
        class="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-violet-50 to-fuchsia-50 rounded-full translate-y-12 -translate-x-12 opacity-50"
      ></div>
      <div class="relative z-10">
        <div
          class="flex items-center mb-8 transition-all duration-300 ease-in-out"
        >
          <div
            class="w-2 h-12 bg-primary rounded-full mr-6 transition-all duration-300 ease-in-out"
          ></div>
          <div>
            <h3
              class="font-display text-3xl font-bold text-text mb-2 transition-all duration-300 ease-in-out"
              :class="isContentVisible ? 'opacity-100' : 'opacity-0 '"
            >
              {{ displayTitle }}
            </h3>
          </div>
        </div>
        <div class="prose prose-lg max-w-none">
          <div
            class="bg-bg rounded-2xl p-8 shadow-sm border border-text/10 transition-all duration-300 ease-in-out"
            :class="
              isContentVisible ? 'opacity-100 scale-100' : 'opacity-90 scale-98'
            "
          >
            <div
              class="font-body text-text leading-relaxed text-base whitespace-pre-line transition-all duration-300 ease-in-out"
              :class="isContentVisible ? 'opacity-100' : 'opacity-0'"
            >
              {{ displayText || "Nenhuma informação disponível." }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  contentTitle: {
    type: String,
    required: true,
  },
  contentText: {
    type: String,
    required: true,
  },
});

const isContentVisible = ref(false);
const displayTitle = ref("");
const displayText = ref("");

// Watch for content changes and trigger animations
watch(
  [() => props.contentTitle, () => props.contentText],
  async (newValues, oldValues) => {
    // If this is the initial load
    if (!oldValues || (oldValues[0] === "" && oldValues[1] === "")) {
      displayTitle.value = props.contentTitle;
      displayText.value = props.contentText;
      isContentVisible.value = true;
      return;
    }

    // Fade out with old content still visible
    isContentVisible.value = false;

    // Wait for fade out to complete, then update content
    setTimeout(() => {
      displayTitle.value = props.contentTitle;
      displayText.value = props.contentText;
    }, 150);

    // Then fade in with new content
    setTimeout(() => {
      isContentVisible.value = true;
    }, 200);
  },
  { immediate: true }
);
</script>
