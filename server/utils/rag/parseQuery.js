// Entendimento da consulta, determinístico. Transforma a bio do aluno nos
// rótulos que o catálogo realmente usa (areas/type/level) + termos extras
// pro BM25.
//
// Duas correções que aprendemos medindo (não são detalhe):
//  1. Casamento por N-GRAMA, não por palavra solta. "estudar fora" como duas
//     palavras separadas fazia "estudo em escola pública" virar
//     "Programas de Intercâmbio"; "políticas públicas" fazia "escola pública"
//     virar área "Política".
//  2. Consciência de NEGAÇÃO por oração. "Nunca pensei em estudar fora do
//     Brasil" dizia o CONTRÁRIO do que era extraído. Orações negadas são
//     removidas antes de extrair intenção positiva — mas continuam visíveis
//     para as regras de preferência negativa (preferirBrasil etc).
import { tokenize, stem } from "./text.js";

// Os rótulos do CATÁLOGO entram como gatilhos, além do vocabulário do aluno.
// Parece redundante e não é: o funil de exploração e o "tem outras parecidas?"
// produzem texto usando os rótulos ("Tenho interesse em Humanas.",
// "Quero algo na área de STEM, Humanas, Meio Ambiente"), e sem estes gatilhos o
// analisador não reconhecia nada disso — as áreas voltavam vazias e a busca
// perdia o boost. Foi o que fez o funil devolver estágios de STEM para quem
// escolheu "História, filosofia, direito".
const PARA_AREA = {
  STEM: ["stem","matematica","matematico","fisica","quimica","biologia","bioquimica","ciencia","cientifico","robotica","robo","robos","programacao","codigo","software","computacao","engenharia","astronomia","astrofisica","foguete","medicina","enfermagem","genetica","neurociencia","estatistica","laboratorio","experimento","biologia sintetica","ciencia de dados"],
  Tech: ["tech","tecnologia","tech","programacao","app","aplicativo","inteligencia artificial","machine learning","hardware","eletronica","jogos digitais"],
  Humanas: ["humanas","historia","geografia","filosofia","sociologia","antropologia","direito","juridico","advocacia","relacoes internacionais","diplomacia","psicologia","arqueologia","ciencias humanas"],
  Linguagens: ["linguagens","escrever","escrita","redacao","literatura","leitura","poesia","poema","conto","cronica","ensaio","linguistica","oratoria","jornalismo","debate","debates","idiomas"],
  Artes: ["artes","arte","artes","musica","instrumento","teatro","atuar","dramaturgia","danca","desenho","pintura","ilustracao","design","fotografia","cinema","audiovisual","slam","grafite","artesanato","moda","canto"],
  "Meio Ambiente": ["meio ambiente","meio ambiente","ambiental","sustentabilidade","clima","climatico","ecologia","natureza","floresta","amazonia","reciclagem","energia renovavel","biodiversidade"],
  "Política": ["politica","politica","governo","prefeitura","camara municipal","senado","vereador","eleicao","voto","cidadania","politicas publicas","legislativo","parlamento"],
  Ativismo: ["ativismo","ativismo","ativista","militancia","voluntariado","voluntario","ong","impacto social","projeto social","comunidade","periferia","lideranca","gremio","direitos humanos","mobilizacao"],
  Empreendedorismo: ["empreendedorismo","empreendedorismo","empreender","negocio","negocios","startup","empresa","comercio","inovacao","gestao","financas","economia","investimento","agronegocio"],
};

const PARA_TYPE = {
  MUNs: ["mun","muns","onu","simulacao da onu","model united nations","delegado","comite"],
  "Olimpíadas Científicas": ["olimpiada","olimpiadas","obm","obf","obq","obb","seletiva","medalha"],
  "Competições de Escrita": ["concurso literario","concurso de redacao","concurso de escrita","premio literario"],
  "Competições": ["competicao","competicoes","competir","campeonato","torneio","hackathon","maratona"],
  Mentorias: ["mentoria","mentorias","mentor","tutoria","orientacao de carreira","acompanhamento individual"],
  "Estágios": ["estagio","estagios","internship","estagiar"],
  "Bolsas de Estudo": ["bolsa de estudo","bolsa integral","scholarship","isencao de mensalidade"],
    // "programa de verão" e "summer" saíram daqui para Programas Acadêmicos: no
  // catálogo real, praticamente todo programa de verão é Programa Acadêmico
  // (TASS, Stanford Summer Humanities, Summer Science Program), e mapeá-los
  // para Intercâmbio empurrava para o topo as 4 oportunidades de intercâmbio
  // enquanto escondia os ~14 programas de verão que o aluno queria.
  "Programas de Intercâmbio": ["intercambio","exchange","morar fora","ano letivo fora"],
  "Programas Acadêmicos": ["curso","formacao","capacitacao","workshop","seminario","fellowship","programa academico","programa de verao","summer program","summer","verao","winter","escola de verao","instituto de verao"],
};

