// Glossario CURADO. Nao e prompt, e dado.
//
// Por que curado e nao "deixa o LLM explicar": o publico da AccessPlus e em
// boa parte primeira geracao a acessar esse tipo de oportunidade. Uma
// explicacao errada de "o que e um MUN" ou "o que e bolsa integral" nao e um
// errinho - e o aluno desistindo de se inscrever, ou se inscrevendo em algo
// que nao podia. Um llama-3.1-8b inventando definicao aqui e risco real, e a
// lista de conceitos que importam e pequena e estavel o suficiente pra ser
// escrita a mao uma vez.
//
// Cada entrada tem: gatilhos (como o aluno pergunta), texto (a explicacao,
// linguagem de 13 anos, sem jargao nao explicado) e tipoCatalogo (quando o
// conceito e uma categoria real do catalogo, pra poder listar exemplos de
// verdade junto da explicacao).

export const GLOSSARIO = [
  {
    chave: "accessplus",
    // "voces" sozinho era gatilho e capturava "quais MUNs voces tem?" - generico
    // demais. Gatilho precisa ser especifico da entrada, nao de qualquer frase
    // que fale com a Accessia.
    gatilhos: ["accessplus", "access plus", "acess plus", "esse site", "essa plataforma", "quem sao voces", "o que e a accessplus", "o que e isso aqui"],
    texto:
      "A AccessPlus é uma plataforma brasileira que reúne, num só lugar, oportunidades extracurriculares gratuitas ou com bolsa para estudantes de 11 a 18 anos — olimpíadas, competições, mentorias, estágios, intercâmbios, bolsas de estudo. A ideia é simples: essas oportunidades existem, mas quase ninguém fica sabendo delas na hora certa, e quem menos fica sabendo é justamente quem mais precisaria. Aqui elas estão organizadas, com prazo, quem pode participar e como se inscrever.",
  },
  {
    chave: "accessia",
    gatilhos: ["accessia", "acessia", "quem e voce", "voce e um robo", "voce e uma ia"],
    texto:
      "Eu sou a Accessia, a assistente da AccessPlus. Meu trabalho é entender o que você gosta e a sua situação real (série, se pode viajar, se precisa que seja gratuito) e te mostrar as oportunidades do catálogo que de fato servem pra você — não uma lista genérica. Também explico como as coisas funcionam quando você não conhece o vocabulário ainda.",
  },
  {
    chave: "mun",
    tipoCatalogo: "MUNs",
    gatilhos: ["mun", "muns", "model un", "model united nations", "simulacao da onu", "simulacao de onu", "onu"],
    texto:
      "MUN é a sigla de Model United Nations — Modelo das Nações Unidas. É uma simulação: você recebe um país para representar e defende a posição dele num comitê, debatendo um problema real (crise climática, conflito, direitos humanos) com estudantes de outras escolas. Você pesquisa antes, escreve a posição do seu país, discursa, negocia e ajuda a escrever uma resolução final. É a melhor porta de entrada se você gosta de política, história, relações internacionais ou simplesmente de argumentar. Existem MUNs em português e em inglês, presenciais e online.",
  },
  {
    chave: "mentoria",
    tipoCatalogo: "Mentorias",
    gatilhos: ["mentoria", "mentorias", "mentor", "mentoring", "o que faz um mentor"],
    texto:
      "Mentoria é quando alguém que já passou pelo caminho que você quer seguir te acompanha de perto por um período — normalmente em conversas regulares, de meia hora a uma hora, por semanas ou meses. Não é aula: é alguém que te ajuda a decidir o que fazer, revisa a sua inscrição, te diz o que ninguém te contou sobre um processo seletivo, e te apresenta pessoas. Para quem é primeira geração na família a tentar esse tipo de oportunidade, mentoria costuma valer mais que curso — porque o que falta geralmente não é conteúdo, é informação de dentro.",
  },
  {
    chave: "olimpiada",
    tipoCatalogo: "Olimpíadas Científicas",
    gatilhos: ["olimpiada", "olimpiadas", "olimpiada cientifica", "obmep", "o que e uma olimpiada"],
    texto:
      "Olimpíada científica é uma competição de conhecimento, geralmente em fases: uma primeira prova na sua própria escola, e quem vai bem avança para fases estaduais, nacionais e às vezes internacionais. A maioria das olimpíadas brasileiras é gratuita e a inscrição é feita pela escola. Vale muito mais do que a medalha: medalhista de olimpíada entra em programas, ganha bolsa, é convidado para seletivas — e é uma das poucas coisas que abre porta sem depender de dinheiro ou de contato da família.",
  },
  {
    chave: "intercambio",
    tipoCatalogo: "Programas de Intercâmbio",
    gatilhos: ["intercambio", "intercâmbio", "exchange", "estudar fora", "morar fora"],
    texto:
      "Intercâmbio é passar um período estudando em outro país. Pode ser curto (duas semanas a dois meses, tipo programa de verão) ou longo (um semestre ou um ano letivo inteiro). Importante não confundir com fazer a faculdade inteira fora — são coisas diferentes, com processos diferentes. Existem intercâmbios totalmente financiados, onde passagem, hospedagem e comida são pagos pelo programa; são competitivos, mas existem, e não exigem que a sua família tenha dinheiro.",
  },
  {
    chave: "bolsa",
    tipoCatalogo: "Bolsas de Estudo",
    gatilhos: ["bolsa", "bolsas", "bolsa de estudo", "bolsa integral", "scholarship", "o que e bolsa integral", "totalmente financiado"],
    texto:
      "Bolsa é quando alguém paga (parte ou tudo) para você participar de algo. Vale entender as três palavras que aparecem no catálogo: **Gratuito** quer dizer que não tem custo nenhum para ninguém. **Bolsa** quer dizer que existe auxílio, mas pode não cobrir tudo — vale ler os detalhes. **Totalmente Financiado** é o melhor caso: o programa paga tudo, inclusive passagem e hospedagem quando é fora. Se dinheiro é uma barreira real pra você, diz isso pra mim — eu priorizo o que é gratuito ou totalmente financiado.",
  },
  {
    chave: "estagio",
    tipoCatalogo: "Estágios",
    gatilhos: ["estagio", "estágio", "internship", "estagiar"],
    texto:
      "Estágio, aqui, quase sempre quer dizer entrar num projeto de pesquisa ou numa organização por alguns meses, fazendo trabalho de verdade sob orientação de alguém — não é o estágio obrigatório da faculdade. Muitos são remotos, o que resolve o problema de deslocamento. É o tipo de coisa que faz mais diferença no seu currículo do que qualquer curso, porque mostra que você já produziu algo.",
  },
  {
    chave: "competicao_escrita",
    tipoCatalogo: "Competições de Escrita",
    gatilhos: ["competicao de escrita", "concurso literario", "concurso de redacao", "premio de escrita"],
    texto:
      "São concursos onde você envia um texto seu — conto, poema, crônica, ensaio, reportagem — e uma banca avalia. Muitos aceitam texto em português e não cobram inscrição. É uma das formas mais baratas que existem de ganhar reconhecimento: você precisa de papel e de tempo, não de dinheiro nem de viagem.",
  },
  {
    chave: "programa_academico",
    tipoCatalogo: "Programas Acadêmicos",
    gatilhos: ["programa academico", "summer program", "programa de verao", "pre college", "fellowship"],
    texto:
      "É um programa onde você estuda um assunto a fundo por um período — algumas semanas ou alguns meses — com aulas, projeto e às vezes apresentação final. Pode ser online ou presencial. \"Fellowship\" é uma palavra que aparece muito: significa que você é selecionado para um grupo pequeno, recebe acompanhamento e, em alguns casos, um valor em dinheiro para tocar um projeto seu.",
  },
  {
    chave: "elegibilidade",
    gatilhos: ["elegibilidade", "elegivel", "quem pode participar", "criterio", "requisito", "o que e elegibilidade"],
    texto:
      "Elegibilidade é a lista de quem pode se inscrever: série ou idade, país, escola pública ou privada, nível de idioma, renda da família. É a primeira coisa que você deve ler, antes de se empolgar — e também antes de desistir. Muita gente se auto-elimina achando que não é elegível quando é. Se estiver em dúvida sobre uma oportunidade específica, me pergunta e eu leio o critério dela com você.",
  },
  {
    chave: "gap_year",
    gatilhos: ["gap year", "gap", "ano de intervalo", "terminei o medio e agora"],
    texto:
      "Gap year é o período entre terminar o ensino médio e começar a faculdade. Não é tempo perdido: existem programas feitos especificamente para essa fase — e no catálogo o nível \"Gap\" marca justamente esses. Se você terminou o médio e está sem saber o que fazer agora, esse é um filtro útil.",
  },
  {
    chave: "carta_recomendacao",
    gatilhos: ["carta de recomendacao", "recommendation letter", "quem pode escrever minha carta"],
    texto:
      "É uma carta em que um professor (ou orientador, ou alguém que trabalhou com você) escreve o que viu você fazer. Não precisa ser o professor mais famoso nem o diretor: precisa ser quem consegue contar uma história concreta sua — \"esse aluno montou um projeto de robótica com material reciclado\" vale muito mais que \"aluno dedicado e educado\". Peça com pelo menos duas semanas de antecedência e mande junto um resumo do que você fez.",
  },
  {
    chave: "nivel_ingles",
    gatilhos: ["preciso saber ingles", "meu ingles e ruim", "tem que falar ingles", "toefl", "duolingo english test", "prova de ingles"],
    texto:
      "Depende do programa, e vale separar duas coisas. Alguns exigem comprovação formal (TOEFL, Duolingo English Test) — esses são a minoria e geralmente os internacionais mais competitivos. Muitos outros só pedem que você consiga acompanhar em inglês, sem prova nenhuma. E existe um catálogo grande de coisas boas inteiramente em português. Se o seu inglês é básico, me diz — eu priorizo o que é em português e marco quando um programa exige inglês, em vez de te mandar para uma inscrição que você não conseguiria completar.",
  },
];

const fold = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/**
 * Casa a pergunta contra os gatilhos do glossario. Exige borda de palavra
 * (nao substring) - senao "mun" bateria dentro de "mundo", "comunidade",
 * "munhoz". Bug real e facil de cometer aqui.
 */
export function lookupConcept(pergunta) {
  const p = fold(pergunta);
  const achados = [];
  for (const item of GLOSSARIO) {
    for (const g of item.gatilhos) {
      const gf = fold(g);
      const re = new RegExp(`(^|[^a-z0-9])${gf.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`);
      if (re.test(p)) { achados.push({ ...item, gatilhoQueBateu: g }); break; }
    }
  }
  // Gatilho mais longo primeiro: "bolsa integral" e mais especifico que "bolsa".
  return achados.sort((a, b) => b.gatilhoQueBateu.length - a.gatilhoQueBateu.length);
}
