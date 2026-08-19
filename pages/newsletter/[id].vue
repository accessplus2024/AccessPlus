<script setup>
import { NavArrowLeft } from "@iconoir/vue"
import DOMPurify from "isomorphic-dompurify"

const route = useRoute()
const postId = route.params.id

const post = ref(null)
const loading = ref(true)
const error = ref(null)

const { fetchPost, formatDate, formatDateForDatetime } = useBeehiiv()

const publishDate = computed(() =>
  post.value?.publish_date ? formatDate(post.value.publish_date) : "")
const datetimePublishDate = computed(() =>
  post.value?.publish_date ? formatDateForDatetime(post.value.publish_date) : "")

// O HTML do post vem da API do Beehiiv (fonte externa) — sanitizamos antes de
// injetar com v-html, como defesa em profundidade caso essa conta seja
// comprometida ou algum conteúdo problemático seja publicado por engano.
const sanitizedContent = computed(() => {
  const html = post.value?.content?.free?.web
  return html ? DOMPurify.sanitize(html) : ""
})

const loadPost = async () => {
  try {
    loading.value = true
    error.value = null
    const response = await fetchPost(postId)
    post.value = response.data

    if (post.value) {
      useHead({
        title: `${post.value.title} — Newsletter Access+`,
        meta: [
          { name: "description", content: post.value.subtitle || post.value.title },
          { property: "og:title", content: post.value.title },
          { property: "og:description", content: post.value.subtitle || post.value.title },
          { property: "og:type", content: "article" },
          { property: "og:image", content: post.value.thumbnail_url },
          { property: "article:published_time", content: datetimePublishDate.value },
          { name: "twitter:card", content: "summary_large_image" },
          { name: "twitter:title", content: post.value.title },
          { name: "twitter:description", content: post.value.subtitle || post.value.title },
          { name: "twitter:image", content: post.value.thumbnail_url },
        ],
      })
    }
  } catch (err) {
    error.value = "Erro ao carregar o post. Tente novamente mais tarde."
    console.error("Error loading newsletter post:", err)
  } finally {
    loading.value = false
  }
}

useHead({
  title: "Newsletter — Access+",
  meta: [
    { charset: "UTF-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1.0" },
    { name: "description", content: "Artigo da newsletter Access+ sobre oportunidades educacionais." },
  ],
  htmlAttrs: { lang: "pt-br" },
  link: [{ rel: "icon", href: "/favicon.ico" }],
})

onMounted(loadPost)
</script>

