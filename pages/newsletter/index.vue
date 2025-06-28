<script setup>
import { onMounted } from "vue";
import AOS from "aos";
import "aos/dist/aos.css";

// SEO and Meta
useHead({
  title: "Newsletter - Access+",
  meta: [
    { charset: "UTF-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1.0" },
    {
      name: "description",
      content:
        "Fique por dentro das últimas novidades sobre oportunidades educacionais. Newsletter gratuita da Access+ com dicas, insights e oportunidades para jovens.",
    },
    { property: "og:title", content: "Newsletter - Access+" },
    {
      property: "og:description",
      content:
        "Fique por dentro das últimas novidades sobre oportunidades educacionais. Newsletter gratuita da Access+ com dicas, insights e oportunidades para jovens.",
    },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
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

// Reactive data
const posts = ref([]);
const loading = ref(true);
const error = ref(null);
const currentPage = ref(1);
const postsPerPage = 9;

// Composables
const { fetchPosts } = useBeehiiv();

// Computed properties
const totalPosts = computed(() => posts.value?.length || 0);
const totalPages = computed(() => Math.ceil(totalPosts.value / postsPerPage));
const paginatedPosts = computed(() => {
  const start = (currentPage.value - 1) * postsPerPage;
  const end = start + postsPerPage;
  return posts.value?.slice(start, end) || [];
});

// Methods
const loadPosts = async () => {
  try {
    loading.value = true;
    error.value = null;
    const response = await fetchPosts();
    posts.value = response.data || [];
  } catch (err) {
    error.value =
      "Erro ao carregar os posts da newsletter. Tente novamente mais tarde.";
    console.error("Error loading newsletter posts:", err);
  } finally {
    loading.value = false;
  }
};

const goToPage = (page) => {
  currentPage.value = page;
  // Scroll to top of posts section
  document.getElementById("newsletter-posts")?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
};

// Lifecycle
onMounted(() => {
  // Initialize AOS
  AOS.init({
    duration: 1000,
    once: true,
  });

  // Load posts
  loadPosts();
});
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header Section -->
    <NewsletterHeaderSection :total-posts="totalPosts" />

    <!-- Main Content -->
    <main class="container mx-auto px-6 py-16 max-w-7xl">
      <!-- Loading State -->
      <Loading :watch="loading" />

      <!-- Error State -->
      <div v-if="!loading && error" class="text-center py-20">
        <div class="max-w-md mx-auto">
          <div class="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 class="text-2xl font-bold text-gray-800 mb-4">
            Ops! Algo deu errado
          </h2>
          <p class="text-gray-600 mb-6">{{ error }}</p>
          <button
            @click="loadPosts"
            class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>

      <!-- Posts Grid -->
      <div v-if="!loading && !error" id="newsletter-posts">
        <!-- Section Header -->
        <div class="text-center mb-12" data-aos="fade-up">
          <h2 class="text-3xl md:text-4xl font-bold text-[#140E3F] mb-4">
            Últimos <span class="font-medium">Artigos</span>
          </h2>
          <p class="text-gray-600 max-w-2xl mx-auto">
            Descubra insights, dicas e oportunidades que podem transformar sua
            jornada educacional.
          </p>
        </div>

        <!-- Empty State -->
        <div v-if="posts.length === 0" class="text-center py-20">
          <div class="text-6xl mb-4">📰</div>
          <h3 class="text-2xl font-bold text-gray-800 mb-4">
            Nenhum post encontrado
          </h3>
          <p class="text-gray-600">
            Em breve teremos novos conteúdos para você!
          </p>
        </div>

        <!-- Posts Grid -->
        <div v-else>
          <div
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12"
          >
            <div
              v-for="(post, index) in paginatedPosts"
              :key="post.id"
              :data-aos="'fade-up'"
              :data-aos-delay="index * 100"
            >
              <NewsletterCard :post="post" />
            </div>
          </div>

          <!-- Pagination -->
          <div
            v-if="totalPages > 1"
            class="flex justify-center items-center gap-2"
            data-aos="fade-up"
          >
            <!-- Previous Button -->
            <button
              @click="goToPage(currentPage - 1)"
              :disabled="currentPage === 1"
              class="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>

            <!-- Page Numbers -->
            <template v-for="page in totalPages" :key="page">
              <button
                v-if="
                  page === 1 ||
                  page === totalPages ||
                  Math.abs(page - currentPage) <= 2
                "
                @click="goToPage(page)"
                :class="[
                  'px-4 py-2 text-sm font-medium rounded-lg',
                  page === currentPage
                    ? 'text-white bg-purple-600 border border-purple-600'
                    : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50',
                ]"
              >
                {{ page }}
              </button>
              <span
                v-else-if="page === currentPage - 3 || page === currentPage + 3"
                class="px-2 py-2 text-sm text-gray-400"
              >
                ...
              </span>
            </template>

            <!-- Next Button -->
            <button
              @click="goToPage(currentPage + 1)"
              :disabled="currentPage === totalPages"
              class="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próximo
            </button>
          </div>
        </div>
      </div>

      <!-- Newsletter Subscription CTA -->
      <section
        class="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 md:p-12 mt-20"
        data-aos="fade-up"
      >
        <div class="text-center">
          <h3 class="text-2xl md:text-3xl font-bold text-white mb-4">
            Não perca nenhuma novidade!
          </h3>
          <p class="text-white/90 mb-8 max-w-2xl mx-auto">
            Inscreva-se na nossa newsletter e receba semanalmente as melhores
            oportunidades e dicas para turbinar sua jornada educacional.
          </p>
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 bg-white text-purple-600 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Inscrever-se gratuitamente
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
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </a>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
/* Additional custom styles if needed */
</style>
