<template>
  <div class="mx-auto max-w-6xl px-4 pb-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-black">
      <TeamMemberCard
        v-for="(member, idx) in members"
        :key="member.name"
        :name="member.name"
        :role="member.role"
        :location="member.location"
        :image="member.image"
        :data-aos-delay="member.aosDelay"
      />
    </div>
  </div>
</template>

<script setup>
import TeamMemberCard from './TeamMemberCard.vue';

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
    role: 'Diretora de Tecnologia',
    location: 'Camaçari, BA',
    image: '/images/camily_pic.png',
    aosDelay: 200,
  },
  {
    name: 'Izabeli Santos',
    role: 'Diretora de Marketing',
    location: 'Camaçari, BA',
    image: '/images/iza_pic.png',
    aosDelay: 300,
  },
  {
    name: 'João Pedro Santos',
    role: 'Analista de Tecnologia',
    location: 'Alcobaça, BA',
    image: '/images/joao_pedro_pic.png',
    aosDelay: 400,
  },
  {
    name: 'Julia Meireles',
    role: 'Diretora de Engajamento',
    location: "São Paulo, SP",
    image: '/images/julia-meireles.jpg',
    aosDelay: 1000,
  }
];
</script>
