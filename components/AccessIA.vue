<script setup>
import { ArrowRight, ArrowLeft, Check, Copy, SendDiagonal } from "@iconoir/vue"
import { ref, computed, nextTick, onMounted } from "vue"
import DOMPurify from "isomorphic-dompurify"
import { useAuth } from "~/composables/useAuth"
import { useProfile } from "~/composables/useProfile"

// 2026-08-24 (pedido direto da mantenedora, depois de testar texto livre
// puro no chat de teste e ver os resultados do wizard ficarem "muito
// ruins"): o wizard de 4 etapas (áreas → objetivos → experiência → local)
// foi REMOVIDO. A Accessia agora é um chat: o aluno escreve livremente o que
// procura, recebe oportunidades, e pode mandar outra mensagem pra refinar
// ("não gostei dessas, quero algo mais de humanas") — cada mensagem nova
// entra no HISTÓRICO da conversa (ver `construirPergunta()` abaixo), não
// substitui a anterior. Isso testa de verdade a hipótese "texto livre puro
// funciona melhor" em vez de continuar escondendo texto livre atrás de
// chips — ver docs/decisions.md e docs/analise-pipeline-rag-2026-08-24.md
// pro histórico de por que isso ficou em dúvida.
//
// O que NÃO mudou: nível de ensino e idade continuam vindo automaticamente
// do cadastro (nunca perguntados de novo aqui — profile.value já tem isso),
// e a idade continua sendo um filtro rígido em CÓDIGO
// (server/utils/rag/ageFilter.js), nunca por interpretação de texto livre.
// `localPreferencia` estruturado (o campo que tinha um passo próprio no
// wizard) deixou de existir aqui — o backend já tem uma regex própria pra
// pegar sinal de "não quero viajar pra fora" direto do texto livre
// (NAO_QUER_VIAJAR_REGEX em match.post.js, 2026-08-24), então o sinal não se
// perde, só passou a vir 100% do que o aluno escreve.

// Achado de 2026-08-23: o aluno saía da página (ou a Accessia remontava) e
// perdia a conversa que já tinha, tendo que recomeçar do zero. Guardado em
// sessionStorage (dura a aba, não o dispositivo) só o histórico da conversa
// e as oportunidades já encontradas — nunca dado de identificação do aluno.
const HISTORICO_STORAGE_KEY = 'accessia:historicoChat'

function salvarHistoricoNoStorage(historico) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(HISTORICO_STORAGE_KEY, JSON.stringify(historico))
  } catch (_) { /* storage indisponível (modo privado etc.) — não é crítico, só perde o cache */ }
}

function lerHistoricoDoStorage() {
  if (typeof window === 'undefined') return null
  try {
    const bruto = sessionStorage.getItem(HISTORICO_STORAGE_KEY)
    return bruto ? JSON.parse(bruto) : null
  } catch (_) {
    return null
  }
}

function limparHistoricoDoStorage() {
  if (typeof window === 'undefined') return
  try { sessionStorage.removeItem(HISTORICO_STORAGE_KEY) } catch (_) { /* ok, já não tinha nada crítico salvo */ }
}

const emit = defineEmits(['resultado'])

// `embutido`: quando true, esconde o toggle-bar interno e mantém o painel
// sempre aberto — usado quando outra coisa por fora já controla
// abrir/fechar (o ícone redondo de components/AccessIAWidget.vue, Parte 2
// do plano: "Botão Accessia" único que escolhe entre os dois modos). Sem a
// prop (default false), o componente continua se comportando como sempre
// se comportou: seu próprio toggle-bar/painel, usado hoje pelo card
// embutido na home (components/home/Header.vue).
const props = defineProps({
  embutido: { type: Boolean, default: false },
})

// Este componente só é montado dentro de <AccessGate>, que já garante login
// + cadastro completo antes de revelar o slot — então aqui a gente só
// CONSOME a sessão (useAuth já foi inicializada globalmente em
// plugins/supabase-auth.client.js), não precisa checar de novo.
const { user } = useAuth()

// Idade real do cadastro (`profiles.age`, Parte 3 do plano — nunca inferida
// de série/nível). `useProfile` é estado compartilhado (mesmo módulo que o
// AccessGate já usou pra revelar este slot), então aqui só lemos o que já
// foi buscado — sem chamada nova ao Supabase.
const { profile } = useProfile()

// Um id por "sessão de uso" do widget (não por aluno). Ainda é enviado ao
// backend, que o usa para agrupar as buscas desta visita nos logs do
// servidor. Gerado uma vez por montagem do componente, não persistido.
const sessionId = typeof crypto !== 'undefined' && crypto.randomUUID
  ? crypto.randomUUID()
  : `${Date.now()}-${Math.random().toString(36).slice(2)}`

const aberto = ref(props.embutido)

const carregando = ref(false)
const erro = ref(null)

// Cada item: { role: 'estudante', texto } ou
// { role: 'accessia', oportunidades, sobrecarga, semResultado, mensagemSemResultado }
const historico = ref([])
const mensagemAtual = ref('')
const areaMensagens = ref(null)
const textareaRef = ref(null)

// 2026-08-24 (redesign do chat): trocamos as mensagens rotativas por um
// indicador de "digitando" (3 pontinhos, padrão de qualquer chat) — mais
// leve visualmente e não depende de um texto novo aparecer a cada 2.2s pra
// não parecer travado. `carregando` (já existia) já é suficiente pra
// controlar isso, sem precisar de timer nenhum.

// Sugestões só pra ajudar quem não sabe por onde começar a escrever — são
// texto livre de verdade (preenchem a caixa e enviam), não voltam a ser um
// wizard de botões fixos.
const sugestoesIniciais = [
  'Tenho 16 anos, gosto de biologia e queria uma olimpíada gratuita',
  'Quero um programa de robótica, sou de escola pública',
  'Procuro bolsa ou intercâmbio de verão fora do Brasil',
  'Quero competir em uma olimpíada de matemática',
]

function usarSugestao(texto) {
  mensagemAtual.value = texto
  enviarMensagem()
}

// Textarea cresce com o texto (até o limite em CSS, max-height) em vez de
// ficar com scroll interno numa caixa de 1 linha só.
function autoajustarTextarea() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

