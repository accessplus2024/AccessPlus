import { loadCorpus, db } from "./corpus.mjs";
import { buildFields, buildPassage, buildRerankPassage } from "./docs.mjs";
import { buildIndex, bm25Search } from "./bm25.mjs";
import { embed, cosine } from "./embed.mjs";
import { analyzeQuery, expandedTerms } from "./expand.mjs";
import { tokenize } from "./text.mjs";
import { rerank } from "./rerankcache.mjs";
import { readFileSync, existsSync } from "fs";
import { derivedSignals } from "./signals.mjs";
import { aspectsOf, searchByAspect, mergeRoundRobin } from "./multi.mjs";
import { julgar2 } from "./judge2.mjs";

const arr = (v) => (Array.isArray(v) ? v.filter(Boolean) : v ? [v] : []);

// O cadastro usa vocabulario diferente do catalogo ("Ensino Fundamental" vs
// "Fundamental", "Gap Year" vs "Gap") - sem normalizar, o boost de nivel
// nunca casa e vira ruido.
export function normalizeLevel(n) {
  if (!n) return null;
  const s = String(n).toLowerCase();
  if (/fundamental/.test(s)) return "Fundamental";
  if (/m[ée]dio|colegial/.test(s)) return "Ensino Médio";
  if (/gap/.test(s)) return "Gap";
  if (/faculdade|superior|gradua/.test(s)) return "Faculdade";
  return null;
}

let estado = null;
export async function prepararEstado() {
  if (estado) return estado;
  const corpus = await loadCorpus();
  const index = buildIndex(corpus, buildFields);
  const passagens = corpus.map(buildPassage);
  const vetoresNovos = await embed(passagens, "passage");
  // `chunksDb` serve SÓ ao caminho `vetor: "db"` (busca vetorial pelo Postgres),
  // que foi rejeitado por medição. A variante PROD usa `vetor: "novo"` e não
  // toca nisso — então carregar o arquivo aqui, sem condição, fazia a medição
  // de produção depender de um artefato de uma abordagem descartada.
  const arquivoChunks = new URL("./cache/chunks-db.json", import.meta.url).pathname;
  const chunksDb = existsSync(arquivoChunks) ? JSON.parse(readFileSync(arquivoChunks, "utf8")) : null;
  const byId = new Map(corpus.map((o, i) => [o.id, i]));
  estado = { corpus, index, vetoresNovos, chunksDb, byId };
  return estado;
}

const rankMap = (ids) => new Map(ids.map((id, i) => [id, i + 1]));

