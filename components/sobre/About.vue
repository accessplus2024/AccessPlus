<template>
  <div class="relative container mx-auto flex flex-col text-center mt-16 md:mt-28 mb-14 items-center justify-center px-4 sm:px-6 lg:px-8">
    <!-- Team member images and names -->
    <div class="hidden xl:flex absolute top-0 left-52 flex-col items-center" data-aos="fade-right">
      <img src="/images/paula_pic.png" alt="Paula Borges Frickes" class="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover" />
      <div class="absolute bottom-0 right-0 transform translate-y-1/2 bg-red-400 text-white text-sm font-semibold px-4 py-1 rounded-full text-center">
        PAULA
      </div>
    </div>
    <div class="hidden xl:flex absolute top-0 right-48 -translate-y-1/4 flex-col items-center" data-aos="fade-left">
      <img src="/images/iza_pic.png" alt="Ester Borges Frickes" class="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover" />
      <div class="absolute bottom-0 right-0 transform translate-y-1/2 bg-purple-400 text-white text-sm font-semibold px-4 py-1 rounded-full text-center">
        IZABELI
      </div>
    </div>
    <div class="hidden xl:flex absolute bottom-0 left-64 flex-col items-center" data-aos="fade-right">
      <img src="/images/ester_pic.png" alt="Izabeli Santos" class="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover" />
      <div class="absolute bottom-0 left-0 transform translate-y-1/2 bg-blue-800 text-white text-sm font-semibold px-4 py-1 rounded-full text-center">
        ESTER
      </div>
    </div>
    <div class="hidden xl:flex absolute bottom-10 right-72 translate-y-1/2 flex-col items-center" data-aos="fade-left">
      <img src="/images/camily_pic.png" alt="João Pedro Santos" class="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover" />
      <div class="absolute bottom-0 left-0 transform translate-y-1/2 bg-yellow-400 text-white text-sm font-semibold px-4 py-1 rounded-full text-center">
        CAMILY
      </div>
    </div>
    <h1 class="text-3xl sm:text-4xl md:text-5xl font-semibold mb-8" style="color: #380f45" data-aos="fade-up">
      Como tudo começou
    </h1>
    <div class="max-w-md text-base font-normal" data-aos="fade-up">
      <slot />
    </div>
  </div>
</template>