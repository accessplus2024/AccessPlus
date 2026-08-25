<script setup>
import { ref, computed, watch, onMounted } from "vue"
import { Lock, ArrowRight } from "@iconoir/vue"
import { useAuth } from "~/composables/useAuth"
import { useProfile } from "~/composables/useProfile"

// `compacto`: o mesmo portão, mas dentro de um contêiner estreito — hoje o
// popover da Accessia (400px de largura, 18px de padding). Sem isto ele
// herdava o layout desenhado para a página da oportunidade, que tem a largura
// inteira do conteúdo: 56px de padding num contêiner de 364px, título de 24px,
// e um formulário de duas colunas que virava dois campos de ~150px cada.
//
// Também troca a cópia. O texto original fala de "ver os detalhes desta
// oportunidade" — verdadeiro na página da oportunidade, e simplesmente errado
// na Accessia, onde o aluno não está olhando oportunidade nenhuma: ele quer
// recomendação.
const props = defineProps({
  compacto: { type: Boolean, default: false },
})

const { user, carregandoSessao, init, signInWithGoogle } = useAuth()
const { profile, carregandoPerfil, erroPerfil, fetchProfile, saveProfile, resetProfile } = useProfile()

// A tabela `profiles` já existia antes (com id/full_name/avatar_url, criada
// automaticamente ao logar). Por isso não basta checar "existe um perfil" —
// precisa checar se os campos do NOSSO cadastro foram preenchidos.
const cadastroCompleto = computed(() => {
  const p = profile.value
  return !!(p && p.name && p.age && p.phone && p.school && p.school_type && p.education_level && p.city && p.state && p.lgpd_consent_at)
})

const niveis = [
  { key: "fundamental", label: "Ensino Fundamental" },
  { key: "medio", label: "Ensino Médio" },
  { key: "superior_cursando", label: "Ensino Superior (cursando)" },
  { key: "superior_completo", label: "Ensino Superior (completo)" },
  { key: "pos", label: "Pós-graduação" },
]

const faixasRenda = [
  { key: "ate_1", label: "Até 1 salário mínimo" },
  { key: "1_2", label: "De 1 a 2 salários mínimos" },
  { key: "2_3", label: "De 2 a 3 salários mínimos" },
  { key: "3_5", label: "De 3 a 5 salários mínimos" },
  { key: "acima_5", label: "Acima de 5 salários mínimos" },
]

const tiposEscola = [
  { key: "publica_estadual", label: "Pública Estadual" },
  { key: "publica_municipal", label: "Pública Municipal" },
  { key: "publica_federal", label: "Pública Federal" },
  { key: "privada", label: "Privada" },
  { key: "privada_bolsa", label: "Privada com bolsa" },
]

const estados = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
]

// Distingue os dois estados que o portão pode estar renderizando, porque eles
// precisam de comportamento de rolagem OPOSTO dentro do popover da Accessia:
//  - portão (login ou cadastro): conteúdo mais alto que o espaço, precisa rolar
//  - liberado (o <slot/> com o chat): o chat tem rolagem própria em
//    `.chat-mensagens`, então rolar aqui também criaria dois scrollers
//    aninhados — o aluno arrasta e não sabe qual dos dois vai se mover.
const mostrandoPortao = computed(() => !user.value || !cadastroCompleto.value)

const form = ref({
  name: "", age: "", phone: "", school: "", schoolType: "", educationLevel: "",
  city: "", state: "", income: "", lgpdConsent: false,
})
const enviando = ref(false)
const erroForm = ref(null)

function preencherNomeSugerido() {
  if (!form.value.name && user.value) {
    form.value.name = user.value.user_metadata?.full_name || user.value.user_metadata?.name || ""
  }
}

watch(user, (novo) => {
  if (novo) {
    fetchProfile(novo.id)
    preencherNomeSugerido()
  } else {
    resetProfile()
  }
})

onMounted(() => {
  init()
  if (user.value) {
    fetchProfile(user.value.id)
    preencherNomeSugerido()
  } else {
    carregandoPerfil.value = false
  }
})

async function enviar() {
  erroForm.value = null
  enviando.value = true
  const r = await saveProfile(user.value, form.value)
  enviando.value = false
  if (!r.ok) erroForm.value = r.error
}
</script>