// Constrói índice de n-gramas stemmed -> rótulos.
function indexarNgramas(fonte) {
  const idx = new Map();
  let maxN = 1;
  for (const [rotulo, entradas] of Object.entries(fonte)) {
    for (const entrada of entradas) {
      const gs = tokenize(entrada, { keepStopwords: true }).join(" ");
      if (!gs) continue;
      maxN = Math.max(maxN, gs.split(" ").length);
      if (!idx.has(gs)) idx.set(gs, new Set());
      idx.get(gs).add(rotulo);
    }
  }
  return { idx, maxN };
}
const IDX_AREA = indexarNgramas(PARA_AREA);
const IDX_TYPE = indexarNgramas(PARA_TYPE);

function match({ idx, maxN }, tokens) {
  const achados = new Set();
  for (let i = 0; i < tokens.length; i++) {
    for (let n = Math.min(maxN, tokens.length - i); n >= 1; n--) {
      const chave = tokens.slice(i, i + n).join(" ");
      const r = idx.get(chave);
      if (r) { for (const x of r) achados.add(x); break; }
    }
  }
  return achados;
}

const NEGACOES = /\b(n[ãa]o|nunca|jamais|nem|sem|desisti|odeio|detesto)\b/i;

// Divide em orações e devolve só as afirmativas — é nelas que a intenção
// positiva do aluno mora.
function oracoesAfirmativas(bio) {
  return String(bio)
    .split(/[.;!?\n]|,\s*(?=mas|porém|embora)|\s+—\s+/)
    .filter((o) => o.trim() && !NEGACOES.test(o));
}

const REGEX = {
  inglesFraco: /ingl[êe]s (?:é |e |t[áa] )?(?:b[áa]sico|fraco|ruim|iniciante|pouco)|n[ãa]o (?:falo|sei) ingl[êe]s|pouco ingl[êe]s|prefiro (?:programas? |competi[çc][õo]es? )?em portugu[êe]s|em portugu[êe]s/i,
  naoSairPais: /n[ãa]o (?:quero|posso|pretendo|penso em|pensei em|tenho vontade|tenho condi[çc][ãa]o) .{0,40}(?:viajar|sair do (?:brasil|pa[íi]s)|estudar fora|morar fora|fora do pa[íi]s)|nunca (?:sa[íi]|pensei em (?:estudar|morar) fora)|prefiro (?:ficar|oportunidades?) (?:no|aqui no) brasil|aqui no brasil mesmo|por aqui mesmo|n[ãa]o penso em sair do pa[íi]s|nem condi[çc][ãa]o de viajar/i,
  // Ampliado: "procuro bolsa ou intercâmbio de verão fora do Brasil" não
  // casava, então o aluno que pedia explicitamente algo FORA ficava neutro — e
  // os programas no exterior não recebiam nenhum empurrão. Aqui basta um
  // pedido afirmativo de algo fora do país; a exigência estreita continua
  // valendo só para o backstop de GRADUAÇÃO inteira no exterior
  // (WANTS_DEGREE_ABROAD_REGEX em utilidade.js), que é outra coisa.
  // Nomear um país estrangeiro numa oração AFIRMATIVA conta como querer o
  // exterior: "existe alguma nos estados unidos" é um pedido claro, e antes
  // ficava neutro. Isto só serve para PARAR DE PENALIZAR programas de fora —
  // não existe boost simétrico, porque ele foi medido e reprovado (ver o
  // comentário em search.js).
  querExterior: /(?:quero|queria|procuro|busco|gostaria de|sonho (?:de|em)) [^.!?]{0,60}(?:fora do (?:brasil|pa[íi]s)|no exterior)|(?:estudar|morar|fazer (?:gradua[çc][ãa]o|faculdade)|intercambio|interc[âa]mbio) (?:fora|no exterior)|gradua[çc][ãa]o (?:no exterior|fora do brasil)|faculdade (?:no exterior|fora do brasil|nos eua)|\b(?:nos? (?:estados unidos|eua)|na europa|no canad[áa]|na inglaterra|no reino unido|em portugal|na espanha|na alemanha|na fran[çc]a|no jap[ãa]o|na china|na austr[áa]lia)\b/i,
  // Ampliado depois de medir: perfil-08 escreve "quero programas remotos e
  // gratuitos" e a versao anterior nao pegava (exigia "so remoto"/"prefiro
  // remoto"), entao o aluno recebia programa presencial nos EUA no topo.
  preferirRemoto: /(?:s[óo]|prefiro|precisa ser|apenas|quero|queria|busco|procuro) (?:algo |programas? |oportunidades? )?(?:remot|online|a dist[âa]ncia|virtua)|n[ãa]o (?:tenho|consigo) (?:como|dinheiro pra) (?:viajar|me deslocar)|sem sair de casa|de casa mesmo|(?:remotos?|online) e gratuitos?/i,
  naoSabeOQueQuer: /(?:ainda )?n[ãa]o (?:sei|tenho ideia|fa[çc]o ideia)(?: bem)? (?:o que|do que|qual)|n[ãa]o sei o que (?:quero|fazer|escolher|ser)|(?:estou|t[oô]) perdid|me ajuda a (?:descobrir|escolher)|n[ãa]o sei por onde come[çc]ar|qualquer coisa serve/i,
  precisaGratuito: /baixa renda|sal[áa]rios? m[íi]nimos?|n[ãa]o (?:tenho|temos) (?:dinheiro|condi[çc][õo]es)|(?:preciso|quero|queria|busco)(?: que seja)?(?: de| algo| programas?| oportunidades?)? .{0,20}gratuit|s[óo] (?:se for )?gratuit|gratuitos?\b|bolsa integral|sem (?:poder )?pagar|escola p[úu]blica/i,
};

