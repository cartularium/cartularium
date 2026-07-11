import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createDriver } from "@cartularium/drivers";

const REQ_PATH =
  "/Users/jaegun/personal/cartularium/.claude/worktrees/wiki-deep-dive/deep-dive-2026-07-11/probes/_excel-requests.json";
const OUT_PATH =
  "/Users/jaegun/personal/cartularium/.claude/worktrees/wiki-deep-dive/deep-dive-2026-07-11/probes/_excel-raw.json";

type Req = {
  id: string;
  formula?: string;
  formula_excel?: string;
  grid?: Record<string, unknown>;
  _batch: string;
};

const reqs: Req[] = JSON.parse(readFileSync(REQ_PATH, "utf8"));

// chunk range from argv (start end), defaults to whole set
const start = process.argv[2] ? Number(process.argv[2]) : 0;
const end = process.argv[3] ? Number(process.argv[3]) : reqs.length;
const slice = reqs.slice(start, end);

const tasks = slice.map((r) => {
  const formula = r.formula_excel ?? r.formula!;
  return r.grid ? { formula, grid: r.grid as any } : { formula };
});

console.error(`[lane-excel] running ${slice.length} tasks (idx ${start}..${end})`);
for (const [i, t] of tasks.entries())
  console.error(`  ${slice[i].id}: ${t.formula}`);

const d = createDriver("excel", { verbose: false, workbookPath: null } as any);
await d.init();
const results = await d.evaluateBatch(tasks as any);
await (d as any).dispose?.();

// merge with any existing partial output
let acc: any[] = [];
if (existsSync(OUT_PATH)) acc = JSON.parse(readFileSync(OUT_PATH, "utf8"));
const byId = new Map(acc.map((e) => [e.id, e]));
slice.forEach((r, i) => {
  byId.set(r.id, {
    id: r.id,
    batch: r._batch,
    formula_used: tasks[i].formula,
    grid: r.grid ?? null,
    result: results[i],
  });
});
const merged = reqs
  .filter((r) => byId.has(r.id))
  .map((r) => byId.get(r.id));
writeFileSync(OUT_PATH, JSON.stringify(merged, null, 1));
console.error(`[lane-excel] wrote ${merged.length} results to ${OUT_PATH}`);
