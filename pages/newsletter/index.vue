<script setup>
import { onMounted } from "vue";
import { NavArrowLeft, NavArrowRight } from "@iconoir/vue";

// SEO and Meta
useHead({
  title: "Newsletter",
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
  link: [{ rel: "icon", href: "/favicon.ico" }],
  script: [
    {
      src: "https://subscribe-forms.beehiiv.com/embed.js",
      async: true,
    },
  ],
});

const ACCENTS = [
  "var(--color-primary)",
  "var(--color-magenta)",
  "var(--color-lime)",
  "var(--color-cyan)",
  "var(--color-red)",
  "var(--color-amber)",
  "var(--color-teal)",
  "var(--color-purple)",
]

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
  loadPosts();
});
</script>

<template>
  <div class="min-h-screen bg-paper">
    <!-- Header Section -->
    <NewsletterHeaderSection />

    <!-- Main Content -->
    <main class="wrap" style="padding-top: 64px">
      <!-- Loading State -->
      <Loading :watch="loading" />

      <!-- Error State -->
      <div v-if="!loading && error" class="text-center" style="padding: 60px 0">
        <div class="bg-card border border-ink/8 mx-auto" style="border-radius: var(--r-lg); padding: 40px; max-width: 28rem">
          <h2 class="font-body font-bold text-ink mb-3" style="font-size: 22px">Ops! Algo deu errado</h2>
          <p class="text-ink/65 mb-6">{{ error }}</p>
          <button @click="loadPosts" class="btn btn-ink mx-auto">Tentar novamente</button>
        </div>
      </div>

      <!-- Posts Grid -->
      <div v-if="!loading && !error" id="newsletter-posts">
        <!-- Section Header -->
        <div class="mb-[42px]">
          <span class="kicker">Arquivo</span>
          <h2 class="mt-3.5" style="font-size: clamp(34px, 4.5vw, 56px)">
            Últimos <span class="font-body font-light italic">posts</span>
          </h2>
        </div>

        <!-- Empty State -->
        <div v-if="posts.length === 0" class="text-center text-ink/55" style="padding: 60px 0">
          <h3 class="font-body font-bold text-ink mb-2" style="font-size: 22px">Nenhum post encontrado</h3>
          <p>Em breve teremos novos conteúdos para você!</p>
        </div>

        <!-- Posts Grid -->
        <div v-else>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
            <div
              v-for="(post, index) in paginatedPosts"
              :key="post.id"
              :data-aos="'fade-up'"
              :data-aos-delay="index * 100"
            >
              <NewsletterCard :post="post" :accent="ACCENTS[index % ACCENTS.length]" />
            </div>
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="flex flex-wrap justify-center items-center gap-2">
            <button
              @click="goToPage(currentPage - 1)"
              :disabled="currentPage === 1"
              aria-label="Página anterior"
              class="w-11 h-11 inline-flex items-center justify-center rounded-full border border-ink/15 text-ink hover:bg-ink hover:text-paper transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink"
            >
              <NavArrowLeft class="w-5 h-5" />
            </button>

            <template v-for="page in totalPages" :key="page">
              <button
                v-if="page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2"
                @click="goToPage(page)"
                class="min-w-11 h-11 px-3 inline-flex items-center justify-center rounded-full font-body font-medium transition-colors"
                :class="page === currentPage ? 'bg-primary text-white' : 'text-ink/70 hover:bg-ink/5'"
                style="font-size: 15px"
              >
                {{ page }}
              </button>
              <span
                v-else-if="page === currentPage - 3 || page === currentPage + 3"
                class="px-1 text-ink/40"
              >…</span>
            </template>

            <button
              @click="goToPage(currentPage + 1)"
              :disabled="currentPage === totalPages"
              aria-label="Próxima página"
              class="w-11 h-11 inline-flex items-center justify-center rounded-full border border-ink/15 text-ink hover:bg-ink hover:text-paper transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink"
            >
              <NavArrowRight class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </main>
    <NewsletterCta />
  </div>
</template>

<style scoped>
/* Additional custom styles if needed */
#beehiiv-subscribe-form {
  width: 100%;
  margin: 30px auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
</style>
