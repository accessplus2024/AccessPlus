// A conversa guiada — o modo "ainda não sei o que quero fazer, me ajuda".
//
// Este é o caso que o produto mais precisa acertar e o que o desenho antigo
// menos cobria. O wizard exigia que o aluno já soubesse marcar áreas e
// objetivos; o texto livre exigia que ele soubesse descrever o que quer. Um
// aluno de 13 anos que nunca ouviu falar de olimpíada, MUN ou mentoria não
// consegue nenhum dos dois — e ele é exatamente o público-target.
//
// Desenho deliberado, três decisões:
//
// 1. UMA PERGUNTA POR VEZ, com opções clicáveis escritas na língua do aluno
//    ("montar coisas, mexer com robô") e não na do catálogo ("STEM"). Quatro
//    perguntas de uma vez é um formulário, e formulário é o que faz o aluno
//    fechar a aba.
//
// 2. AS PERGUNTAS SÃO DETERMINÍSTICAS, não geradas por LLM. Um LLM gerando
//    perguntas a cada turno dá conversa mais natural e um funil que não
//    converge: ele repete, pula, esquece o que já perguntou. Aqui o funil tem
//    início, meio e fim garantidos, e o aluno sempre chega às oportunidades.
//
// 3. DÁ PARA SAIR A QUALQUER MOMENTO. Toda pergunta aceita resposta livre, e
//    a partir de 1 área conhecida já é possível recomendar — as perguntas
//    seguintes só refinam. O aluno nunca fica preso no funil.

const AREAS_EM_LINGUA_DE_ALUNO = [
  { rotulo: "Montar e consertar coisas, robótica, programar", areas: ["STEM", "Tech"] },
  { rotulo: "Matemática, física, química, biologia", areas: ["STEM"] },
  { rotulo: "Escrever, ler, línguas", areas: ["Linguagens"] },
  { rotulo: "Discutir, debater, política e atualidades", areas: ["Política", "Humanas"] },
  { rotulo: "História, filosofia, direito, gente", areas: ["Humanas"] },
  { rotulo: "Arte, música, teatro, desenho, audiovisual", areas: ["Artes"] },
  { rotulo: "Natureza, clima, meio ambiente", areas: ["Meio Ambiente"] },
  { rotulo: "Vender, empreender, tocar um negócio", areas: ["Empreendedorismo"] },
  { rotulo: "Mudar algo na minha comunidade", areas: ["Ativismo"] },
];

const FORMATOS_EM_LINGUA_DE_ALUNO = [
  { rotulo: "Competir e me testar", tipos: ["Olimpíadas Científicas", "Competições"] },
  { rotulo: "Ter alguém me orientando de perto", tipos: ["Mentorias"] },
  { rotulo: "Aprender um assunto a fundo, tipo um curso", tipos: ["Programas Acadêmicos"] },
  { rotulo: "Trabalhar num projeto de verdade", tipos: ["Estágios"] },
  { rotulo: "Debater representando um país", tipos: ["MUNs"] },
  { rotulo: "Conseguir uma bolsa de estudo", tipos: ["Bolsas de Estudo"] },
  { rotulo: "Ainda não sei, me mostra um pouco de cada", tipos: [] },
];

export const PASSOS = ["interesse", "formato", "barreiras", "pronto"];

/**
 * O funil é sem estado no servidor: o cliente devolve, a cada turno, o que já
 * foi coletado. Isso mantém o endpoint idempotente e sobrevive a recarregar a
 * página no meio da conversa — coisa que acontece muito em celular com
 * conexão ruim, que é como boa parte deste público acessa.
 *
 * @param {object} coletado { areas?: string[], tipos?: string[], barreiras?: object, textoLivre?: string }
 */
/**
 * @param {object} coletado
 * @param {object} [opcoes]
 * @param {"naoSabe"|"fallback"} [opcoes.origem]  POR QUE o funil abriu
 * @param {string} [opcoes.mensagemDoAluno]       o que ele acabou de escrever
 *
 * `origem` existe por um caso real e embaraçoso: o aluno clicou em "Eu consigo
 * participar disso?" — um chip que a própria Accessia ofereceu — e recebeu
 * "Sem problema nenhum, a maioria das pessoas não sabe. Vou fazer três
 * perguntas rápidas". Ele não disse que não sabia; ele fez uma pergunta
 * precisa sobre uma oportunidade específica. O texto de abertura do funil
 * assumia um motivo que não era o motivo.
 *
 * Agora a abertura depende do porquê, e quando existe uma pergunta do aluno ela
 * é reconhecida em vez de descartada. Um funil que ignora o que a pessoa
 * acabou de dizer não é uma conversa, é um formulário com avatar.
 */
