import { db } from "./db.mjs";

const { data } = await db.from("opportunities").select("id,title,searchable_text,fts,metadata,type,format,inscricoes,level,areas,cost,language,location").eq("status","Aprovada").limit(3);
for (const r of data) {
  console.log("=====", r.id, r.title);
  console.log("searchable_text:", JSON.stringify(r.searchable_text).slice(0,900));
  console.log("fts:", JSON.stringify(r.fts).slice(0,300));
  console.log("metadata:", JSON.stringify(r.metadata).slice(0,400));
  console.log("type/format/inscricoes:", r.type, "|", r.format, "|", r.inscricoes);
}
// distintos
const { data: all } = await db.from("opportunities").select("type,format,cost,level,areas,language,location,inscricoes").eq("status","Aprovada");
const uniq = (k) => [...new Set(all.flatMap(r => Array.isArray(r[k]) ? r[k] : [r[k]]))].filter(x=>x!==null);
for (const k of ["type","format","cost","level","areas","language","location","inscricoes"]) {
  console.log(k, "→", JSON.stringify(uniq(k)).slice(0,600));
}