// Texto curto (negrito/itálico apenas, sem parsing de link) → HTML seguro.
// Usado nos cartões de oportunidade, que já são um <a> (NuxtLink) inteiro —
// um link aninhado dentro de outro link seria HTML inválido, então aqui a
// gente propositalmente NÃO interpreta [texto](url) como no markdown normal.
function textoSeguro(texto = '') {
  const escapar = (s) => s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return escapar(texto)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
}

// Defesa em profundidade: mesmo escapando HTML antes de montar as tags,
// passamos pelo DOMPurify — o texto vem do LLM (generate.js no backend),
// então tratamos como conteúdo não confiável até prova em contrário.
function explicacaoHtml(texto) {
  return texto ? DOMPurify.sanitize(textoSeguro(texto)) : ''
}

// Emoji da ressalva (`caveats`, texto livre gerado pelo backend em
// generate.js) varia pelo TIPO de aviso, em vez de sempre ⚠️ — pedido da
// mantenedora (2026-08-24). O texto não vem categorizado do backend (é uma
// frase livre, ver Regra 7/8 do system prompt em generate.js), então
// detectamos por palavra-chave no próprio texto. Ordem importa: checamos
// do mais específico/sério pro mais genérico, e paramos no primeiro que
// bater — uma ressalva sobre inscrição encerrada É mais urgente que uma
// sobre custo, por exemplo, mesmo que a frase mencione os dois.
const REGRAS_EMOJI_RESSALVA = [
  { re: /encerrad/i, emoji: '⛔' }, // inscrições encerradas — não dá pra se inscrever agora
  { re: /viagem internacional|no exterior|fora do (brasil|país)/i, emoji: '✈️' }, // exige viagem/estudo fora
  { re: /prazo|inscri[çc][ãa]o|inscri[çc][õo]es/i, emoji: '📅' }, // prazo/data de inscrição
  { re: /gratuit|bolsa|financiad|isen/i, emoji: '💰' }, // ressalva sobre custo, mas no sentido "é de graça"
  { re: /pago|taxa|mensalidade/i, emoji: '💳' }, // ressalva sobre custo pago
  { re: /não confirmado|não est[áa] confirmad/i, emoji: 'ℹ️' }, // dado ausente, sem confirmação
]

function emojiRessalva(texto = '') {
  const encontrada = REGRAS_EMOJI_RESSALVA.find(({ re }) => re.test(texto))
  return encontrada ? encontrada.emoji : '⚠️' // fallback genérico pra qualquer outro tipo de ressalva
}

// Cores da marca — cada cartão recebe um acento diferente, ciclando.
const acentos = ['#4B3FE4', '#FF2D8A', '#C8F135', '#7DECE9', '#FF7A45', '#8BC34A']
function acento(i) { return acentos[i % acentos.length] }

// Copiar resultado (título + link de cada oportunidade) da ÚLTIMA resposta
// da Accessia — numa conversa com várias mensagens, é a que o aluno está
// olhando agora que faz sentido copiar.
const copiado = ref(false)
let copiadoTimer = null
const ultimaResposta = computed(() => [...historico.value].reverse().find(h => h.role === 'accessia') || null)
async function copiarResultado() {
  const ops = ultimaResposta.value?.oportunidades || []
  if (!ops.length) return
  const base = typeof window !== 'undefined' ? window.location.origin : ''
  // `titulo` é a chave que a API devolve (o card usa a mesma). Ler `.title`
  // aqui gerava "• undefined — /oportunidade/9" em toda linha copiada.
  const linhas = ops.map(o => `• ${o.titulo || o.title || 'Oportunidade'} — ${base}/oportunidade/${o.id}`)
  const texto = `Oportunidades selecionadas pela AccessIA:\n\n${linhas.join('\n')}`
  try {
    await navigator.clipboard.writeText(texto)
    copiado.value = true
    if (copiadoTimer) clearTimeout(copiadoTimer)
    copiadoTimer = setTimeout(() => { copiado.value = false }, 2000)
  } catch (_) { /* navegador sem permissão de clipboard */ }
}

// Restaura a conversa desta sessão de aba, se existir — resolve o aluno
// "perder" a conversa ao sair da página e voltar.
onMounted(() => {
  const salvo = lerHistoricoDoStorage()
  if (Array.isArray(salvo) && salvo.length > 0) {
    historico.value = salvo
  }
  rolarParaFinal()
})

function rolarParaFinal() {
  nextTick(() => {
    if (areaMensagens.value) areaMensagens.value.scrollTop = areaMensagens.value.scrollHeight
  })
}

// Nível de ensino: continua vindo só do cadastro (profile.education_level),
// nunca perguntado de novo aqui — mesma lógica de antes do chat existir.
//
// CORRIGIDO 2026-08-24 (bug real de produção, achado pela mantenedora):
// a primeira versão mapeava superior_cursando/superior_completo/pós pra
// "gap" — errado. "Gap Year" no catálogo significa "acabou de terminar o
// ensino médio, tirando um ano antes da faculdade" (público de programas
// como Bolsa Crimson e Programa Oportunidades Acadêmicas, que pedem
// explicitamente "estudante de último ano do Ensino Médio"), não "já está
// ou já passou pela faculdade". Agora só mapeia o que realmente bate; o
// resto vira uma frase explícita sobre a situação real do aluno (ver
// `situacaoAtualTexto` abaixo).
function nivelFromProfile() {
  const nivel = profile.value?.education_level
  if (nivel === 'fundamental') return 'Ensino Fundamental'
  if (nivel === 'medio') return 'Ensino Médio'
  return null
}

// Frase sobre a situação atual do aluno quando ela NÃO cai em nenhum nível
// do catálogo (fundamental/médio) — em vez de simplesmente omitir, diz a
// verdade pro modelo poder usar (Regra 4.1 do system prompt em generate.js).
function situacaoAtualTexto() {
  const nivel = profile.value?.education_level
  if (nivel === 'superior_cursando') return 'Já estou cursando a faculdade'
  if (nivel === 'superior_completo') return 'Já concluí a faculdade'
  if (nivel === 'pos') return 'Estou em pós-graduação'
  return null
}

