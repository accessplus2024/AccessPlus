<template>
  <section class="section" style="padding-bottom: 0">
    <div class="wrap">
      <div class="grid lg:grid-cols-[0.8fr_1.2fr] gap-10 items-start">
        <h2 style="font-size: clamp(30px, 4vw, 48px); text-wrap: balance">
          Como tudo começou
        </h2>
        <div class="space-y-5 text-ink/72 leading-relaxed" style="font-size: 17px; max-width: 65ch">
          <slot />
        </div>
      </div>
    </div>
  </section>
</template>
