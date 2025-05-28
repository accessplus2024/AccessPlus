<template>
  <div class="lg:col-span-8">
    <div
      class="bg-white rounded-3xl p-10 shadow-xl border border-gray-200 min-h-[500px] relative overflow-hidden"
    >
      <!-- Background decoration -->
      <div
        class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full -translate-y-16 translate-x-16 opacity-50"
      ></div>
      <div
        class="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-violet-50 to-fuchsia-50 rounded-full translate-y-12 -translate-x-12 opacity-50"
      ></div>

      <div class="relative z-10">
        <div class="flex items-center mb-8">
          <div
            class="w-2 h-12 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full mr-6"
          ></div>
          <div>
            <h3 class="text-3xl font-bold text-gray-800 mb-2">
              {{ contentTitle }}
            </h3>
          </div>
        </div>
        <div class="prose prose-lg max-w-none">
          <div
            class="bg-gray-50 rounded-2xl p-8 shadow-sm border border-gray-200"
          >
            <div
              class="text-gray-800 leading-relaxed text-lg whitespace-pre-line"
            >
              {{ contentText || "Nenhuma informação disponível." }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
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
</script>
