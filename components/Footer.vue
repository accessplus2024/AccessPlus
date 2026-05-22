<template>
  <footer class="bg-primary py-10 rounded-t-3xl">
    <div class="max-w-5xl mx-auto px-4 sm:px-[60px] flex flex-col sm:flex-row justify-between items-start">
      <div class="flex flex-col items-start">
        <div class="flex flex-1 w-full h-full">
          <img src="/images/logo-light.svg" class="mt-7" alt="Access+" />
        </div>
        <div class="text-white flex items-start sm:items-center w-full mt-4 sm:mt-6">
          <span class="text-sm mr-3 sm:text-base font-body">Siga nossas redes sociais:</span>
          <Socials theme="dark" />
        </div>
      </div>
      <div class="text-white text-left mt-8 sm:mt-0">
        <h2 class="text-[24px] font-display font-bold mb-2">Navegação</h2>
        <div class="flex flex-col">
          <ul class="flex flex-col space-y-1">
            <li
              v-for="(link, index) in [
                { text: 'Início', href: '/' },
                { text: 'Sobre nós', href: '/sobre' },
                { text: 'Oportunidades', href: '/oportunidades' },
                { text: 'Newsletter', href: '/newsletter' },
              ]"
              :key="index"
            >
              <a
                :href="link.href"
                class="text-white text-[14px] hover:text-accent-cyan font-body font-bold transition-colors duration-300 ease-in-out"
              >
                {{ link.text }}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </footer>
</template>
