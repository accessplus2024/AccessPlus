<script setup>
// Botão Accessia global (Parte 2 do plano técnico, docs/PLAN.md): ícone
// pequeno e redondo, presente em qualquer página. O plano original previa
// dois modos aqui — "Encontrar oportunidades" (match, exige login) e
// "Perguntas gerais" (geral, anônimo) — e os dois chegaram a ficar
// disponíveis lado a lado (2026-08-23/24).
//
// 2026-08-24: "Perguntas gerais" DESATIVADO temporariamente a pedido da
// mantenedora — sem o Gemini com busca na web (Parte 5, também desligada
// por exigir faturamento que ela não pode pagar), o modo geral respondia
// perguntas fora do catálogo sem embasamento nenhum, o que não valia a
// experiência. Em vez de manter um seletor de modo com uma única opção de
// verdade, o widget agora abre direto em "Encontrar oportunidades" — mais
// simples pro aluno, e mais honesto sobre o que a Accessia sabe fazer hoje.
// `AccessIAGeral.vue` e `server/api/rag/general.post.js` continuam no repo,
// só não são mais alcançáveis pela UI — ver docs/decisions.md, 2026-08-24.
import { Xmark } from "@iconoir/vue"
import { ref } from "vue"
import AccessGate from "~/components/opportunity/AccessGate.vue"

const aberto = ref(false)

function alternar() {
  aberto.value = !aberto.value
}
</script>

<template>
  <div class="accessia-launcher">
    <Transition name="accessia-pop">
      <div v-if="aberto" class="accessia-popover">
        <!-- 2026-08-24, a pedido da mantenedora: título fixo "Encontrar
             oportunidades" removido — a Accessia não é mais um modo entre
             outros (o seletor de dois modos já tinha saído em 2026-08-24),
             ela É a forma inteligente de buscar o catálogo, e o chat
             embutido (AccessIA.vue, `embutido`) já tem sua própria
             identidade visual (avatar + "Accessia" + assinatura) no
             cabeçalho interno — repetir um título aqui em cima era
             redundante. Fica só o botão de fechar. -->
        <div class="accessia-popover-header">
          <button class="accessia-icon-btn accessia-icon-btn-close" aria-label="Fechar" @click="aberto = false">
            <Xmark class="w-[16px] h-[16px]" />
          </button>
        </div>

        <div class="accessia-mode-panel">
          <ClientOnly>
            <!-- `compacto`: o portão aqui vive num popover de 400px. Sem essa
                 prop ele usa o layout da página da oportunidade (padding de
                 56px, formulário de duas colunas) e o cadastro fica ilegível —
                 ver o comentário no topo de AccessGate.vue. -->
            <AccessGate compacto>
              <AccessIA embutido />
            </AccessGate>
            <template #fallback>
              <p class="accessia-loading">Carregando...</p>
            </template>
          </ClientOnly>
        </div>
      </div>
    </Transition>

    <div class="accessia-fab-wrap">
      <button
        class="accessia-fab"
        :aria-expanded="aberto"
        :aria-label="aberto ? 'Fechar Accessia' : 'Abrir Accessia, sua curadora pessoal de oportunidades'"
        @click="alternar"
      >
        <Xmark v-if="aberto" class="w-[22px] h-[22px]" />
        <Sparkle v-else :size="22" color="#fff" />
      </button>
      <!-- Tooltip de apresentação: só faz sentido antes de abrir o painel —
      depois disso o aluno já sabe quem é a Accessia (pedido da mantenedora,
      2026-08-24: apresentar quem ela é antes mesmo de clicar). -->
      <span v-if="!aberto" class="accessia-tooltip" role="tooltip">
        Oiê! Eu sou a Accessia, sua curadora pessoal de oportunidades 👋
      </span>
    </div>
  </div>
</template>

<style scoped>
.accessia-launcher {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 70;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 14px;
}

