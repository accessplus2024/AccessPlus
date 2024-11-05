<template>
  <NuxtPage />
</template>

<script setup>
useHead({
  titleTemplate: (title) => {
    return title ? `${title} - Access+` : "Access+";
  },
});
</script>
