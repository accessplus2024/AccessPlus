<script setup>
import { Linkedin, Instagram, Youtube } from "@iconoir/vue"
import ContactForm from "./ContactForm.vue"

const contacts = [
  { icon: Linkedin, label: "LinkedIn", link: "https://www.linkedin.com/company/accesspluseducation/posts/?feedView=all" },
  { icon: Instagram, label: "Instagram", link: "https://www.instagram.com/accessplusoficial/" },
  { icon: Youtube, label: "YouTube", link: "https://www.youtube.com/@AccessPlusOficial" },
]
</script>

<template>
  <section class="section">
    <div class="wrap grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <!-- Contact info -->
      <div data-aos="fade-right">
        <span class="kicker">Fale com a gente</span>
        <h2 class="mt-3.5" style="font-size: clamp(32px, 4vw, 52px); text-wrap: balance">Entre em contato</h2>
        <p class="font-body text-ink/72 leading-relaxed mt-6 mb-8" style="font-size: 17px; max-width: 48ch">
          Nós do Access+ estamos sempre prontos para ouvir você! Se tiver dúvidas,
          sugestões ou quiser saber mais sobre o projeto, entre em contato conosco.
          Estamos aqui para ajudar e colaborar na construção de um futuro com mais
          oportunidades para todos.
        </p>
        <div class="space-y-3">
          <a
            v-for="c in contacts"
            :key="c.label"
            :href="c.link"
            target="_blank"
            rel="noopener"
            class="flex items-center gap-4 bg-card p-4 border border-ink/8 transition-shadow hover:shadow-md"
            style="border-radius: var(--r-card)"
          >
            <span class="bg-primary/10 rounded-full p-3 flex-shrink-0 inline-flex">
              <component class="text-primary" :is="c.icon" />
            </span>
            <p class="font-body font-semibold text-ink" style="font-size: 15px">{{ c.label }}</p>
          </a>
        </div>
      </div>

      <ContactForm />
    </div>
  </section>
</template>