.accessia-fab-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.accessia-fab {
  width: 58px;
  height: 58px;
  border-radius: 999px;
  border: 0;
  background: var(--color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(75, 63, 228, 0.35);
  transition: transform 0.15s ease;
  flex: none;
}

.accessia-fab:hover {
  transform: scale(1.05);
}

.accessia-tooltip {
  position: absolute;
  right: calc(100% + 12px);
  top: 50%;
  transform: translateY(-50%) translateX(6px);
  white-space: nowrap;
  background: var(--color-ink);
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  padding: 9px 14px;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(21, 17, 31, 0.25);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.accessia-tooltip::after {
  content: "";
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  border: 6px solid transparent;
  border-left-color: var(--color-ink);
}

.accessia-fab-wrap:hover .accessia-tooltip,
.accessia-fab:focus-visible ~ .accessia-tooltip {
  opacity: 1;
  transform: translateY(-50%) translateX(0);
}

@media (max-width: 640px) {
  .accessia-tooltip {
    white-space: normal;
    width: 200px;
    right: calc(100% + 10px);
    font-size: 12px;
  }
}

.accessia-popover {
  /* 420px em vez de 400, e mais alto: o cadastro dentro do portão tem 10
     campos, e no tamanho anterior ele sobrava do popover inteiro. */
  width: min(420px, calc(100vw - 32px));
  max-height: min(720px, calc(100vh - 100px));
  /* O scroll saiu daqui e desceu para dentro do conteúdo (o AccessGate quando
     está mostrando cadastro, ou o `.chat-mensagens` do chat quando liberado).
     Quando ele ficava no popover inteiro, o botão de fechar rolava para fora da
     vista junto com o formulário — o aluno descia para preencher o cadastro e
     perdia o X. */
  overflow: hidden;
  border-radius: 22px;
  background: #fff;
  border: 2px solid color-mix(in srgb, var(--color-ink) 10%, transparent);
  box-shadow: 0 24px 60px rgba(21, 17, 31, 0.18);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.accessia-popover-header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex: none;
}

/* Painel de conteúdo: encolhe e passa a altura adiante, mas NÃO rola.
   A rolagem fica um nível abaixo, dentro do AccessGate (que só ativa quando
   está mostrando login/cadastro) ou dentro do próprio chat (`.chat-mensagens`).
   Rolar aqui além de lá criaria dois scrollers aninhados.
   `min-height: 0` é obrigatório num filho de flex-column que precisa encolher:
   sem isso o flex dá a ele a altura do conteúdo inteiro e o `overflow` de
   qualquer descendente nunca age. */
.accessia-mode-panel {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.accessia-icon-btn {
  width: 30px;
  height: 30px;
  border-radius: 999px;
  border: 0;
  background: color-mix(in srgb, var(--color-ink) 6%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex: none;
  color: var(--color-ink);
}

.accessia-icon-btn:hover {
  background: color-mix(in srgb, var(--color-ink) 12%, transparent);
}

.accessia-modes {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.accessia-mode-btn {
  text-align: left;
  border: 1.5px solid rgba(21, 17, 31, 0.1);
  border-radius: 16px;
  padding: 14px 16px;
  background: #fff;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.accessia-mode-btn:hover {
  border-color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 5%, transparent);
}

.accessia-mode-title {
  font-weight: 700;
  font-size: 15px;
}

.accessia-mode-desc {
  font-size: 13px;
  color: rgba(21, 17, 31, 0.6);
}

.accessia-mode-panel :deep(.accessia) {
  width: 100%;
  min-height: 0;
}

.accessia-mode-panel :deep(.panel) {
  border: 0;
  padding: 0;
}

.accessia-loading {
  font-size: 14px;
  color: rgba(21, 17, 31, 0.5);
}

.accessia-pop-enter-active,
.accessia-pop-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.accessia-pop-enter-from,
.accessia-pop-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}

@media (max-width: 640px) {
  .accessia-launcher {
    right: 12px;
    bottom: 12px;
  }

  .accessia-popover {
    width: calc(100vw - 24px);
    max-height: calc(100vh - 88px);
  }
}
</style>
