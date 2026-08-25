// Materializa os vetores do catálogo num arquivo binário embarcado no bundle.
//
// POR QUÊ: cada invocação de função na Vercel é um processo novo, então o cache
// de 12h do catalog.js quase nunca é reaproveitado — e a consulta dos vetores
// custa 7,25 MB de egress no Supabase (medido em 2026-08-25). 663 cargas
// esgotam os 5 GB do plano; o projeto chegou a 7,27 GB.
//
// Lido do bundle, o mesmo dado custa ZERO egress, e ocupa 2,3 MB em Float32
// contra 7,25 MB do JSON que o PostgREST devolve.
//
// Roda no `npm run build` (e no `npm run embed`), NÃO é commitado: gerar no
// build é o que garante que ele nunca esteja velho — a alternativa, um binário
// no git, depende de alguém lembrar de regerar.
//
// Formato (little-endian):
//   0..3            "ACV1"
//   4..7            uint32  tamanho do cabeçalho
//   8..8+n          JSON { model, dims, count, ids: [...] }
//   resto           Float32 count*dims, na ordem de `ids`
//
// `ids` está no cabeçalho de propósito: o `select` do catálogo não tem
// `order()`, então a ordem das linhas não é garantida e uma matriz puramente
// posicional desalinharia silenciosamente.
import { writeFileSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { supabase } from "./supabase-client.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DESTINO = path.join(__dirname, "..", "server", "assets", "vectors", "core.bin");
const MODELO = process.env.EMBEDDING_MODEL;
const DIMS = Number(process.env.EMBEDDING_DIMENSIONS);

async function main() {
  if (!MODELO || !DIMS) throw new Error("EMBEDDING_MODEL e EMBEDDING_DIMENSIONS são obrigatórios.");

  // Só as oportunidades aprovadas: é o que o catálogo carrega.
  const { data: aprovadas, error: e1 } = await supabase
    .from("opportunities").select("id").eq("status", "Aprovada");
  if (e1) throw new Error(`opportunities: ${e1.message}`);
  const validos = new Set(aprovadas.map((o) => o.id));

  const { data, error } = await supabase
    .from("opportunity_chunks")
    .select("opportunity_id, embedding")
    .eq("field_name", "core");
  if (error) throw new Error(`opportunity_chunks: ${error.message}`);

  const linhas = data
    .filter((c) => validos.has(c.opportunity_id) && c.embedding)
    .map((c) => ({ id: c.opportunity_id, v: typeof c.embedding === "string" ? JSON.parse(c.embedding) : c.embedding }));

  if (!linhas.length) throw new Error("nenhum vetor encontrado — rode `npm run embed` primeiro.");

  const erradas = linhas.filter((l) => l.v.length !== DIMS);
  if (erradas.length) {
    throw new Error(
      `${erradas.length} vetor(es) com dimensão diferente de ${DIMS} (ex.: id ${erradas[0].id} tem ${erradas[0].v.length}). ` +
        "O índice não corresponde ao modelo configurado — rode `npm run embed`."
    );
  }

  const cabecalho = Buffer.from(
    JSON.stringify({ model: MODELO, dims: DIMS, count: linhas.length, ids: linhas.map((l) => l.id) }),
    "utf8"
  );
  const floats = new Float32Array(linhas.length * DIMS);
  linhas.forEach((l, i) => floats.set(l.v, i * DIMS));

  const prefixo = Buffer.alloc(8);
  prefixo.write("ACV1", 0, "ascii");
  prefixo.writeUInt32LE(cabecalho.length, 4);

  mkdirSync(path.dirname(DESTINO), { recursive: true });
  writeFileSync(DESTINO, Buffer.concat([prefixo, cabecalho, Buffer.from(floats.buffer)]));

  const mb = (8 + cabecalho.length + floats.byteLength) / 1024 / 1024;
  console.log(`[vectors] ${linhas.length} vetores de ${DIMS} dims (${MODELO}) → ${mb.toFixed(2)} MB em server/assets/vectors/core.bin`);
}

main().catch((err) => {
  // NÃO derruba o build: sem o arquivo o runtime cai no Supabase, que funciona
  // (só custa egress). Um deploy que falha por causa de otimização é pior que
  // um deploy caro.
  console.error(`[vectors] AVISO: não foi possível materializar os vetores — o runtime vai ler do Supabase e gastar egress.\n          ${err.message}`);
  process.exit(0);
});