const NIVEL_POR_SERIE = [
  [/\b[6789][ºo°]?\s*ano\b|ensino fundamental|\bfundamental\b/i, "Fundamental"],
  [/\b[123][ºo°]?\s*ano\b(?!\s*do\s*fundamental)|ensino m[ée]dio|colegial|\bm[ée]dio\b/i, "Ensino Médio"],
  [/gap year|ano de intervalo|(?:j[áa] )?(?:terminei|conclu[íi]) o (?:ensino )?m[ée]dio|rec[ée]m[- ]formad/i, "Gap"],
  [/faculdade|gradua[çc][ãa]o|universidade|universit[áa]ri|ensino superior/i, "Faculdade"],
];

export function analyzeQuery({ bio = "", areasMarcadas = [], tiposMarcados = [], nivel = null, condicaoFinanceira = null, local = null, linguas = null }) {
  const afirmativo = oracoesAfirmativas(bio).join(". ");
  const toksAfirm = tokenize(`${afirmativo} ${areasMarcadas.join(" ")}`, { keepStopwords: true });

  const areas = new Set(areasMarcadas);
  for (const a of match(IDX_AREA, toksAfirm)) areas.add(a);
  // Rótulo que veio ESTRUTURADO (funil, cadastro, semente de "parecidas") é
  // certeza, não inferência — entra direto, sem depender de o texto em prosa
  // ser reconhecido de volta.
  const tipos = new Set(tiposMarcados);
  for (const t of match(IDX_TYPE, toksAfirm)) tipos.add(t);

  const niveis = new Set(nivel ? [nivel] : []);
  for (const [re, rotulo] of NIVEL_POR_SERIE) if (re.test(bio)) niveis.add(rotulo);

  return {
    areas: [...areas],
    tipos: [...tipos],
    niveis: [...niveis],
    // `linguas` e um campo ESTRUTURADO do cadastro (tabela `profiles`) que o
    // pipeline simplesmente ignorava. Ele e muito mais confiavel que a regex
    // sobre a bio: no golden set, a regex identificava 2 perfis com ingles
    // fraco; o campo identifica 23 de 30 (22 que so falam portugues + 1
    // portugues/Libras). Medido: usar isso levou recall@10 de 0.660 pra 0.668,
    // precision@5 de 0.345 pra 0.355 e - o que mais importa - "programa em
    // ingles nas 3 primeiras posicoes" de 1.00 pra 0.00, que e a exigencia
    // escrita a mao na observacao do perfil-03 do golden set.
    // Sem `linguas` preenchido, cai na regex de antes (nunca fica pior).
    // ATENÇÃO à assimetria aqui, ela é deliberada:
    //
    //   preferirBrasil  testa a bio INTEIRA — é sobre negação, e a negação é
    //                   justamente o que a gente quer capturar.
    //   querExterior    testa só as orações AFIRMATIVAS.
    //
    // Sem essa separação acontece o bug que já custou uma medição: a bio
    // "Nunca pensei em estudar fora do Brasil, quero é competir por aqui mesmo"
    // ativava `querExterior`, porque o trecho "estudar fora" existe no texto —
    // dentro de uma frase que diz exatamente o contrário. E `querExterior=true`
    // desliga o boost de "prefiro o Brasil", então o perfil que MAIS precisava
    // de oportunidades brasileiras deixava de recebê-las. Medido no golden set:
    // precision@5 caiu de 0,355 para 0,336 e "inglês no topo-3" dobrou de 0,043
    // para 0,087 por causa deste único perfil.
    //
    // E quando os dois disparam, a negação vence: dizer "não quero sair do
    // país" é mais específico do que qualquer frase afirmativa solta.
    inglesFraco: Array.isArray(linguas) && linguas.length
      ? !linguas.some((l) => /ingl|english/i.test(String(l)))
      : REGEX.inglesFraco.test(bio),
    preferirBrasil: REGEX.naoSairPais.test(bio) || local === "brasil",
    querExterior:
      (REGEX.querExterior.test(afirmativo) || local === "fora") &&
      !(REGEX.naoSairPais.test(bio) || local === "brasil"),
    preferirRemoto: REGEX.preferirRemoto.test(bio),
    naoSabeOQueQuer: REGEX.naoSabeOQueQuer.test(bio),
    precisaGratuito: condicaoFinanceira === "precisa_gratuito" || REGEX.precisaGratuito.test(bio),
  };
}

