<script setup>
import { ArrowUpRight } from "@iconoir/vue"
import { CATEGORIES } from "~/utils/categories"
import CategoryButton from "./CategoryButton.vue"
</script>

<template>
  <section class="section">
    <div class="wrap">
      <div class="flex flex-wrap items-end justify-between gap-4 mb-[42px]">
        <div>
          <span class="kicker">Oportunidades</span>
          <h2 class="mt-3.5" style="font-size: clamp(34px, 4.5vw, 56px); text-wrap: balance">
            Confira nossas categorias
          </h2>
        </div>
        <NuxtLink to="/oportunidades" class="btn btn-out" style="font-size: 15px; padding: 12px 22px">
          Ver todas <ArrowUpRight class="w-[17px] h-[17px]" />
        </NuxtLink>
      </div>
      <div class="cat-grid">
        <CategoryButton
          v-for="c in CATEGORIES"
          :key="c.key"
          :category="c.label"
          :icon="c.key"
          :color="c.color"
          :to="`/oportunidades?type=${encodeURIComponent(c.type)}`"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.cat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
@media (max-width: 980px) { .cat-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 480px) { .cat-grid { grid-template-columns: 1fr; } }
</style>
