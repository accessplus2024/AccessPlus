<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup>
useHead({
  titleTemplate: (title) => {
    return title ? `${title} - Access+` : "Access+";
  },
});
</script>

<style lang="postcss">
body {
  @apply bg-white text-white;
}
</style>
