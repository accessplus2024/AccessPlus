<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from "vue"
import { LogOut } from "@iconoir/vue"
import { useAuth } from "~/composables/useAuth"
import { useProfile } from "~/composables/useProfile"

const { user, init, signOut } = useAuth()
const { profile, fetchProfile, resetProfile, saveProfile } = useProfile()

const aberto = ref(false)
const raiz = ref(null)

// Edição de cadastro (pedido da mantenedora, 2026-08-24): antes disso não
// havia NENHUM jeito de corrigir um dado depois do cadastro inicial em
// AccessGate.vue (aquele formulário só aparece uma vez, antes de
// `cadastroCompleto` ficar true, e nunca de novo). Reaproveita o mesmo
// `saveProfile()` (upsert) — só muda de onde o formulário é aberto.
const editando = ref(false)
const enviandoEdicao = ref(false)
const erroEdicao = ref(null)
const formEdicao = ref({
  name: "", age: "", phone: "", school: "", schoolType: "", educationLevel: "",
  city: "", state: "", income: "", lgpdConsent: false,
})

const niveisEdicao = [
  { key: "fundamental", label: "Ensino Fundamental" },
  { key: "medio", label: "Ensino Médio" },
  { key: "superior_cursando", label: "Ensino Superior (cursando)" },
  { key: "superior_completo", label: "Ensino Superior (completo)" },
  { key: "pos", label: "Pós-graduação" },
]
const faixasRendaEdicao = [
  { key: "ate_1", label: "Até 1 salário mínimo" },
  { key: "1_2", label: "De 1 a 2 salários mínimos" },
  { key: "2_3", label: "De 2 a 3 salários mínimos" },
  { key: "3_5", label: "De 3 a 5 salários mínimos" },
  { key: "acima_5", label: "Acima de 5 salários mínimos" },
]
const tiposEscolaEdicao = [
  { key: "publica_estadual", label: "Pública Estadual" },
  { key: "publica_municipal", label: "Pública Municipal" },
  { key: "publica_federal", label: "Pública Federal" },
  { key: "privada", label: "Privada" },
  { key: "privada_bolsa", label: "Privada com bolsa" },
]
const estadosEdicao = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
]

function abrirEdicaoPerfil() {
  // Pré-preenche com o que já está salvo — o aluno só corrige o que
  // precisa, não redigita tudo de novo.
  formEdicao.value = {
    name: profile.value?.name || "",
    age: profile.value?.age ?? "",
    phone: profile.value?.phone || "",
    school: profile.value?.school || "",
    schoolType: profile.value?.school_type || "",
    educationLevel: profile.value?.education_level || "",
    city: profile.value?.city || "",
    state: profile.value?.state || "",
    income: profile.value?.income || "",
    // Já aceitou o termo uma vez pra ter um cadastro completo — reafirmar
    // a cada edição evitaria fricção sem ganho real de proteção (LGPD não
    // exige reconsentimento pra corrigir um dado já autorizado).
    lgpdConsent: true,
  }
  erroEdicao.value = null
  editando.value = true
  aberto.value = false
}

async function salvarEdicaoPerfil() {
  erroEdicao.value = null
  enviandoEdicao.value = true
  const r = await saveProfile(user.value, formEdicao.value)
  enviandoEdicao.value = false
  if (!r.ok) {
    erroEdicao.value = r.error
    return
  }
  editando.value = false
}

onMounted(() => {
  init()
  if (user.value) fetchProfile(user.value.id)
  document.addEventListener("click", fecharFora)
})
onBeforeUnmount(() => document.removeEventListener("click", fecharFora))

watch(user, (novo) => {
  if (novo) fetchProfile(novo.id)
  else resetProfile()
})

function fecharFora(e) {
  if (raiz.value && !raiz.value.contains(e.target)) aberto.value = false
}

function iniciais(nome = "") {
  return nome.trim().charAt(0).toUpperCase() || "?"
}

const rotulosEscolaridade = {
  fundamental: "Ensino Fundamental",
  medio: "Ensino Médio",
  superior_cursando: "Ensino Superior (cursando)",
  superior_completo: "Ensino Superior (completo)",
  pos: "Pós-graduação",
}

