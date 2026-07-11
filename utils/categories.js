// Access+ — category identity map.
// Maps the Stein sheet `type` value → brand category (color + icon + label).
// Each category owns one brand color, color-blocked across the UI.

export const CATEGORY_BY_TYPE = {
  olimpiada:   { key: "olympiads",         label: "Olimpíadas Científicas",   color: "#4B3FE4", ink: "#FFFFFF" },
  bolsa:       { key: "scholarship",       label: "Bolsas de Estudo",         color: "#C8F135", ink: "#15111F" },
  mun:         { key: "mun",               label: "MUNs",                     color: "#FF2D8A", ink: "#FFFFFF" },
  mentoria:    { key: "mentorship",        label: "Mentorias",                color: "#7DECE9", ink: "#15111F" },
  academico:   { key: "academic_programs", label: "Programas Acadêmicos",     color: "#A459D1", ink: "#FFFFFF" },
  competicao:  { key: "competitions",      label: "Competições",              color: "#FF4422", ink: "#FFFFFF" },
  intercambio: { key: "exchanges",         label: "Intercâmbios",             color: "#15B8A6", ink: "#FFFFFF" },
  escrita:     { key: "writing_comp",      label: "Competições de Escrita",   color: "#FF8A3D", ink: "#15111F" },
};

const FALLBACK = { key: "academic_programs", label: "Oportunidade", color: "#A459D1", ink: "#FFFFFF" };

// All categories, in display order, for the home grid + catalog chips.
export const CATEGORIES = [
  "olimpiada", "bolsa", "mun", "mentoria",
  "academico", "competicao", "intercambio", "escrita",
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