<template>
  <div class="min-h-screen bg-paper">
    <Loading :watch="loading" />

    <!-- Error State -->
    <div v-if="!loading && error" class="wrap" style="padding-top: 132px; padding-bottom: 60px">
      <div class="mx-auto text-center bg-card border border-ink/8" style="max-width: 28rem; border-radius: var(--r-lg); padding: 40px">
        <h1 class="font-body font-bold text-ink mb-3" style="font-size: 22px">Post não encontrado</h1>
        <p class="text-ink/65 mb-6">{{ error }}</p>
        <button @click="loadPost" class="btn btn-ink w-full">Tentar novamente</button>
        <NuxtLink to="/newsletter" class="block mt-4 text-primary font-medium">Voltar para a newsletter</NuxtLink>
      </div>
    </div>

    <!-- Post Content -->
    <article
      v-if="!loading && !error && post"
      itemscope
      itemtype="https://schema.org/BlogPosting"
    >
      <!-- Header -->
      <header class="relative overflow-hidden" style="padding-top: 108px">
        <div class="wrap" style="padding-top: 24px">
          <div style="max-width: 820px">
            <NuxtLink to="/newsletter" class="inline-flex items-center gap-2 rounded-full bg-ink/[.06] hover:bg-ink/10 text-ink/80 px-4 py-2 font-medium transition-colors">
              <NavArrowLeft class="w-4 h-4" /> Voltar para a newsletter
            </NuxtLink>
            <div class="flex items-center gap-3 mt-8 text-ink/55" style="font-size: 14px">
              <time :datetime="datetimePublishDate" itemprop="datePublished">{{ publishDate }}</time>
              <span class="rounded-full bg-ink/30" style="width: 4px; height: 4px" />
              <span>Equipe Access+</span>
            </div>
            <h1 class="mt-4" style="font-size: clamp(32px, 5vw, 64px); text-wrap: balance" itemprop="headline">
              {{ post.title }}
            </h1>
          </div>
        </div>
        <div v-if="post.thumbnail_url" class="wrap mt-10">
          <img
            :src="post.thumbnail_url"
            :alt="post.title"
            class="w-full object-cover border border-ink/8"
            style="max-height: 440px; border-radius: var(--r-lg)"
            itemprop="image"
          />
        </div>
      </header>

      <!-- Body -->
      <main class="wrap" style="padding-top: 48px; padding-bottom: 40px">
        <div class="mx-auto bg-card border border-ink/8" style="max-width: 760px; border-radius: var(--r-lg); padding: 40px">
          <div
            v-if="sanitizedContent"
            v-html="sanitizedContent"
            itemprop="articleBody"
            class="newsletter-content"
          ></div>
          <div v-else class="text-center text-ink/55" style="padding: 48px 0">
            <p>Conteúdo não disponível.</p>
          </div>
        </div>

        <div class="mt-10 flex justify-center">
          <NuxtLink to="/newsletter" class="btn btn-out">
            <NavArrowLeft class="w-[18px] h-[18px]" /> Ver todos os posts
          </NuxtLink>
        </div>
      </main>
    </article>
  </div>
</template>

<style scoped>
:deep(.newsletter-content) {
  color: var(--color-ink);
  line-height: 1.75;
  font-family: 'Poppins', sans-serif;
  font-size: 16px;
  max-width: 70ch;
}
:deep(.newsletter-content h1),
:deep(.newsletter-content h2),
:deep(.newsletter-content h3) {
  font-family: 'FuturaStd', 'Poppins', sans-serif;
  color: var(--color-ink);
  letter-spacing: -.01em;
}
:deep(.newsletter-content h1) { font-size: 1.875rem; margin: 2rem 0 1rem; }
:deep(.newsletter-content h2) { font-size: 1.5rem; margin: 1.5rem 0 .75rem; }
:deep(.newsletter-content h3) { font-size: 1.25rem; margin: 1rem 0 .5rem; }
:deep(.newsletter-content p) { margin-bottom: 1rem; color: rgb(var(--color-ink-rgb) / .82); }
:deep(.newsletter-content a) { color: var(--color-primary); text-decoration: underline; }
:deep(.newsletter-content a:hover) { opacity: .8; }
:deep(.newsletter-content ul),
:deep(.newsletter-content ol) { margin-bottom: 1rem; display: flex; flex-direction: column; gap: .5rem; }
:deep(.newsletter-content ul) { list-style-type: disc; list-style-position: inside; }
:deep(.newsletter-content ol) { list-style-type: decimal; list-style-position: inside; }
:deep(.newsletter-content blockquote) {
  border-left: 4px solid var(--color-cyan);
  padding-left: 1rem;
  font-style: italic;
  color: rgb(var(--color-ink-rgb) / .7);
  margin: 1.5rem 0;
}
:deep(.newsletter-content img) {
  border-radius: 14px;
  margin: 1.5rem 0;
  max-width: 100%;
  height: auto;
}
:deep(.newsletter-content code) {
  background-color: var(--color-paper-2);
  padding: .125rem .5rem;
  border-radius: .25rem;
  font-size: .875rem;
  font-family: ui-monospace, SFMono-Regular, monospace;
}
:deep(.newsletter-content pre) {
  background-color: var(--color-paper-2);
  color: var(--color-ink);
  padding: 1rem;
  border-radius: .5rem;
  overflow-x: auto;
  margin: 1rem 0;
}
</style>
