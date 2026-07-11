import { readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import { createDriver } from "@cartularium/drivers";
import { getAccessToken } from "../src/auth.js";

const BATCHES = "../../deep-dive-2026-07-11/batches";
const OUT_DIR = "../../deep-dive-2026-07-11/probes";

type Req = {
  id: string;
  engines: string[];
  formula: string;
  formula_gsheets?: string;
  grid?: Record<string, unknown>;
  hypothesis?: string;
  note?: string;
};

// 1. gather gsheets-targeted requests
const reqs: Req[] = [];
for (const b of readdirSync(BATCHES)) {
  const p = `${BATCHES}/${b}/probe-requests.json`;
  if (!existsSync(p)) continue;
  const arr = JSON.parse(readFileSync(p, "utf8")) as Req[];
  for (const r of arr) if ((r.engines || []).includes("gsheets")) reqs.push(r);
}
console.error(`gsheets requests: ${reqs.length}`);

// 2. build tasks (formula_gsheets ?? formula; grid passthrough)
const tasks = reqs.map((r) => {
  const formula = r.formula_gsheets ?? r.formula;
  const task: { formula: string; grid?: Record<string, unknown> } = { formula };
  if (r.grid) task.grid = r.grid;
  return task;
});

// 3. auth + construction
const token = await getAccessToken();
if (!token) throw new Error("no access token");
const res = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ properties: { title: "assay-deep-dive-2026-07-11" } }),
});
const created = (await res.json()) as { spreadsheetId?: string; error?: unknown };
if (!created.spreadsheetId) throw new Error("create failed: " + JSON.stringify(created));
const spreadsheetId = created.spreadsheetId;
console.error(`scratch spreadsheet: ${spreadsheetId}`);

const d = createDriver("gsheets", { spreadsheetId, accessToken: token });
await d.init();

const results = await d.evaluateBatch(tasks as any);

// 4. write results paired with requests (verdict left null — filled in analysis)
const paired = reqs.map((r, i) => ({
  id: r.id,
  formula_used: tasks[i].formula,
  grid: r.grid ?? null,
  hypothesis: r.hypothesis ?? null,
  note: r.note ?? null,
  outcome: results[i]?.outcome ?? null,
}));
writeFileSync(`${OUT_DIR}/gsheets-raw-results.json`, JSON.stringify({ spreadsheetId, results: paired }, null, 2));
console.error(`wrote ${paired.length} results to gsheets-raw-results.json`);
console.error(`SCRATCH_SPREADSHEET_ID=${spreadsheetId}`);