// Contexto fixo do cadastro (nível + idade) — igual a antes, só que agora
// prefixa o HISTÓRICO da conversa em vez de um formulário de uma vez só.
function contextoDoCadastro() {
  const nivelTexto = nivelFromProfile()
    ? `Sou estudante do ${nivelFromProfile()}.`
    : situacaoAtualTexto()
      ? `${situacaoAtualTexto()} (não estou mais no ensino fundamental ou médio).`
      : 'Meu nível de ensino atual não foi informado.'
  const idadeTexto = profile.value?.age ? ` Tenho ${Number(profile.value.age)} anos.` : ''
  return `${nivelTexto}${idadeTexto}`
}

// 2026-08-24 (segunda revisão): este componente passou de `/api/rag/match`
// para `/api/rag/chat`. O motivo é o sintoma que a mantenedora relatou: "o que
// é MUN?" devolvia 7 oportunidades em vez de explicar o que é um MUN. Não era
// bug de ranking — era o único caminho que existia. `/api/rag/match` SEMPRE
// devolve uma lista de oportunidades, porque é isso que ele faz; não havia
// como o aluno fazer uma pergunta.
//
// `/api/rag/chat` roteia a intenção primeiro. Cinco respostas possíveis, e o
// template abaixo renderiza cada uma:
//   conceito       explica ("o que é MUN?") + mostra exemplos reais do catálogo
//   lista          categoria do catálogo ("quais MUNs vocês têm?")
//   oportunidade   ficha de UMA oportunidade ("qual o prazo da OBA?")
//   pergunta       funil guiado ("não sei o que quero, me ajuda")
//   recomendacoes  o comportamento antigo, agora um caso entre outros
//
// A distinção que faz o roteamento funcionar: `mensagem` leva SÓ o que o aluno
// acabou de escrever, e `contexto` + `historico` levam o resto. Antes,
// `construirPergunta()` concatenava cadastro + todas as mensagens num campo
// só — e com isso "o que é MUN?" chegava no servidor como
// "Estou no Ensino Médio. Tenho 16 anos. o que é MUN?", que não parece mais uma
// pergunta definicional. Ver o comentário em server/api/rag/chat.post.js.
function contextoParaBusca() {
  return contextoDoCadastro()
}

function historicoParaServidor() {
  return historico.value
    .filter((h) => h.role === "estudante" || h.oportunidadeId)
    .map((h) => ({
      papel: h.role === "estudante" ? "aluno" : "accessia",
      texto: h.texto || "",
      // Permite "qual o prazo?" sem dizer de quê: o servidor olha a última
      // oportunidade que esteve em pauta na conversa.
      oportunidadeId: h.oportunidadeId ?? null,
    }))
}

// Estado do funil de exploração. Fica no cliente e volta ao servidor a cada
// passo, de propósito: assim o endpoint continua sem estado e a conversa
// sobrevive a recarregar a página no meio — o que acontece muito em celular
// com conexão ruim, que é como boa parte deste público acessa.
const coletadoExploracao = ref(null)

// Normaliza a resposta do /api/rag/chat numa entrada de histórico. Manter isso
// numa função só evita a armadilha de espalhar `if (data.tipo === ...)` pelo
// componente e esquecer um dos cinco casos em algum lugar.
function respostaParaHistorico(data) {
  const base = { role: "accessia", tipo: data.tipo, texto: data.texto || "", sugestoes: data.sugestoes || [] }

  if (data.tipo === "conceito") {
    return { ...base, exemplos: data.exemplos || [] }
  }
  if (data.tipo === "lista") {
    return { ...base, itens: data.itens || [] }
  }
  if (data.tipo === "oportunidade") {
    return { ...base, ficha: data.ficha, oportunidadeId: data.oportunidadeId }
  }
  if (data.tipo === "pergunta") {
    return { ...base, opcoes: data.opcoes || [], campo: data.campo, multipla: !!data.multipla, passo: data.passo }
  }
  if (data.tipo === "recomendacoes") {
    return { ...base, oportunidades: data.recomendacoes || [], sobrecarga: !!data.generationDegraded }
  }
  if (data.tipo === "sem_resultado") {
    return { ...base, semResultado: true, mensagemSemResultado: data.texto }
  }
  // "texto" (saudação) e "precisa_login" caem aqui: só o texto basta.
  return base
}

async function chamarChat(corpo) {
  const data = await $fetch("/api/rag/chat", {
    method: "POST",
    body: {
      sessionId,
      userId: user.value?.id ?? null,
      contexto: contextoParaBusca(),
      historico: historicoParaServidor(),
      coletado: coletadoExploracao.value,
      // Só o que o cadastro (`AccessGate.vue`) de fato coleta. `areas` e
      // `linguas` saíram em 2026-08-25: as colunas existiam em `profiles`,
      // mas o formulário nunca as pediu — estavam em array vazio nos 62
      // cadastros reais, e foram removidas do banco. Enviar campo que é
      // sempre vazio faz o pipeline parecer ter um sinal que não tem.
      //
      // O idioma do ALUNO, portanto, não é conhecido hoje. O que sobra é o
      // idioma inferido do título da oportunidade (`sinais.js`) — e é por
      // isso que `bIdiomaPenal` fica em 0,8 e não mais alto: não se pune com
      // confiança um sinal adivinhado. Se um dia o cadastro voltar a pedir
      // idioma, este é o lugar de reconectar.
      perfil: {
        age: profile.value?.age ? Number(profile.value.age) : null,
        nivel: profile.value?.education_level ?? null,
      },
      ...corpo,
    },
  })

  // O servidor devolve o estado do funil a cada passo; guardamos pra mandar de
  // volta no próximo. `undefined` significa "não é um passo de funil" — aí não
  // mexemos no que já tínhamos.
  if (data.coletado !== undefined) coletadoExploracao.value = data.coletado

  const resposta = respostaParaHistorico(data)
  historico.value.push(resposta)
  emit("resultado", resposta)
  salvarHistoricoNoStorage(historico.value)
  return resposta
}

// Clique numa das opções do funil de exploração.
async function responderOpcao(item, opcao) {
  if (carregando.value) return
  historico.value.push({ role: "estudante", texto: opcao.rotulo })
  rolarParaFinal()
  carregando.value = true
  erro.value = null
  try {
    await chamarChat({ resposta: { campo: item.campo, valores: [opcao.valor] } })
  } catch (e) {
    tratarErro(e)
  } finally {
    carregando.value = false
    nextTick(rolarParaFinal)
  }
}

