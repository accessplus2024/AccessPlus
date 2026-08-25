// Representação por campo de cada oportunidade. O ponto central: hoje o
// `searchable_text` do banco cobre só título+descrição+elegibilidade+áreas+
// keywords. Campos que um aluno usa como PRIMEIRA palavra da busca —
// "MUN", "mentoria", "olimpíada", "estágio", "intercâmbio" (coluna `type`),
// "remoto"/"presencial" (`format`), "gratuito" (`cost`), "inglês"
// (`language`) — nunca entravam em nenhum índice. Aqui eles entram, cada um
// no seu campo, para poderem receber peso próprio no BM25F.
import { tokenize } from "./text.mjs";
import { derivedSignals } from "./signals.mjs";

const arr = (v) => (Array.isArray(v) ? v.filter(Boolean) : v ? [v] : []);

// Sinônimos de catálogo → o texto do campo ganha as palavras que o aluno
// realmente digita. "MUNs" sozinho nunca bate com "simulação da ONU".
const SINONIMOS_TYPE = {
  "MUNs": "MUN MUNs simulação da ONU Model United Nations diplomacia debate delegado comitê",
  "Olimpíadas Científicas": "olimpíada olimpíadas científica prova competição acadêmica medalha",
  "Competições de Escrita": "competição de escrita concurso literário redação ensaio conto poesia crônica escrever",
  "Competições": "competição campeonato torneio desafio hackathon maratona",
  "Mentorias": "mentoria mentor mentoring orientação acompanhamento tutoria conselho de carreira",
  "Estágios": "estágio estagiar internship experiência de trabalho pesquisa assistente",
  "Bolsas de Estudo": "bolsa de estudo bolsa integral auxílio financeiro scholarship isenção",
  "Programas de Intercâmbio": "intercâmbio exchange morar fora estudar fora programa de verão summer",
  "Programas Acadêmicos": "programa acadêmico curso formação capacitação workshop seminário fellowship",
};

const SINONIMOS_AREA = {
  STEM: "STEM ciências exatas matemática física química biologia robótica programação engenharia tecnologia astronomia saúde medicina",
  Humanas: "humanas ciências humanas história geografia filosofia sociologia direito relações internacionais",
  Tech: "tech tecnologia programação código software computação dados inteligência artificial",
  Artes: "artes arte música teatro dança desenho audiovisual cinema fotografia poesia slam",
  Linguagens: "linguagens língua idiomas português inglês literatura escrita redação comunicação debate",
  Política: "política políticas públicas governo parlamento eleições cidadania",
  Ativismo: "ativismo militância voluntariado impacto social comunidade projeto social liderança",
  "Meio Ambiente": "meio ambiente sustentabilidade clima ecologia natureza amazônia",
  Empreendedorismo: "empreendedorismo negócios startup empresa inovação gestão finanças",
};

const SINONIMOS_COST = {
  Gratuito: "gratuito grátis sem custo de graça não paga nada",
  Bolsa: "bolsa auxílio desconto parcial ajuda de custo",
  "Totalmente Financiado": "totalmente financiado custo zero passagem e hospedagem pagas bolsa integral full funded",
};

const SINONIMOS_LEVEL = {
  Fundamental: "ensino fundamental 6º 7º 8º 9º ano fundamental II",
  "Ensino Médio": "ensino médio 1º 2º 3º ano médio colegial high school",
  Gap: "gap year ano de intervalo já terminei o médio formado recém-formado",
  Faculdade: "faculdade graduação universidade universitário ensino superior",
};

const SINONIMOS_FORMAT = {
  Remoto: "remoto online a distância virtual de casa pela internet",
  Presencial: "presencial no local viajar ir até",
  "Híbrido": "híbrido parte online parte presencial",
};

function expand(valores, mapa) {
  const base = arr(valores);
  const extra = base.map((v) => mapa[v] ?? "").filter(Boolean);
  return [...base, ...extra].join(" ");
}

