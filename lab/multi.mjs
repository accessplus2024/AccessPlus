// Busca multi-aspecto + fusao com garantia de coverage.
//
// Por que: uma bio real nao tem UM assunto. "gosto de escrever e de discutir
// politica, participei do gremio" tem tres. Um embedding unico da bio inteira
// vira uma media desses tres - e a media nao esta perto de nenhum deles. Foi
// exatamente o que o diagnostico mostrou no perfil-03 (21 relevantes,
// recall@10 de 0.10): o pool tinha os itens, mas o topo era dominado por um
// aspecto so.
//
// A solucao e classica em RAG: uma consulta por aspecto, e depois merge em
// ROUND-ROBIN em vez de por score. Round-robin garante que cada interesse do
// aluno ocupe posicao no topo, em vez do interesse mais "forte" no embedding
// levar as 10 vagas.
import { bm25Search } from "./bm25.mjs";
import { embed, cosine } from "./embed.mjs";
import { expandedTerms } from "./expand.mjs";
import { tokenize } from "./text.mjs";

const RRF_K = 60;

export function aspectsOf(analysis, bio) {
  const asp = [];
  for (const a of analysis.areas) asp.push({ chave: `area:${a}`, rotulo: a, tipo: "area" });
  for (const t of analysis.tipos) asp.push({ chave: `tipo:${t}`, rotulo: t, tipo: "tipo" });
  // A bio inteira continua sendo um aspecto - e o unico que captura nuance
  // que nenhum rotulo cobre ("monto robos com sucata", "saraus do bairro").
  asp.unshift({ chave: "bio", rotulo: null, tipo: "bio" });
  return asp.slice(0, 7); // teto de custo: 7 consultas por busca
}

function textoDaConsulta(bio, analysis, aspecto) {
  if (aspecto.tipo === "bio") {
    const extras = [
      analysis.niveis.length ? `Nivel escolar: ${analysis.niveis.join(", ")}.` : "",
      analysis.precisaGratuito ? "Precisa ser gratuito ou com bolsa integral." : "",
      analysis.inglesFraco ? "Prefere programas em portugues." : "",
      analysis.preferirBrasil && !analysis.querExterior ? "Prefere oportunidades no Brasil, sem viagem internacional." : "",
      analysis.preferirRemoto ? "Prefere formato remoto." : "",
    ].filter(Boolean);
    return `${bio} ${extras.join(" ")}`.trim();
  }
  const qualificadores = [
    analysis.niveis.length ? `para ${analysis.niveis.join(" ou ")}` : "",
    analysis.precisaGratuito ? "gratuito ou com bolsa" : "",
    analysis.inglesFraco ? "em portugues" : "",
    analysis.preferirBrasil && !analysis.querExterior ? "no Brasil" : "",
    analysis.preferirRemoto ? "remoto" : "",
  ].filter(Boolean).join(", ");
  const prefixo = aspecto.tipo === "tipo" ? "Oportunidade do tipo" : "Oportunidade na area de";
  return `${prefixo} ${aspecto.rotulo}${qualificadores ? `, ${qualificadores}` : ""}. Contexto do estudante: ${bio}`;
}

export async function searchByAspect(st, bio, analysis, aspecto, { porLado = 40 } = {}) {
  const texto = textoDaConsulta(bio, analysis, aspecto);

  const [qv] = await embed([texto], "query");
  const vet = st.corpus
    .map((o, i) => ({ id: o.id, s: cosine(qv, st.vetoresNovos[i]) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, porLado)
    .map((x) => x.id);

  const { termos, boost } = expandedTerms(bio, analysis);
  const termosAsp = aspecto.rotulo ? [...termos, ...tokenize(aspecto.rotulo)] : termos;
  const boostAsp = new Map(boost);
  if (aspecto.rotulo) for (const t of tokenize(aspecto.rotulo)) boostAsp.set(t, 2.0);
  const lex = bm25Search(st.index, termosAsp, { boostPorTermo: boostAsp, topK: porLado }).map((r) => st.corpus[r.docIdx].id);

  // RRF interno do aspecto (vetor + lexico)
  const rV = new Map(vet.map((id, i) => [id, i + 1]));
  const rL = new Map(lex.map((id, i) => [id, i + 1]));
  const ids = [...new Set([...vet, ...lex])];
  return ids
    .map((id) => ({
      id,
      score: (rV.has(id) ? 1 / (RRF_K + rV.get(id)) : 0) + (rL.has(id) ? 1 / (RRF_K + rL.get(id)) : 0),
    }))
    .sort((a, b) => b.score - a.score);
}

/**
 * Merge round-robin: da vez a cada aspecto, na ordem, pegando o melhor item
 * ainda nao escolhido daquele aspecto. Devolve tambem, por id, quais
 * aspectos o trouxeram - util pra explicar ao aluno e pra depurar.
 */
export function mergeRoundRobin(listasPorAspecto, total) {
  const escolhidos = [];
  const vistos = new Set();
  const origem = new Map();
  const cursores = listasPorAspecto.map(() => 0);

  for (const { aspecto, lista } of listasPorAspecto) {
    for (const item of lista) {
      if (!origem.has(item.id)) origem.set(item.id, []);
      origem.get(item.id).push(aspecto.chave);
    }
  }

  let progrediu = true;
  while (escolhidos.length < total && progrediu) {
    progrediu = false;
    for (let i = 0; i < listasPorAspecto.length; i++) {
      const { lista } = listasPorAspecto[i];
      while (cursores[i] < lista.length && vistos.has(lista[cursores[i]].id)) cursores[i]++;
      if (cursores[i] >= lista.length) continue;
      const item = lista[cursores[i]++];
      vistos.add(item.id);
      escolhidos.push({ id: item.id, scoreAspecto: item.score, aspectos: origem.get(item.id) ?? [] });
      progrediu = true;
      if (escolhidos.length >= total) break;
    }
  }
  return escolhidos;
}