async function enviarMensagem() {
  const texto = mensagemAtual.value.trim()
  if (!texto || carregando.value) return

  historico.value.push({ role: 'estudante', texto })
  mensagemAtual.value = ''
  nextTick(autoajustarTextarea) // volta a caixa pro tamanho de 1 linha depois de limpar
  rolarParaFinal()

  carregando.value = true
  erro.value = null

  try {
    await chamarChat({ mensagem: texto })
  } catch (e) {
    tratarErro(e)
  } finally {
    carregando.value = false
    nextTick(rolarParaFinal)
  }
}

function tratarErro(e) {
    const status = e?.response?.status || e?.status || e?.statusCode
    const payload = e?.data
    // 401 = não logado (não deveria acontecer aqui, já que o AccessGate só
    // revela este componente pra quem está logado — mas o backend confere
    // de novo, por segurança).
    if (status === 401) {
      erro.value = 'Você precisa entrar com sua conta para usar a Accessia.'
    } else if (status === 429) {
      // 429 = limite básico por IP (abuso, ver server/utils/rateLimit.js).
      // Não existe mais cota mensal por aluno — removida em 2026-08-25.
      erro.value = payload?.statusMessage || 'Muitas buscas em pouco tempo por aqui — espera um minutinho e tenta de novo 🙂'
    } else if (status === 504) {
      // 504 = a busca demorou demais (tempo limite do servidor).
      erro.value = 'A busca demorou mais que o esperado. Tenta de novo, por favor 🙂'
    } else {
      console.error('Erro completo:', e)
      erro.value = payload?.statusMessage || payload?.error || e?.message || 'Algo deu errado ao buscar suas oportunidades. Tenta de novo?'
    }
}

function recomecar() {
  historico.value = []
  erro.value = null
  mensagemAtual.value = ''
  // Zera também o funil de exploração — senão "recomeçar" voltava para a
  // pergunta 3 de uma conversa que não existe mais.
  coletadoExploracao.value = null
  nextTick(autoajustarTextarea)
  limparHistoricoDoStorage()
}
</script>

