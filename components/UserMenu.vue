<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from "vue"
import { LogOut } from "@iconoir/vue"
import { useAuth } from "~/composables/useAuth"
import { useProfile } from "~/composables/useProfile"

const { user, init, signOut } = useAuth()
const { profile, fetchProfile, resetProfile } = useProfile()

const aberto = ref(false)
const raiz = ref(null)

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

        <button class="logout-btn" @click="sair">
          <LogOut class="w-[16px] h-[16px]" /> Sair
        </button>
      </div>
    </Transition>
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
</style>
