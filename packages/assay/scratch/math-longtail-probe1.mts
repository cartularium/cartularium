import { createDriver } from "@cartularium/drivers";
import fs from "fs";

const wl = JSON.parse(fs.readFileSync("scratch/worklist/math-longtail.json", "utf8"));

// COUNTIFS grids from tests/math-longtail.yaml
const grids: Record<string, Record<string, any>> = {
  "COUNTIFS/countifs-single-criterion": { A1: 1, A2: 2, A3: 3, A4: 4 },
  "COUNTIFS/countifs-two-criteria": { A1: 1, A2: 2, A3: 3, A4: 4, B1: "x", B2: "y", B3: "x", B4: "x" },
  "COUNTIFS/countifs-exact-match": { A1: 5, A2: 5, A3: 6 },
  "COUNTIFS/countifs-no-match": { A1: 1, A2: 2 },
};

const tasks = wl.map((it: any) => {
  const t: any = { formula: it.formula };
  if (grids[it.ref]) t.grid = grids[it.ref];
  return t;
});

function fmt(r: any): string {
  const o = r?.outcome ?? r;
  // dig into structured outcome
  const kind = o?.kind;
  if (kind === "value" || o?.result || Array.isArray(o)) {
    const grid = o?.result ?? o?.value ?? o;
    try {
      const cell = grid[0][0];
      if (cell === null) return "BLANK";
      if (typeof cell === "object") return JSON.stringify(cell);
      return String(cell);
    } catch { return JSON.stringify(grid); }
  }
  return JSON.stringify(o);
}

const engines = ["pycel", "hyperformula", "ironcalc", "formulas"] as const;
const out: Record<string, string[]> = {};

for (const eng of engines) {
  const d = createDriver(eng as any);
  await d.init();
  const results = await d.evaluateBatch(tasks);
  out[eng] = results.map(fmt);
  if (d.dispose) await d.dispose();
}

// print aligned
const lines: string[] = [];
lines.push("ref\tformula\tpycel\thyperformula\tironcalc\tformulas");
wl.forEach((it: any, i: number) => {
  lines.push(`${it.ref}\t${it.formula}\t${out.pycel[i]}\t${out.hyperformula[i]}\t${out.ironcalc[i]}\t${out.formulas[i]}`);
});
fs.writeFileSync("scratch/math-longtail-liveresults.tsv", lines.join("\n"));
console.log(lines.join("\n"));