<template>
  <div class="accessia">

    <!-- ================= TOGGLE (fechado) ================= -->
    <!-- Escondido quando embutido: quem controla abrir/fechar é o ícone
         redondo por fora (AccessIAWidget.vue). -->
    <button v-if="!embutido" class="toggle-bar" @click="aberto = !aberto">
      <span class="flex items-center gap-2">
        <span class="toggle-dot" />
        <span class="font-display" style="font-size: 18px">AccessIA</span>
        <span class="badge-beta">versão teste</span>
      </span>
      <ArrowRight class="w-[18px] h-[18px] toggle-arrow" :class="{ open: aberto }" />
    </button>

    <!-- ================= PAINEL (aberto) ================= -->
    <Transition name="expand">
      <div v-if="aberto" class="panel chat-panel" :class="{ 'mt-3': !embutido, 'panel-compacta': embutido }">

        <div class="chat-header">
          <div class="chat-header-title">
            <span class="chat-avatar">
              <Sparkle :size="16" color="#fff" />
            </span>
            <div class="chat-header-text">
              <h2 class="font-display chat-title">Accessia</h2>
              <span class="chat-subtitle">
                <span class="chat-status-dot" /> sua curadora de oportunidades
              </span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              v-if="ultimaResposta?.oportunidades?.length"
              class="icon-btn"
              :class="{ done: copiado }"
              :aria-label="copiado ? 'Copiado' : 'Copiar oportunidades'"
              @click="copiarResultado"
            >
              <component :is="copiado ? Check : Copy" class="w-[15px] h-[15px]" />
            </button>
            <button v-if="historico.length > 0" class="icon-btn" aria-label="Recomeçar conversa" @click="recomecar">
              <ArrowLeft class="w-[15px] h-[15px]" />
            </button>
          </div>
        </div>

        <div ref="areaMensagens" class="chat-mensagens">
          <!-- Estado vazio: nenhuma mensagem ainda. -->
          <div v-if="historico.length === 0" class="chat-vazio">
            <p class="md-prose">
              Me conta o que você procura — pode ser bem livre. Se não souber por onde começar, tenta uma destas:
            </p>
            <div class="chat-sugestoes">
              <button
                v-for="s in sugestoesIniciais"
                :key="s"
                type="button"
                class="chip-sugestao"
                @click="usarSugestao(s)"
              >
                {{ s }}
              </button>
            </div>
          </div>

          <TransitionGroup name="chat-msg" tag="div" class="chat-fluxo">
            <div
              v-for="(item, i) in historico"
              :key="i"
              class="chat-linha"
              :class="item.role === 'estudante' ? 'chat-linha-estudante' : 'chat-linha-accessia'"
            >
              <!-- Mensagem do aluno -->
              <div v-if="item.role === 'estudante'" class="chat-bolha chat-bolha-estudante">
                {{ item.texto }}
              </div>

              <!-- Resposta da Accessia. Cinco formas possíveis, porque a
                   pergunta do aluno tem cinco formas possíveis — antes tudo
                   virava lista de oportunidades, inclusive "o que é MUN?". -->
              <div v-else class="chat-bolha chat-bolha-accessia">

                <!-- Texto corrido: saudação, explicação de conceito, pedido de
                     login, ou "não encontrei nada". -->
                <p v-if="item.texto" class="md-prose">{{ item.texto }}</p>

                <!-- CONCEITO: a explicação vem acompanhada de exemplos REAIS do
                     catálogo. Explicar o que é um MUN sem mostrar os MUNs que
                     existem deixa o trabalho pela metade. -->
                <div v-if="item.exemplos?.length" class="exemplo-list">
                  <p class="exemplo-titulo">No catálogo agora:</p>
                  <NuxtLink
                    v-for="e in item.exemplos"
                    :key="e.id"
                    :to="`/oportunidade/${e.id}`"
                    class="exemplo-item"
                  >
                    <span class="exemplo-nome">{{ e.titulo }}</span>
                    <span v-if="e.custo" class="exemplo-tag">{{ e.custo }}</span>
                    <span v-if="e.inscricoes === 'Aberta'" class="exemplo-tag exemplo-tag--aberta">inscrições abertas</span>
                  </NuxtLink>
                </div>

                <!-- LISTA: categoria inteira do catálogo. -->
                <div v-if="item.itens?.length" class="op-list">
                  <NuxtLink
                    v-for="(o, idx) in item.itens"
                    :key="o.id"
                    :to="`/oportunidade/${o.id}`"
                    class="op-card"
                    :style="{ '--accent': acento(idx) }"
                  >
                    <span class="op-accent" />
                    <div class="op-body">
                      <div class="flex items-start justify-between gap-3">
                        <h3 class="op-title font-display">{{ o.titulo }}</h3>
                        <span class="op-go flex-none"><ArrowRight class="w-[14px] h-[14px]" /></span>
                      </div>
                      <p class="op-meta">
                        <span v-if="o.custo">{{ o.custo }}</span>
                        <span v-if="o.inscricoes">· {{ o.inscricoes }}</span>
                      </p>
                    </div>
                  </NuxtLink>
                </div>

                <!-- OPORTUNIDADE: ficha de uma só. `faltando` é mostrado de
                     propósito — dizer "não temos o prazo registrado" é melhor
                     que omitir e o aluno achar que não existe prazo. -->
                <div v-if="item.ficha" class="ficha">
                  <NuxtLink :to="`/oportunidade/${item.ficha.id}`" class="ficha-titulo">
                    {{ item.ficha.titulo }} <ArrowRight class="w-[13px] h-[13px]" />
                  </NuxtLink>
                  <dl class="ficha-campos">
                    <template v-if="item.ficha.prazo"><dt>Prazo</dt><dd>{{ item.ficha.prazo }}</dd></template>
                    <template v-if="item.ficha.custo"><dt>Custo</dt><dd>{{ item.ficha.custo }}</dd></template>
                    <template v-if="item.ficha.inscricoes"><dt>Inscrições</dt><dd>{{ item.ficha.inscricoes }}</dd></template>
                    <template v-if="item.ficha.quemPodeParticipar"><dt>Quem pode</dt><dd>{{ item.ficha.quemPodeParticipar }}</dd></template>
                  </dl>
                  <p v-if="item.ficha.faltando?.length" class="ficha-faltando">
                    Não temos {{ item.ficha.faltando.join(', ') }} registrado — confere na página oficial.
                  </p>
                </div>

                <!-- PERGUNTA: o funil de "não sei o que quero". Uma pergunta
                     por vez, com opções escritas na língua do aluno. -->
                <div v-if="item.opcoes?.length" class="funil-opcoes">
                  <button
                    v-for="(op, oi) in item.opcoes"
                    :key="oi"
                    type="button"
                    class="chip-sugestao"
                    :disabled="carregando || i !== historico.length - 1"
                    @click="responderOpcao(item, op)"
                  >
                    {{ op.rotulo }}
                  </button>
                </div>

                <!-- RECOMENDAÇÕES -->
                <template v-if="item.oportunidades?.length">
                  <p class="chat-resumo">
                    {{ item.oportunidades.length }} oportunidade{{ item.oportunidades.length === 1 ? '' : 's' }} pra você
                  </p>
                  <div class="op-list">
                    <NuxtLink
                      v-for="(o, idx) in item.oportunidades"
                      :key="o.id"
                      :to="`/oportunidade/${o.id}`"
                      class="op-card"
                      :style="{ '--accent': acento(idx) }"
                    >
                      <span class="op-accent" />
                      <div class="op-body">
                        <div class="flex items-start justify-between gap-3">
                          <h3 class="op-title font-display">{{ o.titulo || o.title }}</h3>
                          <span class="op-go flex-none">
                            <ArrowRight class="w-[14px] h-[14px]" />
                          </span>
                        </div>
                        <!-- "por que combina" no lugar da descrição: a descrição
                             é a mesma pra todo mundo e já está na página da
                             oportunidade. O que só existe aqui é a razão pela
                             qual ELA apareceu pra ESTE aluno. -->
                        <p class="op-why">{{ o.porQueCombina || o.why_it_fits || o.description }}</p>
                        <p v-if="o.ressalvas || o.caveats" class="op-caveat">
                          {{ emojiRessalva(o.ressalvas || o.caveats) }} {{ o.ressalvas || o.caveats }}
                        </p>
                      </div>
                    </NuxtLink>
                  </div>
                </template>

                <!-- Sugestões de próximo passo -->
                <div v-if="item.sugestoes?.length && i === historico.length - 1" class="chat-sugestoes chat-sugestoes--resposta">
                  <button
                    v-for="sg in item.sugestoes"
                    :key="sg"
                    type="button"
                    class="chip-sugestao"
                    @click="usarSugestao(sg)"
                  >
                    {{ sg }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Carregando: indicador de "digitando", padrão de chat -->
            <div v-if="carregando" key="carregando" class="chat-linha chat-linha-accessia">
              <div class="chat-bolha chat-bolha-accessia chat-digitando">
                <span class="typing-dot" />
                <span class="typing-dot" />
                <span class="typing-dot" />
              </div>
            </div>
          </TransitionGroup>
        </div>

        <p v-if="erro" class="chat-erro">{{ erro }}</p>

        <form class="chat-input-bar" @submit.prevent="enviarMensagem">
          <textarea
            ref="textareaRef"
            v-model="mensagemAtual"
            class="chat-textarea"
            rows="1"
            placeholder="Escreve aqui o que você procura..."
            :disabled="carregando"
            @input="autoajustarTextarea"
            @keydown.enter.exact.prevent="enviarMensagem"
          />
          <button type="submit" class="chat-send-btn" :disabled="!mensagemAtual.trim() || carregando" aria-label="Enviar">
            <SendDiagonal class="w-[17px] h-[17px]" />
          </button>
        </form>

      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Wrapper embutido no hero: serve de âncora para o painel flutuante. */
.accessia {
  position: relative;
  width: 100%;
}

.toggle-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 18px 24px;
  border-radius: 20px;
  border: 2px solid color-mix(in srgb, var(--color-ink) 12%, transparent);
  background: #fff;
  transition: border-color .2s ease;
}
.toggle-bar:hover {
  border-color: var(--color-ink);
}
.toggle-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--color-lime);
}
.toggle-arrow {
  transition: transform .25s ease;
}
.toggle-arrow.open {
  transform: rotate(90deg);
}

.badge-beta {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  background: var(--color-lime);
  color: #15111F;
  font-weight: 700;
  font-size: 11px;
  letter-spacing: .02em;
  text-transform: uppercase;
}

