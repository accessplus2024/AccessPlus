// Orquestração da busca. Nada aqui FILTRA por preferência do aluno — tudo é
// reordenação. Os únicos cortes duros são `status='Aprovada'` (na carga do
// catálogo) e a faixa de idade explícita (`ageFilter.js`, aplicada por quem
// chama). Ver docs/accessia.md §1.
//
// ANTES DE MEXER EM QUALQUER PESO, a ablação (golden set de 30 perfis, 3
// rodadas, variância zero — o pipeline é determinístico):
//
//   configuração                                recall@10  prec@5  NDCG@10  MRR   vazam
//   A  produção antiga (FTS do banco + rerank)     0.617    0.345   0.522   0.593   4
//   B  + BM25F pt-BR em processo                   0.639    0.364   0.538   0.598   4
//   C  + expansão de consulta                      0.649    0.309   0.529   0.602   4
//   D  + embedding com todos os campos             0.647    0.309   0.526   0.600   3
//   E  + boosts estruturados e sinais derivados    0.667    0.318   0.549   0.650   4
//   G  + rerank com passagem rica, misturado       0.668    0.327   0.588   0.705   2   <- esta
//   K  + busca multi-aspecto                       0.644    0.327   0.589   0.738   2
//   N  + juiz LLM somado ao score                  0.602    0.327   0.546   0.691   2
//
// O juiz LLM (`judge.js`) e a busca multi-aspecto (`multiAspect.js`) estão
// DESLIGADOS por medição, não por preguiça: o porquê de cada um está em
// docs/accessia.md §6. Ligar sem remedir é regressão.
//
// Etapas: entender a consulta (`parseQuery.js`) → BM25F em processo
// (`bm25.js`) → embedding com todos os campos (`fields.js`) → boosts e sinais
// derivados do título (`signals.js`) → cross-encoder com passagem rica
// (`rerank.js`), misturado 0.6/0.4 com o score de fusão em vez de substituí-lo
// (rerank puro media 0.599 de recall).
import { getCatalog } from "./catalog.js";
import { analyzeQuery, expandedTerms } from "./parseQuery.js";
import { aspectsOf, searchByAspect, mergeRoundRobin } from "./multiAspect.js";
import { bm25Search } from "./bm25.js";
import { embed, cosine } from "./embedText.js";
import { buildRerankPassage } from "./fields.js";
import { derivedSignals } from "./signals.js";
import { rerank } from "./rerank.js";
import { judgeRelevance } from "./judge.js";
import { tokenize } from "./text.js";

const RRF_K = 60;
const arr = (v) => (Array.isArray(v) ? v.filter(Boolean) : v ? [v] : []);

// O cadastro usa vocabulário diferente do catálogo ("Ensino Fundamental" vs
// "Fundamental", "Gap Year" vs "Gap"). Sem normalizar, o boost de nível nunca
// casa e a penalidade de nível dispara contra oportunidades certas.
export function normalizeLevel(n) {
  if (!n) return null;
  const s = String(n).toLowerCase();
  if (/fundamental/.test(s)) return "Fundamental";
  if (/m[ée]dio|colegial/.test(s)) return "Ensino Médio";
  if (/gap/.test(s)) return "Gap";
  if (/faculdade|superior|gradua/.test(s)) return "Faculdade";
  return null;
}

export const PESOS = {
  bArea: 0.6,
  bTipo: 0.9,
  // Tipo certo, área errada: um empurrãozinho, não um passe pro top.
  bTipoSemArea: 0.15,
  bNivel: 0.5,
  bNivelPenal: 0.7,
  bCusto: 0.3,
  bIdioma: 0.5,
  bIdiomaPenal: 0.8,
  bFormato: 0.25,
  bLocal: 0.5,
  bViagemPenal: 0.5,
  bAberta: 0.15,
};

