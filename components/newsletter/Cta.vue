<template>
  <section id="newsletter-subscription" class="wrap">
    <div
      class="relative overflow-hidden text-white"
      style="background: var(--color-primary); border-radius: var(--r-lg); padding: 64px 48px"
    >
      <div class="relative" style="max-width: 620px">
        <span class="kicker text-white" style="opacity: .8; color: #fff">Newsletter</span>
        <h2 class="mt-4" style="font-size: clamp(32px, 4vw, 52px); text-wrap: balance">
          Não perca nenhuma novidade!
        </h2>
        <p class="mt-4 text-white/85 leading-relaxed" style="font-size: 18px">
          Inscreva-se na nossa newsletter e receba semanalmente as melhores
          oportunidades e dicas para turbinar sua jornada educacional.
        </p>
        <div class="mt-7 bg-white rounded-pill px-2 w-fit max-w-full overflow-hidden">
          <iframe
            src="https://subscribe-forms.beehiiv.com/012188af-07b0-4875-8457-3a74a9faadc7"
            class="w-[320px] max-w-full h-20 max-h-20"
            data-test-id="beehiiv-embed"
            frameborder="0"
            scrolling="no"
            loading="lazy"
          ></iframe>
        </div>
      </div>
    </div>
  </section>
</template>