.panel {
  padding: 28px 26px;
  border-radius: 20px;
  border: 2px solid color-mix(in srgb, var(--color-ink) 10%, transparent);
  background: #fff;
}

.expand-enter-active, .expand-leave-active {
  transition: opacity .2s ease, transform .2s ease;
}
.expand-enter-from, .expand-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* ===== Chat (2026-08-24: substituiu o wizard de 4 etapas) ===== */
.chat-panel {
  display: flex;
  flex-direction: column;
  height: min(640px, 78vh);
}
.panel-compacta.chat-panel {
  height: min(520px, 70vh);
}
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex: none;
  padding-bottom: 16px;
  border-bottom: 2px solid color-mix(in srgb, var(--color-ink) 8%, transparent);
}
.chat-header-title {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
}
.chat-avatar {
  flex: none;
  width: 34px;
  height: 34px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary), #8B7CFF);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--color-primary) 40%, transparent);
}
.chat-header-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.chat-title {
  font-size: 17px;
  line-height: 1.1;
}
.chat-subtitle {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: color-mix(in srgb, var(--color-ink) 55%, transparent);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.chat-status-dot {
  flex: none;
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--color-lime);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-lime) 30%, transparent);
}

/* Botões-ícone do cabeçalho (copiar / recomeçar) — antes eram botões com
   texto (`.copy-btn`, `.btn-out`); num cabeçalho de chat mais compacto,
   ícones sozinhos com tooltip nativo (aria-label) pesam menos visualmente. */
.icon-btn {
  flex: none;
  width: 34px;
  height: 34px;
  border-radius: 999px;
  border: 2px solid color-mix(in srgb, var(--color-ink) 10%, transparent);
  background: #fff;
  color: var(--color-ink);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color .2s ease, background .2s ease, color .2s ease;
}
.icon-btn:hover {
  border-color: var(--color-ink);
}
.icon-btn.done {
  border-color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 10%, #fff);
  color: var(--color-primary);
}

.chat-mensagens {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  padding: 18px 4px 4px;
  scrollbar-width: thin;
  scrollbar-color: #999999 var(--color-paper);
}
.chat-mensagens::-webkit-scrollbar {
  width: 6px;
}
.chat-mensagens::-webkit-scrollbar-thumb {
  background: #999999;
  border-radius: 999px;
}
.chat-mensagens::-webkit-scrollbar-track {
  background: var(--color-paper);
}

.chat-vazio {
  padding: 6px 4px 8px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.chat-sugestoes {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}
.chip-sugestao {
  text-align: left;
  padding: 11px 15px;
  border-radius: 14px;
  border: 2px solid color-mix(in srgb, var(--color-primary) 20%, transparent);
  background: color-mix(in srgb, var(--color-primary) 6%, #fff);
  color: var(--color-ink);
  font-family: var(--font-body, inherit);
  font-size: 13.5px;
  font-weight: 500;
  line-height: 1.4;
  transition: border-color .2s ease, background .2s ease, transform .15s ease;
}
.chip-sugestao:hover {
  border-color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 12%, #fff);
  transform: translateY(-1px);
}

/* Fluxo de mensagens: cada `.chat-linha` é uma linha inteira (largura total),
   e o alinhamento esquerda/direita da bolha dentro dela é o que separa
   aluno de Accessia — evita ter que alternar `align-self` no elemento raiz
   do TransitionGroup, que precisa ficar previsível pra animar bem. */
.chat-fluxo {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.chat-linha {
  display: flex;
  width: 100%;
}
.chat-linha-estudante {
  justify-content: flex-end;
}
.chat-linha-accessia {
  justify-content: flex-start;
}

/* Cada mensagem nova entra com um leve slide + fade — TransitionGroup
   (ver template) cuida de aplicar isso só ao item que está entrando. */
.chat-msg-enter-active {
  transition: opacity .28s ease, transform .28s ease;
}
.chat-msg-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.chat-msg-move {
  transition: transform .28s ease;
}

.chat-bolha {
  border-radius: 18px;
  padding: 12px 16px;
  max-width: 100%;
  font-size: 14.5px;
  line-height: 1.5;
}
.chat-bolha-estudante {
  background: var(--color-ink);
  color: #fff;
  border-bottom-right-radius: 5px;
  max-width: 85%;
  white-space: pre-wrap;
  box-shadow: 0 3px 10px color-mix(in srgb, var(--color-ink) 18%, transparent);
}
.chat-bolha-accessia {
  width: 100%;
  background: color-mix(in srgb, var(--color-ink) 4%, transparent);
  border: 1.5px solid color-mix(in srgb, var(--color-ink) 6%, transparent);
  border-bottom-left-radius: 5px;
}
.chat-resumo {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: .01em;
  color: color-mix(in srgb, var(--color-ink) 60%, transparent);
  text-transform: uppercase;
  margin-bottom: 10px;
}
.chat-erro {
  flex: none;
  margin-top: 10px;
  padding: 10px 14px;
  border-radius: 12px;
  background: color-mix(in srgb, #E24444 10%, transparent);
  color: #C6332F;
  font-size: 13.5px;
}

/* ===== Indicador de "digitando" — substitui os sparkles + texto rotativo
   antigos (2026-08-24, pedido da mantenedora: "melhore o design da barra de
   carregar, está muito fora do estilo"). Três pontinhos quicando em
   sequência é o padrão universal de chat — mais discreto que um bloco de
   texto que muda a cada 2s, e não força o aluno a ler nada enquanto espera. ===== */
.chat-digitando {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 14px 18px;
  width: auto;
}
.typing-dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-ink) 45%, transparent);
  animation: typing-bounce 1.1s ease-in-out infinite;
}
.typing-dot:nth-child(2) { animation-delay: .15s; }
.typing-dot:nth-child(3) { animation-delay: .3s; }
@keyframes typing-bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: .5; }
  30%           { transform: translateY(-4px); opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .typing-dot { animation-duration: 2.2s; }
}

/* ===== Barra de mensagem (input) — pílula com destaque ao focar, em vez do
   campo retangular do wizard antigo. ===== */
