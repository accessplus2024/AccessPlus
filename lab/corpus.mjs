import { readFileSync, writeFileSync, existsSync } from "fs";
import { db } from "./db.mjs";
import "./cache-dir.mjs";

const CACHE = new URL("./cache/corpus.json", import.meta.url).pathname;

// `db` vem de db.mjs; reexportado para quem já importava daqui.
export { db };

export async function loadCorpus({ refresh = false } = {}) {
  if (!refresh && existsSync(CACHE)) return JSON.parse(readFileSync(CACHE, "utf8"));
  const { data, error } = await db.from("opportunities").select("*").eq("status", "Aprovada");
  if (error) throw new Error(error.message);
  const slim = data.map((o) => ({
    id: o.id, title: o.title, description: o.description, eligibility: o.eligibility,
    process: o.process, applicants: o.applicants, additionals: o.additionals,
    type: o.type, areas: o.areas, keywords: o.keywords, level: o.level, audience: o.audience,
    cost: o.cost, language: o.language, location: o.location, format: o.format,
    inscricoes: o.inscricoes, deadline: o.deadline, link: o.link, resources: o.resources, metadata: o.metadata,
  }));
  writeFileSync(CACHE, JSON.stringify(slim));
  return slim;
}
