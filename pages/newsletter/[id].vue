<script setup>
import { onMounted } from "vue";
import AOS from "aos";
import "aos/dist/aos.css";

// Get the post ID from the route
const route = useRoute();
const postId = route.params.id;

// Reactive data
const post = ref(null);
const loading = ref(true);
const error = ref(null);

// Composables
const { fetchPost, formatDate, formatDateForDatetime } = useBeehiiv();

// Computed properties
const publishDate = computed(() => {
  return post.value?.publish_date ? formatDate(post.value.publish_date) : "";
});

const datetimePublishDate = computed(() => {
  return post.value?.publish_date
    ? formatDateForDatetime(post.value.publish_date)
    : "";
});

// Methods
const loadPost = async () => {
  try {
    loading.value = true;
    error.value = null;
    const response = await fetchPost(postId);
    post.value = response.data;

    // Update SEO meta tags
    if (post.value) {
      useHead({
        title: `${post.value.title} - Newsletter Access+`,
        meta: [
          {
            name: "description",
            content: post.value.subtitle || post.value.title,
          },
          { property: "og:title", content: post.value.title },
          {
            property: "og:description",
            content: post.value.subtitle || post.value.title,
          },
          { property: "og:type", content: "article" },
          { property: "og:image", content: post.value.thumbnail_url },
          {
            property: "article:published_time",
            content: datetimePublishDate.value,
          },
          { name: "twitter:card", content: "summary_large_image" },
          { name: "twitter:title", content: post.value.title },
          {
            name: "twitter:description",
            content: post.value.subtitle || post.value.title,
          },
          { name: "twitter:image", content: post.value.thumbnail_url },
        ],
      });
    }
  } catch (err) {
    error.value = "Erro ao carregar o post. Tente novamente mais tarde.";
    console.error("Error loading newsletter post:", err);
  } finally {
    loading.value = false;
  }
};

const sharePost = () => {
  if (navigator.share && post.value) {
    navigator.share({
      title: post.value.title,
      text: post.value.subtitle || post.value.title,
      url: window.location.href,
    });
  } else if (post.value) {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(window.location.href);
  }
};

// SEO and Meta (initial)
useHead({
  title: "Newsletter - Access+",
  meta: [
    { charset: "UTF-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1.0" },
    {
      name: "description",
      content: "Artigo da newsletter Access+ sobre oportunidades educacionais.",
    },
  ],
  htmlAttrs: {
    lang: "pt-br",
  },
  link: [
    {
      rel: "icon",
      type: "image/png",
      href: "/images/estrelinhas.png",
    },
  ],
});

// Lifecycle
onMounted(() => {
  // Initialize AOS
  AOS.init({
    duration: 1000,
    once: true,
  });

  // Load post
  loadPost();
});
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Loading State -->
    <Loading :watch="loading" />

    <!-- Error State -->
    <div v-if="!loading && error" class="container mx-auto px-6 py-20 pt-32">
      <div class="max-w-md mx-auto text-center">
        <div class="text-red-500 text-6xl mb-4">⚠️</div>
        <h1 class="text-2xl font-bold text-gray-800 mb-4">
          Post não encontrado
        </h1>
        <p class="text-gray-600 mb-6">{{ error }}</p>
        <div class="space-y-4">
          <button
            @click="loadPost"
            class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors w-full"
          >
            Tentar novamente
          </button>
          <NuxtLink
            to="/newsletter"
            class="block text-purple-600 hover:text-purple-700 font-medium"
          >
            ← Voltar para Newsletter
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Post Content -->
    <article
      v-if="!loading && !error && post"
      class="bg-white"
      itemscope
      itemtype="https://schema.org/BlogPosting"
    >
      <!-- Header Section with Thumbnail -->
      <header
        class="relative bg-gradient-to-r from-purple-600 to-pink-600 pt-32 pb-4"
      >
        <!-- Header Content -->
        <div class="text-center mt-20" data-aos="fade-up" data-aos-delay="200">
          <!-- Featured Image -->
          <div
            v-if="post.thumbnail_url"
            class="relative -mt-16 mb-16"
            data-aos="fade-up"
            data-aos-delay="400"
          >
            <div class="container mx-auto px-6 max-w-3xl">
              <img
                :src="post.thumbnail_url"
                :alt="post.title"
                class="w-full h-64 md:h-80 object-cover rounded-2xl shadow-2xl"
                itemprop="image"
              />
            </div>
          </div>
        </div>
      </header>

      <!-- Post Content -->
      <main class="container mx-auto px-6 max-w-4xl pb-20">
        <!-- Post Content -->
        <div class="prose prose-lg prose-purple max-w-none" data-aos="fade-up">
          <div
            v-if="post.content?.free?.web"
            v-html="post.content.free.web"
            itemprop="articleBody"
            class="newsletter-content"
          ></div>
          <div v-else class="text-center py-12">
            <p class="text-gray-600">Conteúdo não disponível.</p>
          </div>
        </div>

        <!-- Navigation -->
        <div class="mt-12 flex justify-center" data-aos="fade-up">
          <NuxtLink
            to="/newsletter"
            class="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Ver todos os artigos
          </NuxtLink>
        </div>
      </main>
    </article>
  </div>
</template>

<style scoped>
/* Custom styles for newsletter content */
:deep(.newsletter-content) {
  color: #1f2937;
  line-height: 1.75;
}

:deep(.newsletter-content h1) {
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  margin-top: 2rem;
  margin-bottom: 1rem;
}

:deep(.newsletter-content h2) {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
}

:deep(.newsletter-content h3) {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

:deep(.newsletter-content p) {
  margin-bottom: 1rem;
  color: #374151;
}

:deep(.newsletter-content a) {
  color: #9333ea;
  text-decoration: underline;
}

:deep(.newsletter-content a:hover) {
  color: #7c3aed;
}

:deep(.newsletter-content ul) {
  list-style-type: disc;
  list-style-position: inside;
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

:deep(.newsletter-content ol) {
  list-style-type: decimal;
  list-style-position: inside;
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

:deep(.newsletter-content blockquote) {
  border-left: 4px solid #9333ea;
  padding-left: 1rem;
  font-style: italic;
  color: #4b5563;
  margin: 1.5rem 0;
}

:deep(.newsletter-content img) {
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  margin: 1.5rem 0;
  max-width: 100%;
  height: auto;
}

:deep(.newsletter-content code) {
  background-color: #f3f4f6;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas,
    "Liberation Mono", Menlo, monospace;
}

:deep(.newsletter-content pre) {
  background-color: #111827;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 1rem 0;
}
</style>
