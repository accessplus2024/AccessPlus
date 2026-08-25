// Teste de fumaça do chat novo, exercitando os módulos de produção
// diretamente (sem subir o Nitro): roteador -> handler de cada intenção.
// Serve para pegar erro de import, campo com nome errado e resposta vazia
// antes de qualquer deploy.
import dotenv from "dotenv";
dotenv.config({ path: new URL("../.env", import.meta.url).pathname, quiet: true });

const { getCatalog } = await import("../server/utils/rag/catalog.js");
const { route, INTENTS } = await import("../server/utils/rag/router.js");
const { searchByCategory, search } = await import("../server/utils/rag/search.js");
const { answerAboutOpportunity } = await import("../server/utils/rag/factSheet.js");
const { nextStep, accumulate, collectedToText } = await import("../server/utils/rag/conversation.js");

const cat = await getCatalog();
console.log(`catálogo carregado: ${cat.corpus.length} oportunidades, ${cat.index.postings.size} termos no índice\n`);

const perfil = { age: 16, nivel: "Ensino Médio", areas: ["Humanas"], condicao_financeira: "precisa_gratuito", linguas: ["Português"] };

const mensagens = [
  "o que é MUN?",
  "quais MUNs vocês têm?",
  "me fala da OBMEP",
  "qual o prazo da OBA?",
  "ainda não sei o que quero fazer, me ajuda",
  "o que é o accessplus",
  "o que são mentorias",
  "gosto de escrever e de debater política, estudo em escola pública",
];

for (const m of mensagens) {
  const rota = route(m, cat.corpus, { historico: [], perfil });
  process.stdout.write(`\n>>> "${m}"\n    intenção: ${rota.intencao}`);

  if (rota.intencao === INTENTS.CONCEITO) {
    const ex = rota.conceito.tipoCatalogo ? await searchByCategory(rota.conceito.tipoCatalogo, "", { topK: 3 }) : [];
    console.log(`\n    texto: ${rota.conceito.texto.slice(0, 130)}...`);
    console.log(`    exemplos reais do catálogo: ${ex.map((o) => o.title).join(" | ") || "(nenhum — conceito sem categoria)"}`);
  } else if (rota.intencao === INTENTS.CATEGORIA) {
    const itens = await searchByCategory(rota.tipo, m, { topK: 5 });
    console.log(`\n    tipo: ${rota.tipo} — ${itens.length} itens`);
    itens.forEach((o) => console.log(`      - ${o.title} (${o.inscricoes})`));
  } else if (rota.intencao === INTENTS.OPORTUNIDADE) {
    const { ficha, texto, degraded } = await answerAboutOpportunity(m, rota.oportunidade);
    console.log(`\n    oportunidade: ${ficha.titulo}`);
    console.log(`    prazo: ${ficha.prazo ?? "(não registrado)"} | custo: ${ficha.custo} | inscrições: ${ficha.inscricoes}`);
    console.log(`    faltando no banco: ${ficha.faltando.join(", ") || "nada"}`);
    console.log(`    resposta${degraded ? " (degradada, sem LLM)" : ""}: ${texto.slice(0, 220)}`);
  } else if (rota.intencao === INTENTS.EXPLORACAO) {
    const passo = nextStep({});
    console.log(`\n    passo: ${passo.passo}`);
    console.log(`    pergunta: ${passo.texto.slice(0, 150)}...`);
    console.log(`    opções: ${passo.opcoes.length}`);
    // simula o funil completo
    let col = accumulate({}, "areas", [["Linguagens", "Política"]]);
    col = accumulate(col, "tipos", [["Competições", "MUNs"]]);
    col = accumulate(col, "barreiras", [{ precisaGratuito: true }, { inglesFraco: true }]);
    console.log(`    após 3 respostas -> ${nextStep(col).passo}`);
    console.log(`    texto gerado pro retrieval: "${collectedToText(col, perfil)}"`);
    const r = await search({ texto: collectedToText(col, perfil), areas: perfil.areas, nivel: perfil.nivel, condicaoFinanceira: perfil.condicao_financeira, linguas: perfil.linguas }, { topK: 5 });
    r.results.forEach((o, i) => console.log(`      ${i + 1}. ${o.title} [${o.type}]`));
  } else if (rota.intencao === INTENTS.RECOMENDACAO) {
    const r = await search({ texto: m, areas: perfil.areas, nivel: perfil.nivel, condicaoFinanceira: perfil.condicao_financeira, linguas: perfil.linguas }, { topK: 5 });
    console.log(`\n    análise: ${JSON.stringify(r.analysis)}`);
    r.results.forEach((o, i) => console.log(`      ${i + 1}. ${o.title} [${o.type}] ${o.cost ?? ""}`));
  } else {
    console.log("");
  }
}
console.log("\nteste de fumaça concluído sem erro.");
