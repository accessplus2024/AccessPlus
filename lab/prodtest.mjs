import dotenv from "dotenv"; dotenv.config({ path: "/home/claude/accessia/.env", quiet: true });
const { search, searchByCategory } = await import("/home/claude/accessia/server/utils/rag/search.js");
const t0 = Date.now();
const perfis = [
  { nome: "artes/slam, inglês fraco", e: { texto: "Sou negra, estudo em escola pública em Salvador, 3º ano do médio. Escrevo poesia e faço slam nos saraus do bairro. Meu inglês é fraco, prefiro competições e programas em português.", areas: ["Humanas","Linguagens","Artes"], condicaoFinanceira: "precisa_gratuito" } },
  { nome: "empreend. favela", e: { texto: "Moro numa favela do Rio de Janeiro, ajudo minha mãe com um pequeno negócio de salgados. Quero aprender a empreender de verdade.", condicaoFinanceira: "precisa_gratuito" } },
  { nome: "13 anos, não sabe", e: { texto: "Tenho 13 anos, tô no 7º ano numa escola pública, minha família ganha até 2 salários mínimos. Curioso sobre ciência — gosto de matemática, de bichos e de foguete. Ainda não sei o que quero ser.", areas:["STEM"], nivel:"Ensino Fundamental", condicaoFinanceira: "precisa_gratuito" } },
];
for (const p of perfis) {
  const t = Date.now();
  const r = await search(p.e, { candidates: 30, topK: 8 });
  console.log(`\n=== ${p.nome}  (${((Date.now()-t)/1000).toFixed(1)}s)`);
  console.log("   analise:", JSON.stringify(r.analysis));
  console.log("   diag:", JSON.stringify(r.diagnostico));
  r.results.forEach((o,i)=>console.log(`   ${i+1}. ${o.title}  [${o.type}] ${o.cost??""} ${o.language??""}`));
}
console.log("\n=== buscarPorCategoria('MUNs'):");
(await searchByCategory("MUNs")).forEach((o,i)=>console.log(`   ${i+1}. ${o.title} | ${o.inscricoes}`));
console.log("\ntotal:", ((Date.now()-t0)/1000).toFixed(1)+"s");
