import { readFileSync } from "node:fs";
const d = JSON.parse(readFileSync("../../deep-dive-2026-07-11/probes/gsheets-raw-results.json", "utf8"));

function cell(c) {
  if (c == null) return "·";
  const p = c.primitive;
  if (!p) return "?";
  if (p.kind === "error") return p.sentinel ?? p.value ?? p.text ?? "#ERR";
  if (p.kind === "blank" || p.kind === "null") return "(blank)";
  if (p.kind === "boolean") return String(p.value).toUpperCase();
  if (p.kind === "opaque") return "opaque:" + JSON.stringify(p.value ?? p);
  return JSON.stringify(p.value);
}
function gridStr(o) {
  if (!o) return "NULL";
  if (o.kind !== "value") return o.kind.toUpperCase() + " " + JSON.stringify(o).slice(0, 200);
  const g = o.grid;
  if (!Array.isArray(g)) return JSON.stringify(o).slice(0, 200);
  return g.map((row) => "[" + row.map(cell).join(", ") + "]").join(" / ");
}

for (const r of d.results) {
  console.log("### " + r.id);
  console.log("  f: " + r.formula_used + (r.grid ? "  grid=" + JSON.stringify(r.grid) : ""));
  console.log("  H: " + (r.hypothesis || "").replace(/\s+/g, " ").slice(0, 220));
  console.log("  =>: " + gridStr(r.outcome));
  console.log();
}
