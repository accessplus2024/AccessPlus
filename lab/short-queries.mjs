// O golden set é feito de BIOS longas de alunos reais. Uma pergunta curta e
// explícita ("quero pesquisa na área de história") é um regime diferente, e
// não estava sendo medido por nada. Este arquivo existe pra isso.
import dotenv from "dotenv";
dotenv.config({ path: new URL("../.env", import.meta.url).pathname, quiet: true });
const { search } = await import("../server/utils/rag/search.js");
const { analyzeQuery } = await import("../server/utils/rag/parseQuery.js");

const consultas = [
  "quero oportunidade para fazer pesquisa na area de historia",
  "quero fazer pesquisa em história",
  "olimpíada de história",
  "quero fazer um MUN",
  "estágio de pesquisa em biologia",
  "concurso de redação em português",
  "mentoria de carreira",
];

for (const q of consultas) {
  const a = analyzeQuery({ bio: q });
  const r = await search({ texto: q }, { candidates: 50, topK: 6 });
  console.log(`\n### "${q}"`);
  console.log(`    areas=${JSON.stringify(a.areas)} tipos=${JSON.stringify(a.tipos)}`);
  r.results.forEach((o, i) =>
    console.log(`    ${i + 1}. ${o.title}  [${o.type}] areas=${JSON.stringify(o.areas)}`)
  );
}
