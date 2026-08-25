import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, existsSync } from "fs";
dotenv.config({ path: new URL("../.env", import.meta.url).pathname, quiet: true });

const CACHE = new URL("./cache/corpus.json", import.meta.url).pathname;

export const db = createClient(process.env.DEV_SUPABASE_URL, process.env.DEV_SUPABASE_SERVICE_ROLE_KEY);

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