function boostEstrutural(o, analysis, pesos = PESOS) {
  let b = 0;
  const areas = arr(o.areas);
  const niveis = arr(o.level);

  const areaCasa = analysis.areas.length > 0 && areas.some((a) => analysis.areas.includes(a));
  if (areaCasa) b += pesos.bArea;

  // O boost de TIPO só vale quando a ÁREA também casa (havendo área pedida).
  //
  // Sem essa condição, `bTipo` (0.9, o peso mais forte) é o suficiente para
  // colocar no topo um item que só acerta o formato. Caso real: um aluno
  // escolheu "História, filosofia, direito" e "trabalhar num projeto de
  // verdade" (que mapeia para Estágios) e recebeu EnergyMag Virtual
  // Internships em 1º e Science Internship Program em 6º — os dois ÚNICOS
  // estágios do catálogo, e os dois de STEM. O formato certo de um assunto
  // errado não serve pra ninguém.
  //
  // A hierarquia aqui é deliberada: a área é o que o aluno quer estudar; o
  // tipo é como ele quer participar. Quando o catálogo não tem o cruzamento
  // dos dois, o certo é ceder no tipo, nunca na área.
  if (analysis.tipos.length && analysis.tipos.includes(o.type)) {
    b += analysis.areas.length === 0 || areaCasa ? pesos.bTipo : pesos.bTipoSemArea;
  }
  if (analysis.niveis.length && niveis.length) {
    if (niveis.some((n) => analysis.niveis.includes(n))) b += pesos.bNivel;
    else b -= pesos.bNivelPenal;
  }
  if (analysis.precisaGratuito && /gratuit|financiad/i.test(o.cost ?? "")) b += pesos.bCusto;

  const sd = derivedSignals(o);
  if (analysis.inglesFraco) {
    if (sd.provavelPortugues) b += pesos.bIdioma;
    else if (sd.provavelIngles) b -= pesos.bIdiomaPenal;
  }
  if (analysis.preferirRemoto) {
    if (sd.remotoOuHibrido) b += pesos.bFormato;
    if (sd.presencialForaDoBrasil) b -= pesos.bViagemPenal;
  }
  if (analysis.preferirBrasil && !analysis.querExterior) {
    if (sd.brasileiro) b += pesos.bLocal;
    if (sd.presencialForaDoBrasil) b -= pesos.bViagemPenal;
  }
  // NÃO existe boost simétrico para `querExterior`, e isso foi testado, não
  // esquecido. A intuição era: se o aluno pediu algo fora do Brasil, premie o
  // que é fora. Medido no golden set, piorou tudo — recall 0.679 → 0.657,
  // precision 0.355 → 0.327, NDCG 0.618 → 0.558.
  //
  // O motivo é instrutivo: os 5 perfis do golden set que declaram querer o
  // exterior não esperam programas estrangeiros GENÉRICOS, esperam itens
  // específicos (PAIR para o de IA, TechGirls para as duas de distorção
  // idade-série). Premiar "não é brasileiro" empurra para cima qualquer
  // programa estrangeiro e enterra justamente o certo. Querer o exterior é
  // razão para PARAR DE PENALIZAR — que é o que a condição
  // `preferirBrasil && !querExterior` acima já faz — não para premiar.
  if (/aberta/i.test(o.inscricoes ?? "")) b += pesos.bAberta;
  return b;
}

// Texto da consulta enviado ao embedding: a bio mais os rótulos que a análise
// deduziu. Medido: acrescentar os rótulos ajuda (0.639 → 0.649); o BM25 recebe
// os mesmos termos com peso menor, porque são inferência nossa e não algo que
// o aluno escreveu.
function consultaVetorial(bio, analysis) {
  return [
    bio,
    analysis.areas.length ? `Areas de interesse: ${analysis.areas.join(", ")}.` : "",
    analysis.tipos.length ? `Procura por: ${analysis.tipos.join(", ")}.` : "",
    analysis.niveis.length ? `Nivel escolar: ${analysis.niveis.join(", ")}.` : "",
  ].filter(Boolean).join(" ");
}

/**
 * @param {object} entrada
 * @param {string} entrada.texto  o que o aluno escreveu
 * @param {string[]} [entrada.areas]
 * @param {string} [entrada.nivel]
 * @param {string} [entrada.condicaoFinanceira]
 * @param {string} [entrada.local] 'brasil' | 'fora' | 'ambos'
 */
