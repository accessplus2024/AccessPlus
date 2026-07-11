// Access+ — category identity map.
// Maps the Supabase `type` value → brand category (color + icon + label).
// Each category owns one brand color, color-blocked across the UI.

export const CATEGORY_BY_TYPE = {
  "Olimpíadas Científicas":     { key: "olympiads",         label: "Olimpíadas Científicas",   color: "#4B3FE4", ink: "#FFFFFF" },
  "Bolsas de Estudo":           { key: "scholarship",       label: "Bolsas de Estudo",         color: "#C8F135", ink: "#15111F" },
  "MUNs":                       { key: "mun",               label: "MUNs",                     color: "#FF2D8A", ink: "#FFFFFF" },
  "Mentorias":                  { key: "mentorship",        label: "Mentorias",                color: "#7DECE9", ink: "#15111F" },
  "Programas Acadêmicos":       { key: "academic_programs", label: "Programas Acadêmicos",     color: "#A459D1", ink: "#FFFFFF" },
  "Competições":                { key: "competitions",      label: "Competições",              color: "#FF4422", ink: "#FFFFFF" },
  "Programas de Intercâmbio":   { key: "exchanges",         label: "Intercâmbios",             color: "#15B8A6", ink: "#FFFFFF" },
  "Competições de Escrita":     { key: "writing_comp",      label: "Competições de Escrita",   color: "#FF8A3D", ink: "#15111F" },
  "Estágios":                   { key: "internships",       label: "Estágios",                 color: "#2E86FF", ink: "#FFFFFF" },
};

const FALLBACK = { key: "academic_programs", label: "Oportunidade", color: "#A459D1", ink: "#FFFFFF" };

// All categories, in display order, for the home grid + catalog chips.
export const CATEGORIES = [
  "Olimpíadas Científicas", "Bolsas de Estudo", "MUNs", "Mentorias",
  "Programas Acadêmicos", "Competições", "Programas de Intercâmbio",
  "Competições de Escrita", "Estágios",
].map((type) => ({ type, ...CATEGORY_BY_TYPE[type] }));

export function categoryFor(type) {
  return CATEGORY_BY_TYPE[type] || FALLBACK;
}

const ICON_MAP = {
  olympiads:         "1",
  scholarship:       "2",
  mun:               "3",
  mentorship:        "4",
  academic_programs: "5",
  competitions:      "6",
  exchanges:         "7",
  writing_comp:      "7",
  internships:       "4",
}

export function categoryIcon(key) {
  const n = ICON_MAP[key] || "1"
  return `/images/icons/${n}a.svg`
}

export function categoryIconHover(key) {
  const n = ICON_MAP[key] || "1"
  return `/images/icons/${n}b.svg`
}

export function isLightColor(color) {
  return color === "#C8F135" || color === "#7DECE9" || color === "#FF8A3D";
}
