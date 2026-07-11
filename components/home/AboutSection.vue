<script setup>
import { ArrowRight } from "@iconoir/vue"
</script>

<template>
  <section class="section">
    <div class="wrap">
      <div class="grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <span class="kicker">Quem somos</span>
          <h2 class="mt-3.5" style="font-size: clamp(34px, 4.5vw, 60px); text-wrap: balance">
            Um futuro mais <span class="text-magenta">justo</span> começa com acesso.
          </h2>
        </div>
        <div>
          <p class="text-ink/72 leading-relaxed" style="font-size: 18px">
            O time do Access+ é formado por pessoas comprometidas com a
            democratização do acesso à educação no Brasil. Cada membro traz uma
            combinação única de experiências, habilidades e paixões que
            impulsionam nosso objetivo de criar um futuro mais justo e igualitário
            para os estudantes de baixa renda.
          </p>
          <NuxtLink to="/sobre" class="btn btn-ink mt-7">
            Conheça o time <ArrowRight class="w-[18px] h-[18px]" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>
