<template>
  <!-- Grade responsiva: 4 colunas (uma linha só) em telas grandes, 2 colunas
       (2 em cima, 2 embaixo) em telas menores. Sem scroll/carrossel — todo
       mundo do time fica sempre visível, sem precisar arrastar nada. -->
  <div class="team-grid">
    <TeamMemberCard
      v-for="(member, idx) in members"
      :key="member.name"
      :name="member.name"
      :role="member.role"
      :location="member.location"
      :image="member.image"
      :color="palette[idx % palette.length]"
      :data-aos-delay="member.aosDelay"
    />
  </div>
</template>

<script setup>
import TeamMemberCard from './TeamMemberCard.vue';

// Cores da paleta da marca, uma por pessoa, repetindo em loop se o time crescer.
const palette = [
  "var(--color-primary)", // indigo
  "var(--color-magenta)",
  "var(--color-teal)",
  "var(--color-amber)",
];

const members = [
  {
    name: 'Paula Borges Frickes',
    role: 'Diretora Executiva',
    location: 'Rio de Janeiro, RJ',
    image: '/images/paula_pic.png',
    aosDelay: 0,
  },
  {
    name: 'Ester Borges Frickes',
    role: 'Diretora de Operações',
    location: 'Rio de Janeiro, RJ',
    image: '/images/ester_pic.png',
    aosDelay: 100,
  },
  {
    name: 'Camily Guimarães Carvalho',
    role: 'Diretora de Informação',
    location: 'Camaçari, BA',
    image: '/images/camily_pic.png',
    aosDelay: 200,
  },
  {
    name: 'João Pedro Santos',
    role: 'Diretor de Tecnologia',
    location: 'Alcobaça, BA',
    image: '/images/joao_pedro_pic.png',
    aosDelay: 300,
  },
];
</script>

<style scoped>
.team-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  width: 100%;
}
/* 2 em cima, 2 embaixo em telas menores — nunca corta ninguém, só reflui. */
@media (max-width: 900px) {
  .team-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
}
</style>
