<template>
  <div
    class="relative overflow-hidden text-white"
    style="background: var(--color-primary); border-radius: var(--r-lg); padding: 36px"
  >
    <h2 class="relative font-display" style="font-size: 28px">Mande uma mensagem</h2>
    <form action="https://formspree.io/f/meoekypw" method="POST" class="relative mt-6 space-y-5">
      <div>
        <label for="name" class="block text-white/90 mb-2 text-left" style="font-size: 14px">Nome</label>
        <input
          type="text" id="name" name="name" placeholder="Seu nome"
          class="w-full font-body p-3.5 rounded-pill bg-white text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-lime"
        />
      </div>
      <div>
        <label for="email" class="block text-white/90 mb-2 text-left" style="font-size: 14px">E-mail</label>
        <input
          type="email" id="email" name="email" placeholder="seu@email.com"
          class="w-full font-body p-3.5 rounded-pill bg-white text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-lime"
        />
      </div>
      <div>
        <label for="message" class="block text-white/90 mb-2 text-left" style="font-size: 14px">Mensagem</label>
        <textarea
          id="message" name="message" rows="4" placeholder="Escreva sua mensagem…"
          class="w-full font-body p-3.5 rounded-card bg-white text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-lime resize-none"
        ></textarea>
      </div>
      <button type="submit" class="btn btn-lime w-full">Enviar mensagem</button>
    </form>
  </div>
</template>
