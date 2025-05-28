<template>
  <div
    class="bg-gradient-to-br from-violet-600 via-purple-700 to-fuchsia-800 relative overflow-hidden"
  >
    <!-- Animated Background Elements -->
    <div class="absolute inset-0">
      <!-- Floating particles -->
      <div
        class="absolute top-20 left-10 w-4 h-4 bg-white/20 rounded-full animate-bounce"
        style="animation-delay: 0s"
      ></div>
      <div
        class="absolute top-40 right-20 w-3 h-3 bg-white/30 rounded-full animate-bounce"
        style="animation-delay: 1s"
      ></div>
      <div
        class="absolute bottom-32 left-1/4 w-2 h-2 bg-white/25 rounded-full animate-bounce"
        style="animation-delay: 0.5s"
      ></div>
      <div
        class="absolute bottom-20 right-1/3 w-5 h-5 bg-white/15 rounded-full animate-bounce"
        style="animation-delay: 1.5s"
      ></div>

      <!-- Gradient orbs -->
      <div
        class="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-pink-400/30 to-purple-600/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse"
      ></div>
      <div
        class="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-tl from-blue-400/30 to-indigo-600/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-pulse"
        style="animation-delay: 1s"
      ></div>
      <div
        class="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-violet-400/20 to-fuchsia-600/20 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2 animate-pulse"
        style="animation-delay: 2s"
      ></div>
    </div>
    <div
      class="max-w-7xl mx-auto px-4 sm:px-8 pt-20 pb-16 relative z-10 w-full"
    >
      <!-- Breadcrumb -->
      <nav class="mt-8" data-aos="fade-down">
        <NuxtLink
          to="/oportunidades"
          class="group inline-flex items-center text-white/80 hover:text-white transition-all duration-300 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full hover:bg-white/20"
        >
          <svg
            class="w-4 h-4 mr-2 transform group-hover:-translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            ></path>
          </svg>
          Voltar para oportunidades
        </NuxtLink>
      </nav>
      <!-- Title Section -->
      <div class="hero-title text-center mt-8">
        <div
          class="inline-block bg-gradient-to-r from-white/20 to-white/30 backdrop-blur-sm px-6 py-3 rounded-full text-white text-sm font-semibold mb-6 border border-white/20"
          data-aos="zoom-in"
        >
          <span class="text-yellow-300 font-bold">✨</span>
          {{ typeDisplayName }}
        </div>
        <h1
          class="text-4xl sm:text-5xl lg:text-7xl font-black text-white mb-6 leading-tight"
          data-aos="fade-up"
          data-aos-delay="200"
        >
          {{ opportunity.Nome }}
        </h1>
        <div class="max-w-3xl mx-auto" data-aos="fade-up" data-aos-delay="400">
          <div
            class="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 transition-all duration-700 ease-in-out"
            :class="{ 'shadow-2xl shadow-white/10': showFullText }"
          >
            <div
              class="overflow-hidden transition-all duration-700 ease-in-out"
              :style="{ maxHeight: showFullText ? textHeight + 'px' : '96px' }"
            >
              <p
                ref="textElement"
                class="text-sm md:text-base text-white/95 font-medium leading-relaxed text-center transition-opacity duration-300 ease-in-out"
                :class="clampLine ? 'line-clamp-4' : 'line-clamp-none'"
              >
                {{ opportunity.about }}
              </p>
            </div>
            <!-- Show more/less button if text is long -->
            <div
              v-if="opportunity.about && opportunity.about.length > 200"
              class="transition-all duration-300 ease-in-out"
            >
              <button
                @click="toggleText"
                class="mt-4 text-white/80 hover:text-white text-sm font-medium underline underline-offset-4 hover:underline-offset-2 transition-all duration-300 block mx-auto group"
              >
                <span class="inline-flex items-center">
                  {{ showFullText ? "Mostrar menos" : "Ler mais" }}
                  <svg
                    class="w-4 h-4 ml-1 transition-transform duration-700"
                    :class="{ 'rotate-180': showFullText }"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    ></path>
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </div>

        <!-- CTA Button -->
        <div class="mt-8" data-aos="fade-up" data-aos-delay="600">
          <a
            :href="opportunity.site"
            target="_blank"
            ref="ctaButton"
            class="group inline-flex items-center bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 hover:from-yellow-300 hover:via-orange-400 hover:to-red-400 text-white font-bold px-8 py-4 rounded-2xl shadow-2xl hover:shadow-yellow-500/25 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
          >
            <svg
              class="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              ></path>
            </svg>
            Acessar Oportunidade
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from "vue";

const props = defineProps({
  opportunity: {
    type: Object,
    required: true,
  },
  typeDisplayName: {
    type: String,
    required: true,
  },
});

const showFullText = ref(false);
const textElement = ref(null);
const ctaButton = ref(null);
const textHeight = ref(0);
const clampLine = ref(true);

onMounted(() => {
  // Calculate the full height of the text for smooth animation
  if (textElement.value) {
    // Temporarily set max-height to auto to measure full height
    const originalStyle = textElement.value.style.maxHeight;
    textElement.value.style.maxHeight = "auto";
    textHeight.value = textElement.value.scrollHeight;
    textElement.value.style.maxHeight = originalStyle;
  }
});

const toggleText = async () => {
  showFullText.value = !showFullText.value;
  if (showFullText.value) clampLine.value = false;
  else
    setTimeout(() => {
      clampLine.value = true;
    }, 750);
};
</script>