async function ladoVetorial(st, queryText, modo) {
  if (modo === "off") return [];
  const [qv] = await embed([queryText], "query");
  if (modo === "novo") {
    return st.corpus
      .map((o, i) => ({ id: o.id, s: cosine(qv, st.vetoresNovos[i]) }))
      .sort((a, b) => b.s - a.s)
      .map((x) => x.id);
  }
  if (!st.chunksDb) {
    throw new Error(
      'variante com `vetor: "db"` exige lab/cache/chunks-db.json — rode `node lab/dumpchunks.mjs` primeiro. ' +
        "As variantes de produção (PROD) usam `vetor: \"novo\"` e não precisam dele."
    );
  }
  const best = new Map();
  for (const c of st.chunksDb) {
    const s = cosine(qv, c.v);
    if (!best.has(c.id) || s > best.get(c.id)) best.set(c.id, s);
  }
  return [...best.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
}

const ftsCache = new Map();
async function ladoFtsBanco(queryText, matchCount) {
  const chave = `${queryText}|${matchCount}`;
  if (ftsCache.has(chave)) return ftsCache.get(chave);
  const { data, error } = await db.rpc("match_opportunities_fts", { query_text: queryText, match_count: matchCount });
  if (error) throw new Error(error.message);
  const ids = data.map((r) => r.opportunity_id);
  ftsCache.set(chave, ids);
  return ids;
}

function ladoBm25(st, termos, boost) {
  return bm25Search(st.index, termos, { boostPorTermo: boost, topK: st.corpus.length }).map((r) => st.corpus[r.docIdx].id);
}

// Boosts estruturados: nunca filtram, so reordenam (Parte 1 do plano).
function boostEstrutural(o, analysis, cfg) {
  let b = 0;
  const areas = arr(o.areas), niveis = arr(o.level);
  if (analysis.areas.length && areas.some((a) => analysis.areas.includes(a))) b += cfg.bArea;
  if (analysis.tipos.length && analysis.tipos.includes(o.type)) b += cfg.bTipo;
  if (analysis.niveis.length && niveis.length) {
    if (niveis.some((n) => analysis.niveis.includes(n))) b += cfg.bNivel;
    else b -= cfg.bNivelPenal;
  }
  if (analysis.precisaGratuito && /gratuit|financiad/i.test(o.cost ?? "")) b += cfg.bCusto;

  // Sinais derivados (sinais.mjs). Sao eles que resolvem o caso real do
  // aluno que diz "meu ingles e fraco, prefiro em portugues" e recebia
  // Bennington/CSPA no topo: a coluna `language` esta nula em 161/295, e o
  // titulo e o unico lugar onde essa informacao existe de forma confiavel.
  const sd = derivedSignals(o);
  if (analysis.inglesFraco) {
    if (sd.provavelPortugues) b += cfg.bIdioma;
    else if (sd.provavelIngles) b -= cfg.bIdiomaPenal;
  }
  if (analysis.preferirRemoto) {
    if (sd.remotoOuHibrido) b += cfg.bFormato;
    if (sd.presencialForaDoBrasil) b -= cfg.bViagemPenal;
  }
  if (analysis.preferirBrasil && !analysis.querExterior) {
    if (sd.brasileiro) b += cfg.bLocal;
    if (sd.presencialForaDoBrasil) b -= cfg.bViagemPenal;
  }
  if (/aberta/i.test(o.inscricoes ?? "")) b += cfg.bAberta;
  return b;
}

export const CFG_PADRAO = {
  vetor: "novo",
  lexical: "bm25",
  expansao: true,
  pesoVetor: 1.0,
  pesoLexical: 1.0,
  rrfK: 60,
  candidates: 30,
  boosts: true,
  bArea: 0.6, bTipo: 0.9, bNivel: 0.5, bNivelPenal: 0.7,
  bCusto: 0.3, bIdioma: 0.35, bIdiomaPenal: 0.4, bFormato: 0.25, bLocal: 0.5, bViagemPenal: 0.5, bAberta: 0.15,
  rerank: "rico",
  pesoRerank: 0.7,
  topK: 10,
  juiz: "off",           // "off" | modelo NIM - reranking listwise por LLM
  juizCandidatos: 30,    // howMany candidates o juiz avalia
  pesoJuiz: 1.0,         // peso da nota do juiz (modo "somado")
  modoJuiz: "somado",    // "somado" | "faixa"  ver comentario em finalizar()
  // O boost estrutural entra so no score de FUSAO, que depois vale 1-pesoRerank
  // (40%) do score final. Resultado pratico observado: um aluno que declara
  // "meu ingles e fraco, prefiro em portugues" ainda recebia Code/Art
  // Competition e CSPA (ambos em ingles) nas posicoes 1 e 3, porque o
  // cross-encoder os colocava no topo e a penalidade de idioma so mordia 40%.
  // Com boostDepois, o boost multiplica o score FINAL - a preferencia do aluno
  // passa a valer sobre o resultado inteiro, nao sobre uma fracao dele.
  boostDepois: false,
  multiQuery: false,     // busca uma consulta por aspecto + merge round-robin
  queryRerank: "bio",    // "bio" | "focada" - o que vai como query pro cross-encoder
};

export async function rodar(perfil, cfgIn = {}) {
  const cfg = { ...CFG_PADRAO, ...cfgIn };
  const st = await prepararEstado();
  const bio = perfil.bio ?? "";
  const areasMarcadas = perfil.areas ?? [];

  const analysis = analyzeQuery({
    bio,
    areasMarcadas,
    nivel: normalizeLevel(perfil.nivel),
    condicaoFinanceira: perfil.condicao_financeira,
    local: perfil.local,
    linguas: perfil.linguas ?? null,
  });

  const { termos, boost } = cfg.expansao
    ? expandedTerms(bio, analysis)
    : { termos: tokenize(bio), boost: null };

  const queryVetorial = cfg.expansao
    ? [bio,
       analysis.areas.length ? `Areas de interesse: ${analysis.areas.join(", ")}.` : "",
       analysis.tipos.length ? `Procura por: ${analysis.tipos.join(", ")}.` : "",
       analysis.niveis.length ? `Nivel escolar: ${analysis.niveis.join(", ")}.` : ""].filter(Boolean).join(" ")
    : bio;

  // ── caminho multi-aspecto ───────────────────────────────────────────
  if (cfg.multiQuery) {
    const aspectos = aspectsOf(analysis, bio);
    const listas = [];
    for (const aspecto of aspectos) {
      listas.push({ aspecto, lista: await searchByAspect(st, bio, analysis, aspecto) });
    }
    const mesclado = mergeRoundRobin(listas, cfg.candidates);
    // O boost estrutural entra aqui como reordenacao DENTRO do pool mesclado,
    // preservando a diversidade que o round-robin garantiu.
    const comBoost = mesclado.map((m, i) => {
      const o = st.corpus[st.byId.get(m.id)];
      const b = cfg.boosts ? boostEstrutural(o, analysis, cfg) : 0;
      const posicaoInicial = 1 - i / Math.max(1, mesclado.length);
      return { ...o, ...m, _boost: b, fusao: posicaoInicial * (1 + b), rankVetor: null, rankLex: null };
    });
    comBoost.sort((a, b) => b.fusao - a.fusao);
    return await finalizar(comBoost, analysis, bio, cfg);
  }

  const idsVetor = await ladoVetorial(st, queryVetorial, cfg.vetor);
  let idsLex = [];
  if (cfg.lexical === "bm25") idsLex = ladoBm25(st, termos, boost);
  else if (cfg.lexical === "fts") idsLex = await ladoFtsBanco(`${areasMarcadas.join(" ")} ${bio}`, st.corpus.length);

  const rV = rankMap(idsVetor), rL = rankMap(idsLex);
  const todos = new Set([...rV.keys(), ...rL.keys()]);
  let fundidos = [...todos].map((id) => {
    const sv = rV.has(id) ? cfg.pesoVetor / (cfg.rrfK + rV.get(id)) : 0;
    const sl = rL.has(id) ? cfg.pesoLexical / (cfg.rrfK + rL.get(id)) : 0;
    return { id, fusao: sv + sl, rankVetor: rV.get(id) ?? null, rankLex: rL.get(id) ?? null };
  });

  const maxFusao = Math.max(...fundidos.map((f) => f.fusao), 1e-9);
  fundidos = fundidos.map((f) => {
    const o = st.corpus[st.byId.get(f.id)];
    const b = cfg.boosts ? boostEstrutural(o, analysis, cfg) : 0;
    return { ...f, _boost: b, fusao: (f.fusao / maxFusao) * (1 + b) };
  });

  fundidos.sort((a, b) => b.fusao - a.fusao);
  const candidates = fundidos.slice(0, cfg.candidates).map((f) => ({ ...st.corpus[st.byId.get(f.id)], ...f }));
  return await finalizar(candidates, analysis, bio, cfg);
}

// Query focada: em vez da bio crua (que tem muito contexto pessoal sem valor
// de relevancia - cidade, cor, renda), monta uma frase de BUSCA. Cross-encoder
// de 1B se perde em texto longo e narrativo.
function queryParaRerank(bio, analysis, modo) {
  if (modo === "bio") return bio;
  const partes = [];
  if (analysis.areas.length) partes.push(`Interesses: ${analysis.areas.join(", ")}`);
  if (analysis.tipos.length) partes.push(`Quer: ${analysis.tipos.join(", ")}`);
  if (analysis.niveis.length) partes.push(`Nivel: ${analysis.niveis.join(", ")}`);
  if (analysis.precisaGratuito) partes.push("gratuito ou bolsa integral");
  if (analysis.inglesFraco) partes.push("em portugues");
  if (analysis.preferirBrasil && !analysis.querExterior) partes.push("no Brasil, sem viagem internacional");
  if (analysis.preferirRemoto) partes.push("remoto");
  return partes.length ? `${partes.join(". ")}. ${bio}` : bio;
}

async function finalizar(candidates, analysis, bio, cfg) {
  if (candidates.length === 0) return { analysis, ranked: [], candidates };

  // Juiz LLM (listwise): o sinal mais forte que temos. O cross-encoder passa
  // a ser desempate dentro de cada faixa de nota.
  let notasJuiz = null;
  if (cfg.juiz !== "off") {
    notasJuiz = await julgar2(bio, candidates.slice(0, cfg.juizCandidatos), { modelo: cfg.juiz, lote: 10 });
  }

  if (cfg.rerank === "off") {
    const ord = candidates.map((o) => ({
      ...o,
      notaJuiz: notasJuiz?.get(o.id) ?? null,
      final: (notasJuiz?.has(o.id) ? (notasJuiz.get(o.id) / 3) * cfg.pesoJuiz : 0) + o.fusao,
    }));
    ord.sort(cfg.modoJuiz === "faixa" ? ordenarPorFaixa : (a, b) => b.final - a.final);
    return { analysis, ranked: ord.slice(0, cfg.topK), candidates: ord };
  }
  const passagens = candidates.map((o) =>
    cfg.rerank === "rico" ? buildRerankPassage(o) : `${o.title}\n${o.description ?? ""}`
  );
  const rankings = await rerank(queryParaRerank(bio, analysis, cfg.queryRerank), passagens);
  const logits = rankings.map((r) => r.logit);
  const minL = Math.min(...logits), maxL = Math.max(...logits);
  const norm = (l) => (maxL > minL ? (l - minL) / (maxL - minL) : 0.5);

  const comRerank = rankings.map((r) => {
    const o = candidates[r.index];
    let base = cfg.pesoRerank * norm(r.logit) + (1 - cfg.pesoRerank) * o.fusao;
    if (cfg.boostDepois) base *= 1 + o._boost;
    const nota = notasJuiz?.get(o.id);
    return {
      ...o,
      rerankLogit: r.logit,
      notaJuiz: nota ?? null,
      final: nota === undefined ? base : base + (nota / 3) * cfg.pesoJuiz,
    };
  });
  comRerank.sort(cfg.modoJuiz === "faixa" ? ordenarPorFaixa : (a, b) => b.final - a.final);
  return { analysis, ranked: comRerank.slice(0, cfg.topK), candidates: comRerank };
}

// Ordenacao lexicografica: FAIXA do juiz primeiro, score da busca como
// desempate DENTRO da faixa.
//
// Medido: a maior faixa de nota empatada tem 14,5 itens em media (max 25 de
// 30). Ou seja, o juiz nao ordena - ele classifica em 4 baldes. Somar a nota
// ao score (modo "somado") achatava 14 itens no mesmo valor e entregava a
// decisao final ao desempate, destruindo a ordem que a busca tinha construido
// - foi por isso que o juiz PIOROU recall@10 de 0.668 pra 0.602.
// A discriminacao dele e boa (media 2.27 nos relevantes do golden set contra
// 1.32 nos outros); o que e ruim e a granularidade. Faixa como chave primaria
// aproveita a discriminacao e preserva a ordenacao fina da busca.
// Item SEM nota (lote do juiz falhou) entra na faixa 2, junto dos "serve com
// ressalva": nunca e rebaixado por uma falha nossa de infraestrutura.
function ordenarPorFaixa(a, b) {
  const fa = a.notaJuiz === null || a.notaJuiz === undefined ? 2 : a.notaJuiz;
  const fb = b.notaJuiz === null || b.notaJuiz === undefined ? 2 : b.notaJuiz;
  if (fa !== fb) return fb - fa;
  return b.final - a.final;
}