<template>
  <div
    class="gate-root"
    :class="{ 'gate-root--compacto': compacto, 'gate-root--rolavel': compacto && mostrandoPortao }"
  >
    <div v-if="carregandoSessao || (user && carregandoPerfil)" class="gate-card">
      <div v-if="!compacto" class="gate-topbar" />
      <p class="text-ink/50" style="font-size: 14px">Carregando...</p>
    </div>

    <!-- Deslogado: convite para entrar.
         O rótulo "Acesso gratuito" saiu (2026-08-24, a pedido da mantenedora):
         a palavra "gratuita" já aparece no título e no parágrafo, e o cadeado
         sozinho, um pouco maior, comunica o mesmo sem repetir. -->
    <div v-else-if="!user" class="gate-card">
      <div v-if="!compacto" class="gate-topbar" />
      <span class="gate-icon"><Lock :class="compacto ? 'w-[18px] h-[18px]' : 'w-[20px] h-[20px]'" /></span>
      <h3 class="font-display mt-3" :style="compacto ? 'font-size: 19px' : 'font-size: 24px'">
        {{ compacto ? "Entre para a Accessia achar oportunidades pra você" : "Crie sua conta gratuita para ver os detalhes" }}
      </h3>
      <p class="text-ink/60 mt-2 mx-auto" :style="compacto ? 'font-size: 14px; max-width: 34ch' : 'font-size: 15px; max-width: 46ch'">
        {{ compacto
          ? "Preciso saber sua série e sua idade pra não te mostrar coisa que você não conseguiria fazer. O cadastro é rápido e 100% gratuito."
          : "Guia de aplicação, elegibilidade, link de inscrição e comentários da comunidade ficam disponíveis depois de um cadastro rápido e 100% gratuito." }}
      </p>
      <button class="btn-google" :class="compacto ? 'mt-5' : 'mt-6'" :disabled="carregandoSessao" @click="signInWithGoogle">
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/>
          <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.96v2.33A9 9 0 0 0 9 18z"/>
          <path fill="#FBBC05" d="M3.98 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.02-2.33z"/>
          <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.02 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
        </svg>
        Entrar com Google
      </button>
    </div>

    <!-- Logado sem cadastro completo: formulário -->
    <div v-else-if="!cadastroCompleto" class="gate-card gate-card--form">
      <div v-if="!compacto" class="gate-topbar" />
      <span class="kicker" style="opacity: .65">Cadastro rápido</span>
      <h3 class="font-display mt-2" :style="compacto ? 'font-size: 19px' : 'font-size: 24px'">Só mais um passo</h3>
      <p class="text-ink/60 mt-2" :style="compacto ? 'font-size: 14px' : 'font-size: 15px'">
        {{ compacto
          ? "Complete seu cadastro e eu já começo a procurar."
          : "Complete seu cadastro para liberar os detalhes desta oportunidade." }}
      </p>

      <p class="form-section-title mt-7">Dados pessoais</p>
      <div class="form-grid mt-4">
        <label class="field-label">
          Nome completo
          <input v-model="form.name" class="field" type="text" placeholder="Seu nome" />
        </label>
        <label class="field-label">
          Idade
          <input v-model="form.age" class="field" type="number" min="5" max="100" placeholder="Sua idade" />
        </label>
        <label class="field-label">
          Telefone (com DDD)
          <input v-model="form.phone" class="field" type="tel" placeholder="(11) 91234-5678" />
        </label>
        <label class="field-label">
          Renda familiar <span class="text-ink/45">(opcional)</span>
          <select v-model="form.income" class="field">
            <option value="">Prefiro não informar</option>
            <option v-for="f in faixasRenda" :key="f.key" :value="f.key">{{ f.label }}</option>
          </select>
        </label>
      </div>

      <p class="form-section-title mt-7">Escola e localização</p>
      <div class="form-grid mt-4">
        <label class="field-label">
          Escola
          <input v-model="form.school" class="field" type="text" placeholder="Nome da sua escola" />
        </label>
        <label class="field-label">
          Tipo de escola
          <select v-model="form.schoolType" class="field">
            <option value="" disabled>Selecione...</option>
            <option v-for="t in tiposEscola" :key="t.key" :value="t.key">{{ t.label }}</option>
          </select>
        </label>
        <label class="field-label">
          Escolaridade
          <select v-model="form.educationLevel" class="field">
            <option value="" disabled>Selecione...</option>
            <option v-for="n in niveis" :key="n.key" :value="n.key">{{ n.label }}</option>
          </select>
        </label>
        <label class="field-label">
          Cidade
          <input v-model="form.city" class="field" type="text" placeholder="Sua cidade" />
        </label>
        <label class="field-label field-label--full">
          Estado
          <select v-model="form.state" class="field">
            <option value="" disabled>Selecione...</option>
            <option v-for="uf in estados" :key="uf" :value="uf">{{ uf }}</option>
          </select>
        </label>
      </div>

      <label class="lgpd-check mt-7">
        <input v-model="form.lgpdConsent" type="checkbox" />
        <span>
          Li e concordo com o uso dos meus dados (nome, idade, telefone, escola, escolaridade,
          cidade e estado) pela Access+ para fins de contato e recomendação de oportunidades
          educacionais, conforme a Lei Geral de Proteção de Dados (LGPD), e autorizo o envio de
          e-mails da Access+ sobre oportunidades, novidades e conteúdos educacionais.
        </span>
      </label>

      <p v-if="erroForm" class="mt-4" style="color: #E24444; font-size: 13.5px">{{ erroForm }}</p>

      <button class="btn btn-ink mt-6" :disabled="enviando || !form.lgpdConsent" @click="enviar">
        <template v-if="enviando">Enviando...</template>
        <template v-else>Concluir cadastro <ArrowRight class="w-[18px] h-[18px]" /></template>
      </button>
    </div>

    <!-- Logado e cadastrado: libera o conteúdo -->
    <slot v-else />
  </div>
