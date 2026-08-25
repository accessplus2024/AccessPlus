// Resolve os títulos do golden set para ids reais, com os mesmos fallbacks do
// script original (sigla entre parênteses, palavra inteira) — reimplementado
// aqui só pra não depender do dotenv/ordem de import do script de produção.
import { readFileSync } from "fs";
import { normalizeTitle } from "./text.mjs";

const escapeRegex = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const sigla = (t) => { const m = t.match(/\(([^)]+)\)/); return m ? normalizeTitle(m[1]) : null; };

export function resolverTitulos(titulos, corpus, contexto = "") {
  const porNorm = new Map(corpus.map((o) => [normalizeTitle(o.title), o.id]));
  const ids = [];
  const naoResolvidos = [];
  for (const titulo of titulos) {
    const q = normalizeTitle(titulo);
    let id = porNorm.get(q);
    if (id === undefined) {
      const bate = corpus.filter((o) => sigla(o.title) === q);
      if (bate.length === 1) id = bate[0].id;
    }
    if (id === undefined) {
      const re = new RegExp(`\\b${escapeRegex(q)}\\b`);
      const bate = [...porNorm.entries()].filter(([t]) => re.test(t));
      if (bate.length === 1) id = bate[0][1];
    }
    if (id === undefined) { naoResolvidos.push(titulo); continue; }
    ids.push(id);
  }
  return { ids, naoResolvidos };
}

export function loadGoldenSet(caminho, corpus) {
  const gs = JSON.parse(readFileSync(caminho, "utf8"));
  return gs.perfis.map((caso) => {
    const rel = resolverTitulos(caso.deve_aparecer_no_top10 ?? [], corpus, caso.id);
    const nao = resolverTitulos(caso.nao_deve_aparecer_no_top5 ?? [], corpus, caso.id);
    return {
      id: caso.id,
      perfil: caso.perfil,
      observacao: caso.observacao,
      semOportunidadeEsperada: caso.sem_oportunidade_esperada === true,
      relevantIds: rel.ids,
      naoDeveIds: nao.ids,
      naoResolvidos: [...rel.naoResolvidos, ...nao.naoResolvidos],
    };
  });
}