const rotulosTipoEscola = {
  publica_estadual: "Pública Estadual",
  publica_municipal: "Pública Municipal",
  publica_federal: "Pública Federal",
  privada: "Privada",
  privada_bolsa: "Privada com bolsa",
}

async function sair() {
  await signOut()
  aberto.value = false
}
</script>

<template>
  <div v-if="user" ref="raiz" class="user-menu">
    <button class="avatar-btn" @click="aberto = !aberto">
      <img
        v-if="user.user_metadata?.avatar_url || user.user_metadata?.picture"
        :src="user.user_metadata.avatar_url || user.user_metadata.picture"
        :alt="user.user_metadata?.full_name || 'Você'"
        referrerpolicy="no-referrer"
      />
      <span v-else class="avatar-fallback">{{ iniciais(user.user_metadata?.full_name || user.user_metadata?.name) }}</span>
    </button>

    <Transition name="pop">
      <div v-if="aberto" class="panel">
        <div class="panel-head">
          <img
            v-if="user.user_metadata?.avatar_url || user.user_metadata?.picture"
            :src="user.user_metadata.avatar_url || user.user_metadata.picture"
            :alt="user.user_metadata?.full_name || 'Você'"
            referrerpolicy="no-referrer"
          />
          <span v-else class="avatar-fallback">{{ iniciais(user.user_metadata?.full_name || user.user_metadata?.name) }}</span>
          <div class="min-w-0">
            <div class="panel-name">{{ profile?.name || user.user_metadata?.full_name || "Você" }}</div>
            <div class="panel-email">{{ user.email }}</div>
          </div>
        </div>

        <div v-if="profile" class="panel-data">
          <div class="data-row"><span>Idade</span><strong>{{ profile.age || "—" }}</strong></div>
          <div class="data-row"><span>Telefone</span><strong>{{ profile.phone || "—" }}</strong></div>
          <div class="data-row"><span>Escola</span><strong>{{ profile.school || "—" }}</strong></div>
          <div class="data-row"><span>Tipo de escola</span><strong>{{ rotulosTipoEscola[profile.school_type] || "—" }}</strong></div>
          <div class="data-row"><span>Escolaridade</span><strong>{{ rotulosEscolaridade[profile.education_level] || "—" }}</strong></div>
          <div class="data-row"><span>Cidade/UF</span><strong>{{ profile.city ? `${profile.city}/${profile.state || "—"}` : "—" }}</strong></div>
        </div>
        <p v-else class="panel-pending">
          Cadastro ainda não concluído — complete ao abrir uma oportunidade.
        </p>

        <NuxtLink v-if="profile" to="/minhas-oportunidades" class="edit-btn mt-3" @click="aberto = false">
          Minhas oportunidades
        </NuxtLink>

        <NuxtLink to="/minhas-oportunidades-enviadas" class="edit-btn mt-2" @click="aberto = false">
          Oportunidades que enviei
        </NuxtLink>

        <button v-if="profile" class="edit-btn mt-2" @click="abrirEdicaoPerfil">
          Editar cadastro
        </button>

        <button class="logout-btn" @click="sair">
          <LogOut class="w-[16px] h-[16px]" /> Sair
        </button>
      </div>
    </Transition>

    <!-- Edição de cadastro: modal simples, disponível em qualquer página
    (não depende de estar dentro de um AccessGate na página atual). -->
    <Teleport to="body">
      <div v-if="editando" class="edicao-overlay" @click.self="editando = false">
        <div class="edicao-modal">
          <!-- Cabeçalho FORA da área que rola: quando o formulário não cabe,
               o título continua visível e o aluno não perde a referência de
               onde está. -->
          <div class="edicao-cabecalho">
            <h3 class="font-display" style="font-size: 22px">Editar cadastro</h3>
            <p class="edicao-subtitulo text-ink/60 mt-1" style="font-size: 14px">
              Atualize seus dados — usamos isso pra recomendar oportunidades melhores pra você.
            </p>
          </div>

          <div class="edicao-corpo">
          <p class="form-section-title">Dados pessoais</p>
          <div class="form-grid">
            <label class="field-label">
              Nome completo
              <input v-model="formEdicao.name" class="field" type="text" placeholder="Seu nome" />
            </label>
            <label class="field-label">
              Idade
              <input v-model="formEdicao.age" class="field" type="number" min="5" max="100" placeholder="Sua idade" />
            </label>
            <label class="field-label">
              Telefone (com DDD)
              <input v-model="formEdicao.phone" class="field" type="tel" placeholder="(11) 91234-5678" />
            </label>
            <label class="field-label">
              Renda familiar <span class="text-ink/45">(opcional)</span>
              <select v-model="formEdicao.income" class="field field--select">
                <option value="">Prefiro não informar</option>
                <option v-for="f in faixasRendaEdicao" :key="f.key" :value="f.key">{{ f.label }}</option>
              </select>
            </label>
          </div>

          <p class="form-section-title">Escola e localização</p>
          <div class="form-grid">
            <label class="field-label">
              Escola
              <input v-model="formEdicao.school" class="field" type="text" placeholder="Nome da sua escola" />
            </label>
            <label class="field-label">
              Tipo de escola
              <select v-model="formEdicao.schoolType" class="field field--select">
                <option value="" disabled>Selecione...</option>
                <option v-for="t in tiposEscolaEdicao" :key="t.key" :value="t.key">{{ t.label }}</option>
              </select>
            </label>
            <label class="field-label">
              Escolaridade
              <select v-model="formEdicao.educationLevel" class="field field--select">
                <option value="" disabled>Selecione...</option>
                <option v-for="n in niveisEdicao" :key="n.key" :value="n.key">{{ n.label }}</option>
              </select>
            </label>
            <label class="field-label">
              Cidade
              <input v-model="formEdicao.city" class="field" type="text" placeholder="Sua cidade" />
            </label>
            <label class="field-label">
              Estado
              <select v-model="formEdicao.state" class="field field--select">
                <option value="" disabled>Selecione...</option>
                <option v-for="uf in estadosEdicao" :key="uf" :value="uf">{{ uf }}</option>
              </select>
            </label>
          </div>

          <p v-if="erroEdicao" class="mt-3" style="color: #E24444; font-size: 13.5px">{{ erroEdicao }}</p>
          </div>

          <!-- Ações FORA da área que rola. Este era o problema concreto: com o
               modal inteiro rolando, "Salvar alterações" ficava abaixo da
               dobra, e o aluno tinha de descobrir que precisava rolar pra
               salvar. Botão de confirmar que se esconde é um botão que não
               existe. -->
          <div class="edicao-acoes">
            <button class="edit-btn edit-btn--secundario" :disabled="enviandoEdicao" @click="editando = false">
              Cancelar
            </button>
            <button class="btn btn-ink" :disabled="enviandoEdicao" @click="salvarEdicaoPerfil">
              {{ enviandoEdicao ? "Salvando..." : "Salvar alterações" }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.user-menu {
  position: relative;
}
.avatar-btn {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  overflow: hidden;
  border: 2px solid color-mix(in srgb, var(--color-ink) 12%, transparent);
  flex: none;
  transition: border-color 0.2s ease;
}
.avatar-btn:hover { border-color: var(--color-ink); }
.avatar-btn img { width: 100%; height: 100%; object-fit: cover; display: block; }
.avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: color-mix(in srgb, var(--color-primary) 14%, transparent);
  color: var(--color-primary);
  font-family: var(--font-display, inherit);
  font-size: 15px;
}