.chat-input-bar {
  flex: none;
  display: flex;
  align-items: flex-end;
  gap: 8px;
  margin-top: 14px;
  padding: 6px 6px 6px 18px;
  border-radius: 26px;
  border: 2px solid color-mix(in srgb, var(--color-ink) 12%, transparent);
  background: #fff;
  transition: border-color .2s ease, box-shadow .2s ease;
}
.chat-input-bar:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-primary) 14%, transparent);
}
.chat-textarea {
  flex: 1;
  margin: 0;
  padding: 11px 0;
  max-height: 120px;
  border: 0;
  background: transparent;
  font-family: var(--font-body, inherit);
  font-size: 15px;
  line-height: 1.4;
  resize: none;
}
.chat-textarea:focus {
  outline: none;
}
.chat-textarea::placeholder {
  color: color-mix(in srgb, var(--color-ink) 40%, transparent);
}
.chat-send-btn {
  flex: none;
  width: 42px;
  height: 42px;
  margin-bottom: 2px;
  border-radius: 999px;
  border: 0;
  background: var(--color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px color-mix(in srgb, var(--color-primary) 35%, transparent);
  transition: opacity .2s ease, transform .15s ease, box-shadow .2s ease;
}
.chat-send-btn:hover:not(:disabled) {
  transform: scale(1.06);
}
.chat-send-btn:disabled {
  opacity: .35;
  box-shadow: none;
}

/* Texto introdutório acima da lista de cartões */
.md-prose {
  color: color-mix(in srgb, var(--color-ink) 82%, transparent);
  line-height: 1.6;
  font-size: 15.5px;
}

/* ===== CSS do wizard antigo (2026-08-24: sem uso desde a troca pro chat,
   mantido sem apagar — mesmo padrão de não remover código supersedido já
   usado no resto do projeto, ver docs/decisions.md). Se o wizard voltar um
   dia, estas classes já estão prontas. ===== */
.progress {
  height: 6px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-ink) 8%, transparent);
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: var(--color-lime);
  border-radius: 999px;
  transition: width .3s ease;
}

.option-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px;
  border-radius: 18px;
  border: 2px solid color-mix(in srgb, var(--color-ink) 12%, transparent);
  font-family: var(--font-body, inherit);
  font-weight: 600;
  font-size: 16px;
  text-align: left;
  transition: border-color .2s ease, background .2s ease;
}
.option-btn.active {
  border-color: var(--color-ink);
  background: color-mix(in srgb, var(--color-ink) 6%, transparent);
}

.chip {
  padding: 10px 20px;
  border-radius: 999px;
  border: 2px solid color-mix(in srgb, var(--color-ink) 15%, transparent);
  font-weight: 600;
  font-size: 14.5px;
  transition: all .2s ease;
}
.chip.active {
  color: #15111F;
  font-weight: 700;
}

.objetivos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}
.chip-objetivo {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 14px 16px;
  border-radius: 16px;
  border: 2px solid transparent;
  font-family: var(--font-body, inherit);
  font-weight: 600;
  font-size: 14px;
  line-height: 1.35;
  text-align: left;
  color: var(--color-ink);
  transition: all .2s ease;
}
.chip-objetivo.active {
  color: #15111F;
  font-weight: 700;
}

.field {
  width: 100%;
  padding: 16px 18px;
  border-radius: 18px;
  border: 2px solid color-mix(in srgb, var(--color-ink) 12%, transparent);
  font-family: var(--font-body, inherit);
  font-size: 15.5px;
  resize: vertical;
  transition: border-color .2s ease;
}
.field:focus {
  outline: none;
  border-color: var(--color-ink);
}

/* ===== Botão copiar ===== */
.copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 15px;
  border-radius: 999px;
  border: 2px solid color-mix(in srgb, var(--color-ink) 12%, transparent);
  background: #fff;
  font-weight: 600;
  font-size: 13.5px;
  color: var(--color-ink);
  transition: border-color .2s ease, background .2s ease, color .2s ease;
}
.copy-btn:hover { border-color: var(--color-ink); }
.copy-btn.done {
  border-color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 10%, #fff);
  color: var(--color-primary);
}

/* ===== Lista de oportunidades (cartões coloridos) ===== */
.op-list {
  display: grid;
  gap: 12px;
}
.op-card {
  position: relative;
  display: flex;
  overflow: hidden;
  border-radius: 18px;
  border: 2px solid color-mix(in srgb, var(--color-ink) 9%, transparent);
  background: #fff;
  transition: border-color .2s ease, box-shadow .25s ease, transform .2s ease;
}
.op-accent {
  flex: none;
  width: 6px;
  align-self: stretch;
  background: var(--accent, var(--color-primary));
}
.op-body {
  flex: 1;
  min-width: 0;
  padding: 16px 18px 15px;
}
.op-title {
  font-size: 17px;
  line-height: 1.2;
  color: var(--color-ink);
}
.op-desc {
  margin-top: 6px;
  font-size: 14px;
  line-height: 1.5;
  color: color-mix(in srgb, var(--color-ink) 65%, transparent);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.op-why {
  margin-top: 8px;
  font-size: 13.5px;
  line-height: 1.5;
  color: color-mix(in srgb, var(--color-ink) 78%, transparent);
}
.op-caveat {
  display: inline-block;
  margin-top: 8px;
  font-size: 12.5px;
  line-height: 1.45;
  color: color-mix(in srgb, var(--color-ink) 65%, transparent);
  background: color-mix(in srgb, var(--color-lime) 16%, transparent);
  border-radius: 10px;
  padding: 6px 10px;
}
.op-link {
  display: inline-block;
  margin-top: 10px;
  font-size: 13px;
  font-weight: 700;
  color: var(--accent, var(--color-primary));
}
.op-go {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--accent, var(--color-primary)) 14%, transparent);
  color: var(--accent, var(--color-primary));
  transition: transform .2s ease, background .2s ease;
}
.op-card:hover {
  border-color: var(--accent, var(--color-primary));
  box-shadow: 0 12px 30px color-mix(in srgb, var(--accent, var(--color-primary)) 22%, transparent);
  transform: translateY(-2px);
}
.op-card:hover .op-go {
  transform: translate(2px, -2px);
  background: var(--accent, var(--color-primary));
  color: #fff;
}

