<template>
  <div class="lg:col-span-7" data-aos="fade-right">
    <div class="hero-image relative group">
      <div
        class="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 rounded-3xl transform rotate-3 group-hover:rotate-6 transition-transform duration-500"
      ></div>
      <div class="relative bg-white p-3 rounded-3xl shadow-2xl">
        <img
          :src="opportunity.image || 'https://placehold.co/625x400'"
          alt="Opportunity image"
          class="w-full h-80 sm:h-96 object-cover rounded-2xl"
        />
        <div
          class="absolute inset-3 bg-gradient-to-t from-black/30 via-transparent to-transparent rounded-2xl"
        ></div>

        <!-- Floating Action Button -->
        <div class="absolute top-6 right-6">
          <a
            :href="opportunity.site"
            target="_blank"
            class="bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group/btn"
          >
            <svg
              class="w-5 h-5 text-violet-600 group-hover/btn:text-violet-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              ></path>
            </svg>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  opportunity: {
    type: Object,
    required: true,
  },
});
</script>
