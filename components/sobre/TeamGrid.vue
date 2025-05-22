<template>
  <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
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
    role: 'Co-fundadora e Diretora Executiva',
    location: 'Rio de Janeiro, RJ',
    image: '/images/paula_pic.png',
    aosDelay: 0,
  },
  {
    name: 'Ester Borges Frickes',
    role: 'Co-Fundadora e Diretora de Operações',
    location: 'Rio de Janeiro, RJ',
    image: '/images/ester_pic.png',
    aosDelay: 100,
  },
  {
    name: 'Camily Guimarães Carvalho',
    role: 'Co-Fundadora e Diretora de Tecnologia',
    location: 'Camaçari, BA',
    image: '/images/camily_pic.png',
    aosDelay: 200,
  },
  {
    name: 'Izabeli Santos',
    role: 'Co-fundadora e Diretora de Marketing',
    location: 'Camaçari, BA',
    image: '/images/iza_pic.png',
    aosDelay: 300,
  },
  {
    name: 'João Pedro Santos',
    role: 'Co-fundador e Analista de Tecnologia',
    location: 'Alcobaça, BA',
    image: '/images/joao_pedro_pic.png',
    aosDelay: 400,
  },
  {
    name: 'Vinícius Castelli',
    role: 'Co-fundador e Diretor de Expansão',
    location: 'Bauru, SP',
    image: '/images/vini2.jpg',
    aosDelay: 500,
  },
  {
    name: 'Ruan Cordeiro',
    role: 'Co-fundador e Analista de Tecnologia',
    location: 'São Pedro, RN',
    image: '/images/ruan_pic.png',
    aosDelay: 600,
  },
  {
    name: 'Alessandra Sena',
    role: 'Co-fundadora e Analista de Tecnologia',
    location: "Dias d'Ávila, BA",
    image: '/images/alessandra_pic.png',
    aosDelay: 700,
  }
];
</script>