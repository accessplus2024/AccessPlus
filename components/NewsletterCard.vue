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
    class="group bg-white rounded-3xl overflow-hidden border border-gray-200 hover:shadow-xl hover:border-purple-200 transition-all duration-300 hover:scale-105"
    itemscope
    itemtype="https://schema.org/BlogPosting"
  >
    <!-- Featured Image -->
    <div class="relative overflow-hidden">
      <img
        :src="
          post.thumbnail_url ||
          'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&h=300&fit=crop&crop=entropy&auto=format&q=80'
        "
        :alt="post.title"
        class="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
        loading="lazy"
        @error="handleImageError"
        itemprop="image"
      />

      <!-- Gradient overlay -->
      <div
        class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      ></div>
    </div>

    <!-- Content -->
    <div class="p-8">
      <!-- Date -->
      <div class="flex items-center text-sm text-gray-500 mb-4">
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 bg-purple-500 rounded-full"></div>
          <time
            :datetime="formatDateForDatetime(post.publish_date)"
            itemprop="datePublished"
          >
            {{ formatDate(post.publish_date) }}
          </time>
        </div>
      </div>

      <!-- Title -->
      <h3
        class="text-xl font-bold text-gray-800 mb-4 line-clamp-2 group-hover:text-purple-700 transition-colors"
        itemprop="headline"
      >
        {{ post.title }}
      </h3>

      <!-- Subtitle/Description -->
      <p
        class="text-gray-600 mb-6 line-clamp-3 leading-relaxed"
        itemprop="description"
      >
        {{ truncateContent(post.subtitle || post.content, 120) }}
      </p>

      <!-- Read More Button -->
      <div class="flex items-center justify-between">
        <NuxtLink
          :to="`/newsletter/${post.id}`"
          class="group/btn inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
          itemprop="url"
        >
          Ler post
          <svg
            class="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform"
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
