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
  script: [
    {
      src: "https://subscribe-forms.beehiiv.com/embed.js",
      async: true,
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
    <NewsletterHeaderSection />

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-8 py-20">
      <!-- Loading State -->
      <Loading :watch="loading" />

      <!-- Error State -->
      <div v-if="!loading && error" class="text-center py-20">
        <div
          class="bg-white rounded-3xl p-8 shadow-xl border border-gray-200 max-w-md mx-auto"
        >
          <div class="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 class="text-2xl font-bold text-gray-800 mb-4">
            Ops! Algo deu errado
          </h2>
          <p class="text-gray-600 mb-6">{{ error }}</p>
          <button
            @click="loadPosts"
            class="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-2xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
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
            Últimos <span class="font-medium">posts</span>
          </h2>
          <p class="text-gray-600 max-w-2xl mx-auto">
            Conteúdo que pode transformar sua jornada educacional.
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
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16"
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
            class="flex justify-center items-center gap-3"
            data-aos="fade-up"
          >
            <!-- Previous Button -->
            <button
              @click="goToPage(currentPage - 1)"
              :disabled="currentPage === 1"
              class="px-6 py-3 text-sm font-semibold text-gray-500 bg-white border border-gray-300 rounded-2xl hover:bg-gray-50 hover:border-purple-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
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
                  'px-4 py-3 text-sm font-semibold rounded-2xl transition-all duration-300',
                  page === currentPage
                    ? 'text-white bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg'
                    : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:border-purple-300',
                ]"
              >
                {{ page }}
              </button>
              <span
                v-else-if="page === currentPage - 3 || page === currentPage + 3"
                class="px-2 py-3 text-sm text-gray-400"
              >
                ...
              </span>
            </template>

            <!-- Next Button -->
            <button
              @click="goToPage(currentPage + 1)"
              :disabled="currentPage === totalPages"
              class="px-6 py-3 text-sm font-semibold text-gray-500 bg-white border border-gray-300 rounded-2xl hover:bg-gray-50 hover:border-purple-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              Próximo
            </button>
          </div>
        </div>
      </div>

      <!-- Newsletter Subscription CTA -->
      <section
        id="newsletter-subscription"
        class="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-8 md:p-12 mt-20 shadow-xl"
        data-aos="fade-up"
      >
        <div class="text-center mb-8">
          <h3 class="text-2xl md:text-3xl font-bold text-white mb-4">
            Não perca nenhuma novidade!
          </h3>
          <p class="text-white/90 mb-8 max-w-2xl mx-auto">
            Inscreva-se na nossa newsletter e receba semanalmente as melhores
            oportunidades e dicas para turbinar sua jornada educacional.
          </p>
        </div>

        <!-- Beehiiv Subscription Form -->
        <iframe
          src="https://subscribe-forms.beehiiv.com/012188af-07b0-4875-8457-3a74a9faadc7"
          class="w-[400px] mx-auto rounded-l h-20 max-h-20"
          data-test-id="beehiiv-embed"
          frameborder="0"
          scrolling="no"
          loading="lazy"
        ></iframe>
      </section>
    </main>
  </div>
</template>

<style scoped>
/* Additional custom styles if needed */
#beehiiv-subscribe-form {
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
</style>