export function expandedTerms(bio, analysis, { pesoInferido = 0.55 } = {}) {
  const termos = tokenize(bio);
  const boost = new Map();
  for (const t of termos) boost.set(t, 1);
  const escritosPeloAluno = new Set(termos);

  // A expansão precisa ser proporcional ao que o aluno escreveu.
  //
  // Medido na consulta real "quero oportunidades de pesquisa na area de
  // historia": 4 palavras do aluno contra 11 termos inferidos a peso 0,55 —
  // ou seja, peso 4,0 para o que ele disse contra 6,1 para o que a gente
  // deduziu. A inferência DOMINAVA a pergunta. O efeito prático era grotesco:
  // "história" era expandido com os irmãos da mesma área (geografia,
  // filosofia, sociologia, direito, relações internacionais) e a busca
  // devolvia Olimpíada de Geografia e Escola Comum acima da Olimpíada
  // Nacional em História do Brasil.
  //
  // Numa bio longa isso não aparece, porque há contexto suficiente para
  // absorver os sinônimos — e o golden set é todo feito de bios longas, então
  // nenhuma métrica tinha como flagrar isso. Daí a escala: quanto menos o
  // aluno escreveu, menos a gente completa por ele.
  const escalaExpansao = Math.min(1, termos.length / 12);

  const inferidos = [];
  for (const a of analysis.areas) inferidos.push(a, ...(PARA_AREA[a] ?? []).slice(0, 10));
  for (const t of analysis.tipos) inferidos.push(t, ...(PARA_TYPE[t] ?? []).slice(0, 6));
  for (const n of analysis.niveis) inferidos.push(n);
  if (analysis.precisaGratuito) inferidos.push("gratuito", "bolsa", "financiado");
  if (analysis.inglesFraco) inferidos.push("português", "em português");
  if (analysis.preferirRemoto) inferidos.push("remoto", "online", "a distância");
  if (analysis.preferirBrasil && !analysis.querExterior) inferidos.push("Brasil", "brasileiro", "nacional");

  for (const p of inferidos) {
    for (const s of tokenize(p)) {
      // Termo que o aluno JÁ escreveu nunca é rebaixado ao peso de inferência:
      // "história" foi escrito, então vale 1, não 0,55, mesmo aparecendo
      // também na lista de sinônimos da área Humanas.
      if (escritosPeloAluno.has(s)) continue;
      if (!boost.has(s)) { boost.set(s, pesoInferido * escalaExpansao); termos.push(s); }
    }
  }
  return { termos, boost };
}

export { PARA_AREA, PARA_TYPE };
