// Sinais DERIVADOS de cada oportunidade - dados que o banco nao tem em
// coluna, mas que estao deduziveis do que ele tem, e que o golden set mostra
// serem decisivos.
//
// Como descobrimos que isso faltava: perfil-05 escreve "meu ingles e fraco,
// prefiro competicoes e programas em portugues" e recebia CSPA, Code/Art
// Competition e Bennington Young Writers nas 3 primeiras posicoes. O
// pipeline nao tinha COMO saber que aqueles programas sao em ingles: a
// coluna `language` esta nula em 161 das 295 oportunidades aprovadas. Mesma
// coisa com "nunca pensei em estudar fora do Brasil" -> vinha LALA
// University Placement e BRASA Pre Americas no topo.
//
// A saida: o TITULO carrega essa informacao de forma bem confiavel, porque
// e o nome proprio do programa no idioma original ("Olimpiada Brasileira de
// Robotica" vs "Young Writers Awards"). A descricao nao serve - e sempre
// escrita em portugues pela equipe, independente do programa.

const PT_MARCADORES = /\b(de|da|do|das|dos|para|com|em|na|no|jovem|jovens|brasileir[ao]|brasil|nacional|olimp[íi]ada|competi[çc][ãa]o|torneio|programa|bolsa|est[áa]gio|escola|ensino|ci[êe]ncias?|l[íi]ngua|redac[ãa]o|desafio|instituto|funda[çc][ãa]o|parlamento|jovem)\b/gi;
const EN_MARCADORES = /\b(the|of|and|for|in|to|program|programme|award|awards|contest|competition|challenge|summer|school|scholarship|fellowship|institute|society|academy|youth|student|students|international|global|university|college|writing|young|camp|internship|research)\b/gi;
const ACENTOS = /[áàâãéêíóôõúüç]/i;

const ESTADOS_BR = /\b(acre|alagoas|amap[áa]|amazonas|bahia|cear[áa]|distrito federal|esp[íi]rito santo|goi[áa]s|maranh[ãa]o|mato grosso|minas gerais|par[áa]|para[íi]ba|paran[áa]|pernambuco|piau[íi]|rio de janeiro|rio grande|rond[ôo]nia|roraima|santa catarina|s[ãa]o paulo|sergipe|tocantins|bras[íi]lia|salvador|recife|fortaleza|manaus|curitiba|porto alegre|belo horizonte|campinas|florian[óo]polis|natal|bel[ée]m|goi[âa]nia|vit[óo]ria|macei[óo]|jo[ãa]o pessoa|teresina|cuiab[áa]|campo grande|palmas|boa vista|macap[áa]|rio branco|porto velho|aracaju|s[ãa]o luis)\b/i;

const SIGLAS_BR = /\b(usp|unicamp|unesp|ufrj|ufmg|ufrgs|ufpe|ufba|ufc|unb|ufsc|ufpr|ita|itaú|itau|senai|sesi|sebrae|fgv|insper|puc|ifsp|ismart|cnpq|capes|mcti|obmep|obr|obi|oba|obf|obq|obb|obl|obc|enem)\b/i;

function razaoIdiomaTitulo(titulo = "") {
  const pt = (titulo.match(PT_MARCADORES) ?? []).length + (ACENTOS.test(titulo) ? 1.5 : 0);
  const en = (titulo.match(EN_MARCADORES) ?? []).length;
  return { pt, en };
}

/**
 * @returns {{brasileiro: boolean, provavelPortugues: boolean, provavelIngles: boolean, confiancaIdioma: 'declarada'|'inferida'}}
 */
export function derivedSignals(o) {
  const titulo = o.title ?? "";
  const local = `${o.location ?? ""} ${o.format ?? ""}`;
  const idioma = o.language ?? "";

  const { pt, en } = razaoIdiomaTitulo(titulo);

  const brasileiro =
    /portugu/i.test(idioma) ||
    /bras[íi]l|brasileir/i.test(`${titulo} ${local}`) ||
    ESTADOS_BR.test(local) ||
    SIGLAS_BR.test(titulo) ||
    (/\bnacional\b/i.test(titulo) && pt > en);

  const declarada = Boolean(idioma);
  const provavelPortugues = declarada ? /portugu/i.test(idioma) : brasileiro || pt > en;
  const provavelIngles = declarada ? /ingl|english/i.test(idioma) : !brasileiro && en > pt;

  // Presencial fora do Brasil: exige passaporte, visto, passagem - barreira
  // real, nao preferencia estetica, para o publico deste produto.
  const presencialForaDoBrasil =
    /presencial/i.test(local) && !ESTADOS_BR.test(local) && !/bras[íi]l/i.test(local) && !brasileiro;

  const remotoOuHibrido = /remoto|online|h[íi]brido|dist[âa]ncia/i.test(local);

  return { brasileiro, provavelPortugues, provavelIngles, presencialForaDoBrasil, remotoOuHibrido, confiancaIdioma: declarada ? "declarada" : "inferida" };
}