.panel {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 280px;
  padding: 18px;
  border-radius: 18px;
  border: 2px solid color-mix(in srgb, var(--color-ink) 10%, transparent);
  background: #fff;
  box-shadow: 0 20px 40px rgba(21, 17, 31, 0.14);
  z-index: 60;
  /* Coluna com teto de altura: as seis linhas de dados são a parte que estica,
     e são justamente a parte descartável. Botões ficam fora da área que rola
     (ver `.panel-data` e `flex: none` abaixo) para que "Sair" NUNCA saia da
     vista — era o bug: no celular o painel crescia até empurrar o botão para
     fora da tela e o aluno não conseguia deslogar. */
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 120px);
  max-height: calc(100dvh - 120px);
}
.panel-head, .panel-pending, .edit-btn, .logout-btn { flex: none; }
.panel-data { flex: 1 1 auto; min-height: 0; overflow-y: auto; scrollbar-width: thin; scrollbar-color: #999999 var(--color-paper); }

/* Celular: o painel sai de "pendurado no avatar" e vira uma folha ancorada na
   base da janela. Dentro do drawer lateral (288px de largura) o painel de
   280px ancorado no avatar já nascia perto do rodapé e caía para fora da tela;
   ancorado embaixo, ele sempre cabe, e o botão "Sair" fica no lugar mais fácil
   de alcançar com o polegar. */
@media (max-width: 768px) {
  .panel {
    position: fixed;
    top: auto;
    bottom: 12px;
    left: 12px;
    right: 12px;
    width: auto;
    max-height: 70dvh;
    z-index: 90;
  }
}
.panel-head {
  display: flex;
  align-items: center;
  gap: 12px;
}
.panel-head img, .panel-head .avatar-fallback {
  width: 44px;
  height: 44px;
  border-radius: 999px;
  object-fit: cover;
  flex: none;
}
.panel-name {
  font-weight: 700;
  font-size: 15px;
  color: var(--color-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.panel-email {
  font-size: 12.5px;
  color: color-mix(in srgb, var(--color-ink) 55%, transparent);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.panel-data {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid color-mix(in srgb, var(--color-ink) 8%, transparent);
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.data-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  font-size: 13px;
}
.data-row span { color: color-mix(in srgb, var(--color-ink) 55%, transparent); }
.data-row strong { color: var(--color-ink); text-align: right; }

.panel-pending {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid color-mix(in srgb, var(--color-ink) 8%, transparent);
  font-size: 12.5px;
  color: color-mix(in srgb, var(--color-ink) 55%, transparent);
  line-height: 1.5;
}

.logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  margin-top: 16px;
  padding: 10px;
  border-radius: 999px;
  border: 2px solid color-mix(in srgb, var(--color-ink) 12%, transparent);
  font-weight: 600;
  font-size: 13.5px;
  color: var(--color-ink);
  transition: border-color 0.2s ease;
}
.logout-btn:hover { border-color: var(--color-ink); }

.pop-enter-active, .pop-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.pop-enter-from, .pop-leave-to { opacity: 0; transform: translateY(-6px); }

.edit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 10px;
  border-radius: 999px;
  border: 2px solid color-mix(in srgb, var(--color-primary) 30%, transparent);
  background: color-mix(in srgb, var(--color-primary) 8%, transparent);
  font-weight: 600;
  font-size: 13.5px;
  color: var(--color-primary);
  transition: border-color 0.2s ease, background 0.2s ease;
}
.edit-btn:hover { border-color: var(--color-primary); background: color-mix(in srgb, var(--color-primary) 14%, transparent); }
.edit-btn--secundario {
  border-color: color-mix(in srgb, var(--color-ink) 12%, transparent);
  background: transparent;
  color: var(--color-ink);
}
.edit-btn--secundario:hover { border-color: var(--color-ink); background: transparent; }

/* Modal de edição — mesmo vocabulário visual do formulário de cadastro em
AccessGate.vue, mas com sua própria cópia de CSS: aquele bloco é <style
scoped>, então essas classes não vazam pra fora do componente original. */
.edicao-overlay {
  position: fixed;
  inset: 0;
  background: rgba(21, 17, 31, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 200;
}
.edicao-modal {
  /* Mais largo (560 → 760): a causa raiz da barra de rolagem não era a altura
     máxima, era a LARGURA. Com 560px o formulário de 9 campos cabia em 2
     colunas, o que dá 5 linhas e uma altura que estoura um laptop comum.
     A 760px o grid abaixo passa a 3 colunas e as mesmas 9 fichas ocupam 4
     linhas — cabe sem rolar. Subir o teto de altura (a tentativa anterior,
     de 720px para 96vh) só faz a barra aparecer mais tarde; alargar faz ela
     não precisar existir. */
  width: min(760px, 100%);
  /* `calc(100dvh - 40px)` e não `96vh`, por dois motivos concretos:
     - os 40px são o padding do overlay. Com 96vh o modal podia ficar MAIS
       ALTO que o espaço que o overlay dava (a 800px de viewport, 768px de
       modal em 760px disponíveis), e aí o overlay é que passava a rolar.
     - `dvh` acompanha a barra do navegador no celular, que aparece e
       desaparece durante o scroll; com `vh` o modal fica alto demais
       justamente quando a barra está visível. */
  max-height: calc(100vh - 40px);
  max-height: calc(100dvh - 40px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
  border-radius: 22px;
  padding: 24px;
  text-align: left;
  box-shadow: 0 30px 60px rgba(21, 17, 31, 0.25);
  /* Container query em vez de media query: o grid abaixo reage à largura do
     MODAL, não da janela. Foi o mesmo bug do AccessGate — a media query media
     a janela e nunca disparava dentro de um contêiner estreito. */
  container-type: inline-size;
  container-name: edicao;
}
.edicao-cabecalho { flex: none; }
/* Só o corpo rola, e só quando precisa. `min-height: 0` é obrigatório num
   filho de flex-column que precisa encolher — sem isso o flex dá a ele a
   altura do conteúdo inteiro e o `overflow-y` nunca age. */
.edicao-corpo {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  /* O ritmo vertical foi apertado até o formulário caber num laptop de 720px
     de altura — o alvo, medido, era fechar uma folga de 41px. Não é aperto
     estético: cada valor abaixo saiu de rodar a medição de novo. */
  padding: 12px 2px 2px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  scrollbar-width: thin;
}
.edicao-acoes {
  flex: none;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 14px;
  border-top: 1px solid color-mix(in srgb, var(--color-ink) 8%, transparent);
}
.edicao-acoes .btn,
.edicao-acoes .edit-btn {
  width: auto;
  padding: 12px 22px;
}

.form-section-title {
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 12.5px;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--color-primary);
  padding-bottom: 6px;
  border-bottom: 2px solid color-mix(in srgb, var(--color-primary) 16%, transparent);
}
/* `auto-fit` + `minmax` em vez de `1fr 1fr` fixo: o número de colunas passa a
   sair da largura disponível — 3 colunas a 760px, 2 por volta de 500px, 1 no
   celular — sem precisar de um breakpoint pra cada caso. */
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 12px;
  /* Alinha pelo FUNDO, não pelo topo: o rótulo "Renda familiar (opcional)"
     quebra em duas linhas na largura de uma coluna, e com alinhamento no topo
     o campo dele descia sozinho, desalinhado dos vizinhos da mesma fileira.
     Alinhando pelo fundo, os campos ficam sempre na mesma linha de base
     independentemente de o rótulo ter uma ou duas linhas. */
  align-items: end;
}
.form-grid + .form-section-title { margin-top: 2px; }
.field-label--full { grid-column: 1 / -1; }
.field-label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13.5px;
  font-weight: 600;
  color: color-mix(in srgb, var(--color-ink) 75%, transparent);
}
.field {
  padding: 9px 14px;
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
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 18%, transparent);
}

