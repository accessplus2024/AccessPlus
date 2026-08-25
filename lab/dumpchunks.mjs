import { db, loadCorpus } from "./corpus.mjs";
import { writeFileSync } from "fs";
const corpus = await loadCorpus();
const ids = new Set(corpus.map((o) => o.id));
let todos = [];
for (let from = 0; ; from += 200) {
  const { data, error } = await db.from("opportunity_chunks").select("opportunity_id, field_name, embedding").range(from, from + 199);
  if (error) throw new Error(error.message);
  if (!data.length) break;
  todos = todos.concat(data.filter((r) => ids.has(r.opportunity_id)));
  if (data.length < 200) break;
}
const parse = (e) => (typeof e === "string" ? JSON.parse(e) : e);
const out = todos.map((r) => ({ id: r.opportunity_id, field: r.field_name, v: parse(r.embedding) }));
writeFileSync(new URL("./cache/chunks-db.json", import.meta.url).pathname, JSON.stringify(out));
console.log("chunks salvos:", out.length, "| dim", out[0].v.length);
