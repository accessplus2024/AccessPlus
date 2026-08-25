import dotenv from "dotenv";
dotenv.config({ path: "/home/claude/accessia/.env" });
import { createClient } from "@supabase/supabase-js";
const db = createClient(process.env.DEV_SUPABASE_URL, process.env.DEV_SUPABASE_SERVICE_ROLE_KEY);

const { count: total } = await db.from("opportunities").select("*", { count: "exact", head: true });
const { count: aprov } = await db.from("opportunities").select("*", { count: "exact", head: true }).eq("status","Aprovada");
const { count: chunks } = await db.from("opportunity_chunks").select("*", { count: "exact", head: true });
console.log({ total, aprov, chunks });

const { data: fields } = await db.from("opportunity_chunks").select("field_name");
const byField = {};
for (const r of fields) byField[r.field_name] = (byField[r.field_name]||0)+1;
console.log("chunks por field:", byField);

const { data: sample } = await db.from("opportunities").select("*").eq("status","Aprovada").limit(2);
console.log("colunas:", Object.keys(sample[0]));
console.log(JSON.stringify(sample[0], null, 1).slice(0, 2500));

// preenchimento de campos
const cols = Object.keys(sample[0]);
const { data: all } = await db.from("opportunities").select("*").eq("status","Aprovada");
const fill = {};
for (const c of cols) {
  const n = all.filter(r => r[c] !== null && r[c] !== "" && !(Array.isArray(r[c]) && r[c].length===0)).length;
  fill[c] = `${n}/${all.length}`;
}
console.log("preenchimento:", fill);