</template>

<style scoped>
/* `container-type: inline-size` é a correção de raiz do bug do portão dentro da
   Accessia. O layout responsivo deste componente estava todo em
   `@media (max-width: 640px)`, que mede a JANELA — e dentro do popover da
   Accessia a janela é um desktop de 1440px enquanto o contêiner tem 364px. O
   formulário ficava em duas colunas de ~150px cada, com selects e inputs
   ilegíveis, e a media query nunca disparava porque, do ponto de vista dela,
   havia espaço de sobra.
   Com container query, a regra passa a olhar o espaço que o componente
   realmente tem. Isso conserta os dois casos de uma vez — popover estreito no
   desktop e tela de celular — em vez de duplicar breakpoints. */
.gate-root {
  container-type: inline-size;
  container-name: gate;
}

.gate-card {
  position: relative;
  overflow: hidden;
  text-align: center;
  padding: 56px 32px;
  border-radius: var(--r-card);
  border: 2px solid color-mix(in srgb, var(--color-ink) 10%, transparent);
  background: #fff;
}
.gate-card--form {
  text-align: left;
  padding: 40px 32px 36px;
}
/* Mesma assinatura visual dos cards de oportunidade: barra colorida no topo */
.gate-topbar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: var(--color-primary);
}
/* 44px, não 30px (2026-08-24): com o rótulo "Acesso gratuito" removido, o
   cadeado é o único sinal visual de que há conteúdo bloqueado — e a 30px com
   um ícone de 14px ele lia como enfeite, não como informação. */
.gate-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  color: var(--color-primary);
}
.btn-google {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 26px;
  border-radius: var(--r-pill);
  border: 2px solid color-mix(in srgb, var(--color-ink) 14%, transparent);
  background: #fff;
  font-family: var(--font-body, inherit);
  font-weight: 600;
  font-size: 15px;
  color: var(--color-ink);
  transition: border-color .2s ease, box-shadow .2s ease, transform .25s var(--ease, ease);
}
.btn-google:hover {
  border-color: var(--color-primary);
  box-shadow: 0 10px 24px color-mix(in srgb, var(--color-primary) 20%, transparent);
  transform: translateY(-2px);
}
.btn-google:disabled { opacity: .6; transform: none; }

.form-section-title {
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 12.5px;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--color-primary);
  padding-bottom: 10px;
  border-bottom: 2px solid color-mix(in srgb, var(--color-primary) 16%, transparent);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}
.field-label--full {
  grid-column: 1 / -1;
}
.field-label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13.5px;
  font-weight: 600;
  color: color-mix(in srgb, var(--color-ink) 75%, transparent);
}
.field {
  padding: 13px 14px;
  border-radius: 14px;
  border: 2px solid color-mix(in srgb, var(--color-ink) 12%, transparent);
  font-family: var(--font-body, inherit);
  font-size: 14.5px;
  font-weight: 500;
  color: var(--color-ink);
  background: #fff;
  transition: border-color .2s ease, box-shadow .2s ease;
}
.field:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-primary) 14%, transparent);
}

/* Selects nativos vinham finos e com a setinha padrão do sistema — aqui a
   gente esconde o "appearance" nativo e desenha uma seta própria, deixa
   mais alto/arredondado e com um hover sutil, pra parecer parte do design
   em vez de um <select> cru do navegador. */
select.field {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  padding: 15px 44px 15px 18px;
  border-radius: 18px;
  background-color: #fff;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2315111F' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;
  background-size: 16px;
  cursor: pointer;
}
select.field:hover {
  border-color: color-mix(in srgb, var(--color-primary) 40%, color-mix(in srgb, var(--color-ink) 12%, transparent));
}
select.field:focus {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234B3FE4' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
}
select.field:disabled { cursor: not-allowed; opacity: .6; }