/* 2026-08-24, a pedido da mantenedora: select nativo do navegador (cantos
   quadrados, seta genérica do SO) não tinha "a cara do Access" — aqui vira
   um pill bem redondo com seta própria embutida no fundo, no mesmo
   vocabulário visual dos chips/botões do resto do site. */
.field--select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  border-radius: 999px;
  padding-right: 40px;
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2315111F' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;
}

/* Janela baixa (notebook antigo, navegador com muitas barras): a linha
   explicativa sob o título é a primeira coisa a sair. Ela é útil, mas custa
   ~40px — e 40px aqui é a diferença entre o formulário caber e o aluno ter de
   rolar pra preencher. O título sozinho já diz o que a tela é. */
@media (max-height: 700px) {
  .edicao-subtitulo { display: none; }
  .edicao-modal { padding: 18px 20px; }
  .edicao-corpo { gap: 10px; padding-top: 10px; }
}

@container edicao (max-width: 420px) {
  .form-grid { grid-template-columns: 1fr; }
}
/* Fallback para navegador sem container queries. */
@supports not (container-type: inline-size) {
  @media (max-width: 560px) {
    .form-grid { grid-template-columns: 1fr; }
  }
}
@media (max-width: 560px) {
  .edicao-modal { padding: 18px 16px; }
  .edicao-overlay { padding: 12px; }
  .edicao-acoes { flex-direction: column-reverse; }
  .edicao-acoes .btn,
  .edicao-acoes .edit-btn { width: 100%; }
}
</style>