export function nextStep(coletado = {}, { origem = "naoSabe", mensagemDoAluno = "" } = {}) {
  const areas = coletado.areas ?? [];
  const tipos = coletado.tipos ?? [];
  const barreiras = coletado.barreiras ?? null;

  if (!areas.length) {
    const abertura =
      origem === "naoSabe"
        ? "Sem problema nenhum — a maioria das pessoas não sabe, e é justamente pra isso que eu sirvo. Vou fazer três perguntas rápidas e no fim te mostro coisas de verdade, não uma lista genérica."
        : mensagemDoAluno
          ? `Não consegui entender bem "${mensagemDoAluno.trim().slice(0, 80)}" — desculpa. Deixa eu tentar por outro caminho: três perguntas rápidas e eu te mostro coisas de verdade.`
          : "Vou fazer três perguntas rápidas pra te mostrar coisas de verdade, e não uma lista genérica.";
    return {
      passo: "interesse",
      texto: `${abertura}\n\nPrimeira: o que você mais gosta de fazer? Pode marcar mais de uma, ou escrever do seu jeito.`,
      opcoes: AREAS_EM_LINGUA_DE_ALUNO.map((o) => ({ rotulo: o.rotulo, valor: o.areas })),
      multipla: true,
      campo: "areas",
    };
  }

  if (!tipos.length) {
    return {
      passo: "formato",
      texto:
        "Boa. Agora: quando você imagina participar de algo, o que te atrai mais? Isso muda muito o tipo de oportunidade que faz sentido pra você.",
      opcoes: FORMATOS_EM_LINGUA_DE_ALUNO.map((o) => ({ rotulo: o.rotulo, valor: o.tipos })),
      multipla: true,
      campo: "tipos",
    };
  }

  if (!barreiras) {
    return {
      passo: "barreiras",
      texto:
        "Última, e é a que mais evita eu te mostrar coisa que você não conseguiria fazer: alguma dessas é verdade pra você agora?",
      opcoes: [
        { rotulo: "Precisa ser gratuito", valor: { precisaGratuito: true } },
        { rotulo: "Meu inglês é básico, prefiro em português", valor: { inglesFraco: true } },
        { rotulo: "Não consigo viajar, precisa ser aqui ou online", valor: { preferirBrasil: true, preferirRemoto: true } },
        { rotulo: "Nenhuma dessas, tô tranquilo", valor: {} },
      ],
      multipla: true,
      campo: "barreiras",
    };
  }

  return { passo: "pronto" };
}

/**
 * Converte o que o funil coletou no texto que a busca consome. A busca
 * espera linguagem natural (é o que ela foi calibrada em cima, no golden set
 * feito de bios reais), então montamos uma frase — não um objeto de filtros.
 */
export function collectedToText(coletado = {}, perfil = {}, studentMessages = []) {
  const partes = [];
  // O que o aluno escreveu ANTES de entrar no funil entra na busca. Descartar
  // isso era jogar fora o sinal mais específico que existe: quem escreveu
  // "procuro bolsa de verão fora do Brasil" e caiu no funil por um erro de
  // roteamento não deveria sair dele com uma busca que só sabe "Empreendedorismo".
  for (const m of studentMessages) if (m && m.trim()) partes.push(m.trim());
  const areas = coletado.areas ?? [];
  const tipos = coletado.tipos ?? [];
  const b = coletado.barreiras ?? {};

  if (coletado.textoLivre) partes.push(coletado.textoLivre);
  if (areas.length) partes.push(`Tenho interesse em ${areas.join(", ")}.`);
  if (tipos.length) partes.push(`Quero participar de ${tipos.join(", ")}.`);
  if (perfil.nivel) partes.push(`Estou no ${perfil.nivel}.`);
  if (perfil.age) partes.push(`Tenho ${perfil.age} anos.`);
  if (b.precisaGratuito) partes.push("Preciso que seja gratuito, não tenho condição de pagar.");
  if (b.inglesFraco) partes.push("Meu inglês é básico, prefiro programas em português.");
  if (b.preferirBrasil) partes.push("Não tenho condição de viajar pra fora do país, quero oportunidades no Brasil ou online.");

  return partes.join(" ");
}

// Achatamento das respostas do funil (o cliente devolve os `valor` marcados).
export function accumulate(coletado = {}, campo, valores) {
  const novo = { ...coletado };
  if (campo === "barreiras") {
    novo.barreiras = Object.assign({}, ...(Array.isArray(valores) ? valores : [valores]));
    return novo;
  }
  const atual = new Set(novo[campo] ?? []);
  for (const v of (Array.isArray(valores) ? valores : [valores]).flat()) if (v) atual.add(v);
  novo[campo] = [...atual];
  return novo;
}

export { AREAS_EM_LINGUA_DE_ALUNO, FORMATOS_EM_LINGUA_DE_ALUNO };
