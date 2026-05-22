<template>
  <IconoirProvider>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </IconoirProvider>
</template>

<script setup>
import { IconoirProvider } from '@iconoir/vue';
useHead({
  titleTemplate: (title) => {
    return title ? `${title} - Access+` : "Access+";
  },
});
</script>

<style lang="postcss">
body {
  @apply bg-bg text-text;
}
</style>
