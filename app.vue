<template>
  <IconoirProvider>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </IconoirProvider>
  <ClientOnly>
    <NewsletterWelcomeModal />
  </ClientOnly>
  <div vw class="enabled">
    <div vw-access-button class="active"></div>
    <div vw-plugin-wrapper>
      <div class="vw-plugin-top-wrapper"></div>
    </div>
  </div>
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
