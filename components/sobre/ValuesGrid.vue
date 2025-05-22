<template>
  <div class="container mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex flex-col md:flex-row justify-center gap-6">
      <ValuesCard title="Inclusão" bgClass="bg-red-400">
        Acreditamos que todos os jovens devem ter as mesmas oportunidades de crescer e se desenvolver, independentemente de sua origem ou condição financeira.
      </ValuesCard>
      <ValuesCard title="Inovação" bgClass="bg-purple-400" :aosDelay="200">
        Através de ferramentas tecnológicas e uma abordagem moderna, nossa plataforma oferece uma maneira nova e eficaz de conectar estudantes com oportunidades educacionais.
      </ValuesCard>
      <ValuesCard title="Comunidade" bgClass="bg-blue-800" :aosDelay="400">
        Queremos construir uma rede de apoio que valorize o potencial de cada estudante, ajudando-os a alcançar seus sonhos e retribuir à sociedade.
      </ValuesCard>
    </div>
  </div>
</template>

<script setup>
import ValuesCard from './ValuesCard.vue';
</script>