export async function search(entrada, opcoes = {}) {
  const {
    candidates: nCandidatos = 50,
    topK = 15,
    // Ver bloco "DUAS DECISÕES QUE A MEDIÇÃO IMPÔS" no topo do arquivo antes
    // de ligar qualquer um destes dois.
    usarJuiz = false,
    multiAspecto = false,
    usarRerank = true,
    pesoRerank = 0.6,
    pesoJuiz = 1.0,
    juizCandidatos = 20,
    // Escopo rígido por tipo. É o ÚNICO filtro por preferência do aluno em todo
    // o pipeline, e só é acionado quando ele nomeia uma categoria do catálogo
    // COM marcador de exclusividade ("apenas competições de escrita") — ver
    // roteador.js. Preferência expressa desse jeito não é peso a ser somado:
    // é um pedido para não ver o resto.
    escopoTipo = null,
  } = opcoes;

  const cat = await getCatalog();
  const bio = entrada.texto ?? "";

  const analysis = analyzeQuery({
    bio,
    areasMarcadas: entrada.areas ?? [],
    // Rótulos que já vêm estruturados (funil de exploração, cadastro, semente
    // de "tem outras parecidas") não passam pelo texto: seria escrevê-los em
    // prosa e esperar que o analisador os reconhecesse de volta — o que
    // falhava e deixava a busca sem boost nenhum.
    tiposMarcados: entrada.tipos ?? [],
    nivel: normalizeLevel(entrada.nivel),
    condicaoFinanceira: entrada.condicaoFinanceira ?? null,
    local: entrada.local ?? null,
    linguas: entrada.linguas ?? null,
  });

  let pool = multiAspecto
    ? await poolMultiAspecto(cat, bio, analysis, nCandidatos)
    : await poolConsultaUnica(cat, bio, analysis, nCandidatos);

  if (escopoTipo) {
    const antes = pool.length;
    pool = pool.filter((o) => o.type === escopoTipo);
    console.log(`[buscar] escopo rígido "${escopoTipo}": ${antes} → ${pool.length} candidatos`);
  }

  if (!pool.length) {
    return { analysis, results: [], todosCandidatos: [], diagnostico: { poolVazio: true } };
  }

  // Rerank e juiz são independentes: em paralelo, para não somar latências.
  const passagens = pool.map(buildRerankPassage);
  const [rankings, notasJuiz] = await Promise.all([
    usarRerank
      ? rerank(bio, passagens).catch((e) => { console.error("[buscar] rerank falhou, mantendo ordem da busca:", e.message); return null; })
      : Promise.resolve(null),
    usarJuiz
      ? judgeRelevance(bio, pool.slice(0, juizCandidatos)).catch((e) => { console.error("[buscar] juiz falhou:", e.message); return new Map(); })
      : Promise.resolve(new Map()),
  ]);

  let ordenado;
  if (rankings) {
    const logits = rankings.map((r) => r.logit);
    const minL = Math.min(...logits), maxL = Math.max(...logits);
    const norm = (l) => (maxL > minL ? (l - minL) / (maxL - minL) : 0.5);
    ordenado = rankings.map((r) => {
      const o = pool[r.index];
      const nota = notasJuiz.get(o.id);
      return {
        ...o,
        rerankLogit: r.logit,
        notaJuiz: nota ?? null,
        score: pesoRerank * norm(r.logit) + (1 - pesoRerank) * o.fusao + (nota === undefined ? 0 : (nota / 3) * pesoJuiz),
      };
    });
  } else {
    ordenado = pool.map((o) => {
      const nota = notasJuiz.get(o.id);
      return { ...o, rerankLogit: null, notaJuiz: nota ?? null, score: o.fusao + (nota === undefined ? 0 : (nota / 3) * pesoJuiz) };
    });
  }
  ordenado.sort((a, b) => b.score - a.score);

  return {
    analysis,
    results: ordenado.slice(0, topK),
    todosCandidatos: ordenado,
    diagnostico: {
      estrategia: multiAspecto ? "multi-aspecto" : "consulta-unica",
      tamanhoPool: pool.length,
      rerankRespondeu: Boolean(rankings),
      juizRespondeu: notasJuiz.size,
    },
  };
}

// Caminho padrão (variante G): uma consulta, vetor + BM25F fundidos por RRF,
// e boost estrutural aplicado sobre o score de fusão normalizado.
async function poolConsultaUnica(cat, bio, analysis, nCandidatos) {
  const { termos, boost } = expandedTerms(bio, analysis);
  const [qv] = await embed([consultaVetorial(bio, analysis)], "query");

  const idsVetor = cat.corpus
    .map((o, i) => ({ id: o.id, s: cosine(qv, cat.vectors[i]) }))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.id);
  const idsLex = bm25Search(cat.index, termos, { boostPorTermo: boost, topK: cat.corpus.length })
    .map((r) => cat.corpus[r.docIdx].id);

  const rV = new Map(idsVetor.map((id, i) => [id, i + 1]));
  const rL = new Map(idsLex.map((id, i) => [id, i + 1]));

  const fundidos = [...new Set([...rV.keys(), ...rL.keys()])].map((id) => ({
    id,
    fusaoBruta: (rV.has(id) ? 1 / (RRF_K + rV.get(id)) : 0) + (rL.has(id) ? 1 / (RRF_K + rL.get(id)) : 0),
    rankVetor: rV.get(id) ?? null,
    rankLexical: rL.get(id) ?? null,
  }));

  // Normaliza antes de multiplicar pelo boost: o score RRF vive na casa de
  // 0.01–0.03, então um boost aditivo nessa escala dominaria tudo.
  const maxFusao = Math.max(...fundidos.map((f) => f.fusaoBruta), 1e-9);
  const comBoost = fundidos.map((f) => {
    const o = cat.corpus[cat.byId.get(f.id)];
    return { ...o, ...f, fusao: (f.fusaoBruta / maxFusao) * (1 + boostEstrutural(o, analysis)) };
  });
  comBoost.sort((a, b) => b.fusao - a.fusao);
  return comBoost.slice(0, nCandidatos);
}

