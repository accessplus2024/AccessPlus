<script setup>
import { Youtube, Instagram, Linkedin } from "@iconoir/vue"

const links = [
  { text: "Início", href: "/" },
  { text: "Oportunidades", href: "/oportunidades" },
  { text: "Sobre nós", href: "/sobre" },
  { text: "Newsletter", href: "/newsletter" },
]
const socials = [
  { icon: Youtube, href: "https://www.youtube.com/@AccessPlusOficial", label: "YouTube" },
  { icon: Instagram, href: "https://www.instagram.com/accessplusoficial/", label: "Instagram" },
  { icon: Linkedin, href: "https://www.linkedin.com/company/accesspluseducation", label: "LinkedIn" },
]
const year = new Date().getFullYear()
</script>

<template>
  <footer
    class="relative overflow-hidden bg-ink text-paper mt-10"
    style="border-top-left-radius: 40px; border-top-right-radius: 40px"
  >
    <div class="wrap relative" style="padding: 72px 28px 40px">
      <div class="flex flex-wrap justify-between gap-10">
        <div class="max-w-sm">
          <img src="/images/icons/logo-longo.svg" alt="Access+" class="w-36" style="filter: brightness(0) invert(1)" />
          <p class="mt-5 text-paper/70 leading-relaxed" style="font-size: 16px">
            A maior plataforma gratuita do país focada em trazer oportunidades
            educacionais atualizadas para jovens.
          </p>
          <div class="flex gap-3.5 mt-6">
            <a
              v-for="s in socials"
              :key="s.label"
              :href="s.href"
              target="_blank"
              rel="noopener"
              :aria-label="s.label"
              class="w-11 h-11 rounded-full inline-flex items-center justify-center bg-paper/10 text-paper transition-colors duration-200 hover:bg-lime hover:text-ink"
            >
              <component :is="s.icon" class="w-5 h-5" />
            </a>
          </div>
        </div>

        <div>
          <h4 class="font-body font-semibold uppercase text-paper/50 mb-4"
              style="font-size: 14px; letter-spacing: .14em">Navegação</h4>
          <ul class="flex flex-col gap-3">
            <li v-for="l in links" :key="l.href">
              <NuxtLink :to="l.href" class="text-paper/85 hover:text-paper transition-colors" style="font-size: 16px">
                {{ l.text }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <div class="max-w-xs">
          <h4 class="font-body font-semibold uppercase text-paper/50 mb-4"
              style="font-size: 14px; letter-spacing: .14em">É uma organização?</h4>
          <p class="text-paper/70 leading-relaxed mb-4" style="font-size: 15px">
            Cadastre uma oportunidade e ajude jovens a encontrá-la.
          </p>
          <NuxtLink to="/cadastrar-oportunidade" class="btn btn-lime cadastro-cta" style="font-size: 14.5px; padding: 12px 20px">
            Cadastrar oportunidade
          </NuxtLink>
        </div>
      </div>

      <div
        class="mt-14 pt-6 border-t border-paper/10 flex flex-wrap justify-between gap-2.5 text-paper/50"
        style="font-size: 13.5px"
      >
        <span>© {{ year }} Access+. Democratizando o acesso à educação.</span>
        <span class="inline-flex items-center gap-2">
          Feito com carinho no Brasil
        </span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
/* O padrão do .btn-lime é subir e brilhar no hover — aqui, ao CLICAR
   (estado :active, o toque/pressão em si), inverte: desce em vez de subir
   e fica cinza em vez de continuar lima, como feedback tátil de "pressionado". */
.cadastro-cta:active {
  transform: translateY(1px);
  background: #9CA3AF;
  box-shadow: none;
}
</style>
