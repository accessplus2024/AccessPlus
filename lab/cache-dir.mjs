// Garante que lab/cache/ e lab/out/ existam antes de qualquer escrita.
//
// `lab/cache/` está no .gitignore (é cache, não código), então ela NUNCA vem
// num clone novo — e todo escritor de cache aqui estourava ENOENT na primeira
// execução. Importar este módulo resolve para todos de uma vez.
import { mkdirSync } from "fs";

export function garantirPasta(url) {
  const p = new URL(url, import.meta.url).pathname;
  mkdirSync(p, { recursive: true });
  return p;
}

garantirPasta("./cache/");
garantirPasta("./out/");