/* ===== Cartões de oportunidade dentro do chat, menores que o padrão =====
   2026-08-24, a pedido da mantenedora ("deixe as oportunidades menores no
   chat, ele está muito inconsistente"): dentro da bolha da Accessia os
   cartões tinham o mesmo tamanho do resultado de página cheia — descrição
   de 2 linhas + espaçamento grande fazia a altura de cada cartão variar
   bastante conforme o texto (um título de uma linha ao lado de um de duas,
   por exemplo), o que lia como "inconsistente" numa lista compacta de chat.
   Aqui os cartões ficam menores e mais uniformes: menos padding, fontes
   menores, descrição cortada em 1 linha só (era 2) — mais parecido com um
   resultado de busca dentro de um chat, menos com o card de página cheia. */
.chat-bolha-accessia .op-list {
  gap: 8px;
}
.chat-bolha-accessia .op-card {
  border-radius: 14px;
}
.chat-bolha-accessia .op-accent {
  width: 4px;
}
.chat-bolha-accessia .op-body {
  padding: 10px 12px 9px;
}
.chat-bolha-accessia .op-title {
  font-size: 14px;
}
.chat-bolha-accessia .op-desc {
  margin-top: 3px;
  font-size: 12px;
  /* 2026-08-24: era 1 linha só — cortava a descrição bem no meio da frase
     antes de explicar do que a oportunidade se trata de verdade (achado
     real: "Junior Academy" ficava sem dizer o que é). 2 linhas continua bem
     mais compacto que o padrão de página cheia, mas dá espaço pra pelo
     menos uma frase completa. */
  -webkit-line-clamp: 2;
}
.chat-bolha-accessia .op-caveat {
  margin-top: 5px;
  font-size: 11px;
  padding: 4px 8px;
}
.chat-bolha-accessia .op-link {
  margin-top: 6px;
  font-size: 11.5px;
}
.chat-bolha-accessia .op-go {
  width: 24px;
  height: 24px;
}

/* ===== Modo compacto (embutido no popover flutuante) =====
   O painel foi desenhado pro card grande da home — dentro do popover
   estreito de AccessIAWidget.vue (400px) ele ficava desproporcional (título
   e espaçamentos pensados pra tela cheia). Estas regras só entram quando
   `embutido` é true, então o card da home continua exatamente como era. */
.panel-compacta {
  padding: 16px 14px;
}
.panel-compacta h2 {
  font-size: 19px !important;
}
.panel-compacta .md-prose {
  font-size: 13px;
}
.panel-compacta .op-list {
  gap: 8px;
}
.panel-compacta .op-body {
  padding: 11px 13px 10px;
}
.panel-compacta .op-title {
  font-size: 14.5px;
}
.panel-compacta .op-desc {
  font-size: 12.5px;
}
.panel-compacta .op-why {
  font-size: 12px;
}
.panel-compacta .op-caveat {
  font-size: 11.5px;
}
.panel-compacta .option-btn {
  padding: 12px 16px;
  font-size: 14px;
}
.panel-compacta .field {
  padding: 10px 12px;
  font-size: 14px;
}
.panel-compacta .chip {
  padding: 7px 14px;
  font-size: 13px;
}
.panel-compacta .copy-btn {
  padding: 7px 12px;
  font-size: 12.5px;
}
.panel-compacta .chat-bolha {
  font-size: 13.5px;
  padding: 10px 13px;
}
.panel-compacta .mt-6 { margin-top: 12px !important; }
.panel-compacta .mt-7 { margin-top: 14px !important; }
.panel-compacta .mt-8 { margin-top: 16px !important; }
.panel-compacta .mt-10 { margin-top: 18px !important; }

/* ===== Estilos dos tipos de resposta novos (2026-08-24) =====
   `op-why`, `op-meta`, exemplos de conceito, ficha de oportunidade e opções do
   funil. Herdam as variáveis do tema (--color-ink/--color-primary), então
   seguem o resto do app sem cor solta. */

/* Exemplos reais que acompanham a explicação de um conceito */
.exemplo-list {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.exemplo-titulo {
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--color-primary);
  margin-bottom: 2px;
}
.exemplo-item {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 9px 11px;
  border-radius: 12px;
  border: 1.5px solid color-mix(in srgb, var(--color-ink) 10%, transparent);
  background: #fff;
  transition: border-color .15s ease;
}
.exemplo-item:hover { border-color: var(--color-primary); }
.exemplo-nome { font-size: 13.5px; font-weight: 600; }
.exemplo-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-ink) 7%, transparent);
  color: color-mix(in srgb, var(--color-ink) 60%, transparent);
}
.exemplo-tag--aberta {
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  color: var(--color-primary);
}

/* Ficha de UMA oportunidade */
.ficha {
  margin-top: 12px;
  padding: 13px 14px;
  border-radius: 14px;
  border: 1.5px solid color-mix(in srgb, var(--color-primary) 20%, transparent);
  background: color-mix(in srgb, var(--color-primary) 5%, transparent);
}
.ficha-titulo {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  font-size: 14.5px;
  color: var(--color-ink);
}
.ficha-titulo:hover { color: var(--color-primary); }
.ficha-campos {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 4px 12px;
  margin-top: 10px;
  font-size: 12.5px;
}
.ficha-campos dt {
  font-weight: 700;
  color: color-mix(in srgb, var(--color-ink) 55%, transparent);
}
.ficha-campos dd { margin: 0; color: var(--color-ink); }
.ficha-faltando {
  margin-top: 10px;
  font-size: 11.5px;
  font-style: italic;
  color: color-mix(in srgb, var(--color-ink) 55%, transparent);
}

/* Opções do funil de exploração */
.funil-opcoes {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 12px;
}
.funil-opcoes .chip-sugestao:disabled {
  opacity: .45;
  cursor: default;
}

/* Por que esta oportunidade combina com ESTE aluno */
.op-why {
  margin-top: 5px;
  font-size: 13px;
  line-height: 1.5;
  color: color-mix(in srgb, var(--color-ink) 72%, transparent);
}
.op-meta {
  margin-top: 4px;
  display: flex;
  gap: 5px;
  font-size: 12px;
  color: color-mix(in srgb, var(--color-ink) 55%, transparent);
}

.chat-sugestoes--resposta { margin-top: 12px; }

.panel-compacta .exemplo-nome { font-size: 13px; }
.panel-compacta .ficha-titulo { font-size: 13.5px; }
.panel-compacta .op-why { font-size: 12.5px; }
</style>
