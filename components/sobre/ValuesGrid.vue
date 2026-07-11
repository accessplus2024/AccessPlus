<script setup>
import ValuesCard from "./ValuesCard.vue"

const values = [
  {
    n: "01", title: "Inclusão", color: "var(--color-primary)", ink: "#fff",
    text: "Acreditamos que todos os jovens devem ter as mesmas oportunidades de crescer e se desenvolver, independentemente de sua origem ou condição financeira.",
  },
  {
    n: "02", title: "Inovação", color: "var(--color-magenta)", ink: "#fff",
    text: "Através de ferramentas tecnológicas e uma abordagem moderna, conectamos estudantes com oportunidades educacionais de uma maneira nova e eficaz.",
  },
  {
    n: "03", title: "Comunidade", color: "var(--color-lime)", ink: "#15111F",
    text: "Construímos uma rede de apoio que valoriza o potencial de cada estudante, ajudando-os a alcançar seus sonhos e retribuir à sociedade.",
  },
]
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-[18px]">
    <ValuesCard
      v-for="v in values"
      :key="v.title"
      :n="v.n"
      :title="v.title"
      :color="v.color"
      :ink="v.ink"
    >
      {{ v.text }}
    </ValuesCard>
  </div>
</template>
