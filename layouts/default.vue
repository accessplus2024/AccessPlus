<template>
  <div class="relative overflow-x-hidden bg-bg text-text min-h-screen">
    <div class="absolute top-0 left-0 w-full z-30">
      <Navbar transparent />
    </div>
    <slot></slot>
    <Footer />
  </div>
</template>