.lgpd-check {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 18px;
  border-radius: 16px;
  background: color-mix(in srgb, var(--color-primary) 6%, transparent);
  border: 1.5px solid color-mix(in srgb, var(--color-primary) 14%, transparent);
  cursor: pointer;
}
.lgpd-check input {
  margin-top: 3px;
  width: 16px;
  height: 16px;
  flex: none;
  accent-color: var(--color-primary);
}
.lgpd-check span {
  font-size: 13px;
  line-height: 1.5;
  color: color-mix(in srgb, var(--color-ink) 65%, transparent);
}

/* Uma coluna assim que o contêiner aperta, venha o aperto de onde vier. */
@container gate (max-width: 520px) {
  .form-grid { grid-template-columns: 1fr; }
  .gate-card { padding: 40px 22px; }
}

/* Fallback para navegador sem suporte a container queries: mantém o
   comportamento antigo por viewport, para não regredir no celular. */
@supports not (container-type: inline-size) {
  @media (max-width: 640px) {
    .form-grid { grid-template-columns: 1fr; }
    .gate-card { padding: 40px 22px; }
  }
}

/* ── Modo compacto (popover da Accessia) ────────────────────────────────────
   O popover já tem borda de 2px, raio de 22px e sombra próprios. O card
   repetia tudo isso por dentro, então o aluno via dois quadros aninhados com
   ~50px de moldura entre a borda do popover e o primeiro pixel de conteúdo,
   num espaço de 364px. Aqui o card vira transparente e devolve essa largura
   para o formulário. */
/* Só o portão rola. Quando o conteúdo é liberado, a raiz vira uma coluna flex
   que passa a altura adiante, e quem rola é o `.chat-mensagens` do chat. */
/* `flex: 1 1 auto`, e NÃO `height: 100%`.
   O pai (`.accessia-mode-panel`) vive num popover que tem só `max-height`,
   nunca `height`. Altura percentual não resolve contra `max-height`: vira
   `auto`. Com `height: 100%` o portão crescia até o tamanho do conteúdo, o
   `overflow-y` de `--rolavel` não tinha o que rolar, e o `overflow: hidden`
   do popover cortava o formulário sem barra de rolagem nenhuma.
   Como item flex que pode encolher, ele recebe a altura que sobra de verdade. */
.gate-root--compacto {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
}
.gate-root--rolavel {
  overflow-y: auto;
  overscroll-behavior: contain;
  /* Firefox */
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, var(--color-ink) 25%, transparent) transparent;
}
/* WebKit esconde a barra até o scroll começar; num formulário que já foi
   cortado uma vez, mostrar que dá pra rolar importa mais que a estética. */
.gate-root--rolavel::-webkit-scrollbar {
  width: 8px;
}
.gate-root--rolavel::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--color-ink) 22%, transparent);
  border-radius: 999px;
}
.gate-root--rolavel::-webkit-scrollbar-track {
  background: transparent;
}
.gate-root--compacto > * {
  min-height: 0;
}

.gate-root--compacto .gate-card {
  padding: 4px 0 8px;
  border: 0;
  border-radius: 0;
  background: transparent;
  /* Duas linhas que valem o bug inteiro: sem elas o cadastro simplesmente
     some no popover da Accessia, e sem barra de rolagem nenhuma.
     - `flex: none`: como item de um flex-column, o card herdava
       `flex-shrink: 1` e era ESPREMIDO até a altura do popover (640px para
       um formulário de 1331px). Encolhido, ele não transborda — e quem rola
       (`.gate-root--rolavel`) nunca tem o que rolar.
     - `overflow: visible`: `.gate-card` traz `overflow: hidden` por causa da
       barrinha colorida do topo, que no modo compacto nem existe. Espremido
       E com overflow hidden, o card CORTAVA o resto do formulário em
       silêncio. */
  flex: none;
  overflow: visible;
}
.gate-root--compacto .gate-card--form {
  padding: 0 0 4px;
}
/* Uma coluna sempre: 364px nunca cabe duas. */
.gate-root--compacto .form-grid {
  grid-template-columns: 1fr;
  gap: 14px;
}
.gate-root--compacto .gate-icon {
  width: 40px;
  height: 40px;
}
.gate-root--compacto .btn-google {
  width: 100%;
  justify-content: center;
  padding: 13px 18px;
}
.gate-root--compacto .form-section-title {
  font-size: 11.5px;
  margin-top: 22px !important;
}
.gate-root--compacto .field {
  padding: 11px 13px;
  font-size: 14px;
}
.gate-root--compacto select.field {
  padding: 12px 40px 12px 14px;
  border-radius: 14px;
}
.gate-root--compacto .lgpd-check {
  margin-top: 18px !important;
  padding: 13px 14px;
}
.gate-root--compacto .lgpd-check span { font-size: 12px; }
</style>