// Caminho alternativo: uma consulta por interesse detectado, merge em
// round-robin. Melhor MRR, recall pior — ver o bloco de decisões no topo.
async function poolMultiAspecto(cat, bio, analysis, nCandidatos) {
  const aspectos = aspectsOf(analysis, bio);
  const listas = await Promise.all(
    aspectos.map(async (aspecto) => ({ aspecto, lista: await searchByAspect(cat, bio, analysis, aspecto) }))
  );
  const mesclado = mergeRoundRobin(listas, nCandidatos);
  const comBoost = mesclado.map((m, i) => {
    const o = cat.corpus[cat.byId.get(m.id)];
    const posicaoInicial = 1 - i / Math.max(1, mesclado.length);
    return { ...o, aspectos: m.aspectos, fusao: posicaoInicial * (1 + boostEstrutural(o, analysis)) };
  });
  comBoost.sort((a, b) => b.fusao - a.fusao);
  return comBoost;
}

/**
 * Busca por categoria do catálogo ("quais MUNs vocês têm?"). Não passa por LLM
 * nenhum: filtro exato na coluna `type`, ordenado por inscrição aberta e por
 * BM25 sobre o resto da frase. Para esse tipo de pergunta, a resposta mais
 * confiável que existe é o próprio catálogo.
 */
export async function searchByCategory(tipo, textoExtra = "", { topK = 12 } = {}) {
  const cat = await getCatalog();
  // `tipo` é OBRIGATÓRIO aqui. Sem ele isto varria o catálogo inteiro e
  // devolvia 12 itens "do catálogo" — foi o que aconteceu com "existe mais
  // algum programa de robótica sem restrições?": a palavra "programa" bateu no
  // regex de listagem, nenhum tipo concreto foi identificado, e a resposta
  // virou uma amostra quase arbitrária de oportunidades com inscrição aberta,
  // sem nenhuma robótica. Quem chama deve tratar `null` como "isto não é uma
  // pergunta de categoria" e cair na busca normal.
  if (!tipo) return [];

  const doTipo = cat.corpus.filter((o) => o.type === tipo);
  if (!doTipo.length) return [];

  const aberta = (o) => (/aberta/i.test(o.inscricoes ?? "") ? 1 : 0);

  // Termos que descrevem a PRÓPRIA categoria são removidos da consulta: dentro
  // de "Olimpíadas Científicas", a palavra "olimpíada" está nos 60 itens e não
  // distingue nenhum deles — só adiciona ruído proporcional ao size do
  // título. Sintoma observado: "tem alguma olimpíada de biologia?" devolvia
  // Olimpíada Mandacaru de Matemática e Olimpíada de Informática à frente da
  // Olimpíada Brasileira de Biologia, porque "olimpíada" competia de igual pra
  // igual com "biologia". A categoria já está fixada; o nome dela não é
  // informação.
  const termosDaCategoria = new Set(tokenize(tipo));
  const termos = tokenize(textoExtra).filter((t) => !termosDaCategoria.has(t));

  // Sem texto além da categoria ("quais MUNs vocês têm?"): não há relevância a
  // medir, então inscrição aberta primeiro é a única ordem útil.
  if (!termos.length) {
    return doTipo.slice().sort((a, b) => aberta(b) - aberta(a)).slice(0, topK);
  }

  // Com texto, a RELEVÂNCIA é a chave primária e "inscrição aberta" entra como
  // BÔNUS, não como chave de ordenação.
  //
  // Estava invertido, e o efeito era grave: ordenar por `aberta` primeiro fazia
  // as 236 oportunidades abertas virem antes de qualquer consideração de
  // assunto, com a relevância decidindo só o desempate entre elas. Um item
  // encerrado mas exatamente o que o aluno pediu (VEX Robotics, FIRST Robotics
  // — as duas competições de robótica do catálogo estão com inscrição
  // encerrada) caía atrás de 236 itens sem relação nenhuma. Prazo fechado é uma
  // ressalva a mostrar, não motivo para esconder o item certo.
  const pontos = new Map(
    bm25Search(cat.index, termos, { topK: cat.corpus.length }).map((r) => [cat.corpus[r.docIdx].id, r.score])
  );
  const maxPonto = Math.max(...doTipo.map((o) => pontos.get(o.id) ?? 0), 1e-9);
  const BONUS_ABERTA = 0.12; // ~12% do topo: reordena empates, nunca inverte relevância

  return doTipo
    .slice()
    .map((o) => ({ o, score: (pontos.get(o.id) ?? 0) / maxPonto + aberta(o) * BONUS_ABERTA }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.o)
    .slice(0, topK);
}
