// shared engine-comparison presets — same set on /compare and /history so
// muscle memory carries between pages and a future tweak hits both at once

export interface ComparePreset {
  target: string;
  ref: string[];
  label: string;
}

export const COMPARE_PRESETS: ComparePreset[] = [
  { target: "excel", ref: ["gsheets"], label: "excel vs gsheets" },
  { target: "hyperformula", ref: ["excel", "gsheets"], label: "hyperformula vs excel + gsheets" },
  { target: "ironcalc", ref: ["excel", "gsheets"], label: "ironcalc vs excel + gsheets" },
  { target: "libreoffice", ref: ["excel", "gsheets"], label: "libreoffice vs excel + gsheets" },
  { target: "lattice", ref: ["excel", "gsheets"], label: "lattice vs excel + gsheets" },
];