// Nome do campo → texto. As chaves são as usadas nos pesos do BM25F.
export function buildFields(o) {
  return {
    title: o.title ?? "",
    type: expand(o.type, SINONIMOS_TYPE),
    areas: [expand(o.areas, SINONIMOS_AREA), arr(o.keywords).join(" ")].join(" "),
    eligibility: o.eligibility ?? "",
    description: o.description ?? "",
    facets: (() => {
      const s = derivedSignals(o);
      return [
        expand(o.level, SINONIMOS_LEVEL),
        expand(o.cost, SINONIMOS_COST),
        expand(o.format, SINONIMOS_FORMAT),
        arr(o.language).join(" "),
        o.location ?? "",
        arr(o.audience).join(" "),
        // Sinais derivados (ver sinais.mjs) entram como palavras para o BM25
        // poder match "quero algo no Brasil" / "em português" mesmo quando a
        // coluna `language` esta nula.
        s.brasileiro ? "Brasil brasileiro nacional aqui no Brasil" : "",
        s.provavelPortugues ? "em português" : "",
        s.provavelIngles ? "em inglês" : "",
        s.remotoOuHibrido ? "remoto online a distância de casa" : "",
        s.presencialForaDoBrasil ? "presencial no exterior fora do Brasil exige viagem internacional" : "",
      ].join(" ");
    })(),
    extra: [o.process ?? "", o.applicants ?? "", o.additionals ?? ""].join(" "),
  };
}

// Texto único para embedding (passage). Ordem importa: o que mais define a
// oportunidade vem primeiro, porque modelos de embedding pesam mais o começo.
export function buildPassage(o) {
  const linhas = [];
  linhas.push(o.title);
  if (o.type) linhas.push(`Tipo de oportunidade: ${o.type}. ${SINONIMOS_TYPE[o.type] ?? ""}`);
  if (arr(o.areas).length) linhas.push(`Áreas: ${arr(o.areas).join(", ")}. ${arr(o.areas).map((a) => SINONIMOS_AREA[a] ?? "").join(" ")}`);
  if (o.description) linhas.push(o.description);
  if (o.eligibility) linhas.push(`Quem pode participar: ${o.eligibility}`);
  const facetas = [];
  if (arr(o.level).length) facetas.push(`Nível escolar: ${arr(o.level).join(", ")}`);
  if (o.cost) facetas.push(`Custo: ${o.cost} (${SINONIMOS_COST[o.cost] ?? ""})`);
  if (o.format) facetas.push(`Formato: ${o.format} (${SINONIMOS_FORMAT[o.format] ?? ""})`);
  if (o.language) facetas.push(`Idioma: ${o.language}`);
  if (o.location) facetas.push(`Local: ${o.location}`);
  if (facetas.length) linhas.push(facetas.join(". ") + ".");
  if (arr(o.keywords).length) linhas.push(`Palavras-chave: ${arr(o.keywords).join(", ")}`);
  if (o.process) linhas.push(`Como se inscrever: ${o.process}`);
  const s = derivedSignals(o);
  const derivados = [];
  if (s.brasileiro) derivados.push("Programa brasileiro, feito no Brasil");
  if (s.provavelPortugues) derivados.push("acontece em português");
  else if (s.provavelIngles) derivados.push("acontece em inglês");
  if (s.remotoOuHibrido) derivados.push("pode ser feito de casa, remoto");
  if (s.presencialForaDoBrasil) derivados.push("presencial fora do Brasil, exige viagem internacional");
  if (derivados.length) linhas.push(derivados.join(". ") + ".");
  return linhas.filter(Boolean).join("\n");
}

// Passagem para o cross-encoder de rerank. Curta o suficiente pra não
// diluir, mas incluindo elegibilidade/tipo/nível/custo — que o rerank atual
// (só título+descrição) nunca vê.
export function buildRerankPassage(o) {
  const partes = [o.title];
  if (o.type) partes.push(`Tipo: ${o.type}`);
  if (arr(o.areas).length) partes.push(`Áreas: ${arr(o.areas).join(", ")}`);
  if (o.description) partes.push(o.description);
  if (o.eligibility) partes.push(`Quem pode participar: ${o.eligibility}`);
  const f = [];
  if (arr(o.level).length) f.push(`nível ${arr(o.level).join("/")}`);
  if (o.cost) f.push(`custo ${o.cost}`);
  if (o.format) f.push(o.format);
  if (o.language) f.push(`em ${o.language}`);
  const s = derivedSignals(o);
  if (s.brasileiro) f.push("programa brasileiro");
  if (s.provavelPortugues) f.push("em português");
  else if (s.provavelIngles) f.push("em inglês");
  if (s.presencialForaDoBrasil) f.push("presencial fora do Brasil");
  if (f.length) partes.push(f.join(", "));
  return partes.filter(Boolean).join("\n");
}

export { SINONIMOS_TYPE, SINONIMOS_AREA, SINONIMOS_COST, SINONIMOS_LEVEL, SINONIMOS_FORMAT };
