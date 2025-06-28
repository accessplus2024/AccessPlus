<script setup>
const props = defineProps({
  post: {
    type: Object,
    required: true,
  },
});

const { formatDate, formatDateForDatetime, truncateContent } = useBeehiiv();
</script>

<template>
  <article
    class="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-300"
    itemscope
    itemtype="https://schema.org/BlogPosting"
  >
    <!-- Featured Image -->
    <div class="relative">
      <img
        :src="
          post.thumbnail_url ||
          'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&h=300&fit=crop&crop=entropy&auto=format&q=80'
        "
        :alt="post.title"
        class="w-full h-48 object-cover"
        loading="lazy"
        @error="handleImageError"
        itemprop="image"
      />
      <div class="absolute top-4 left-4">
        <span
          class="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium"
        >
          Newsletter
        </span>
      </div>
    </div>

    <!-- Content -->
    <div class="p-6">
      <!-- Date -->
      <div class="flex items-center text-sm text-gray-500 mb-3">
        <time
          :datetime="formatDateForDatetime(post.publish_date)"
          itemprop="datePublished"
        >
          {{ formatDate(post.publish_date) }}
        </time>
      </div>

      <!-- Title -->
      <h3
        class="text-xl font-bold text-gray-800 mb-3 line-clamp-2"
        itemprop="headline"
      >
        {{ post.title }}
      </h3>

      <!-- Subtitle/Description -->
      <p class="text-gray-600 mb-4 line-clamp-3" itemprop="description">
        {{ truncateContent(post.subtitle || post.content, 120) }}
      </p>

      <!-- Read More Button -->
      <div class="flex items-center justify-between">
        <NuxtLink
          :to="`/newsletter/${post.id}`"
          class="inline-flex items-center gap-2 text-purple-600 font-semibold hover:text-purple-700 transition-colors"
          itemprop="url"
        >
          Ler artigo
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </NuxtLink>

        <!-- Share Button (optional) -->
        <button
          @click="sharePost"
          class="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          :title="`Compartilhar: ${post.title}`"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Hidden structured data -->
    <div style="display: none">
      <span
        itemprop="author"
        itemscope
        itemtype="https://schema.org/Organization"
      >
        <span itemprop="name">Access+</span>
      </span>
      <span
        itemprop="publisher"
        itemscope
        itemtype="https://schema.org/Organization"
      >
        <span itemprop="name">Access+</span>
      </span>
    </div>
  </article>
</template>

<script>
export default {
  methods: {
    sharePost() {
      const postUrl = `${window.location.origin}/newsletter/${this.post.id}`;

      if (navigator.share) {
        navigator.share({
          title: this.post.title,
          text:
            this.post.subtitle || this.truncateContent(this.post.content, 120),
          url: postUrl,
        });
      } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(postUrl);
        // You could add a toast notification here
      }
    },
    handleImageError(event) {
      // Fallback to a default newsletter image if the thumbnail fails to load
      event.target.src =
        "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&h=300&fit=crop&crop=entropy&auto=format&q=80";
    },
  },
};
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
