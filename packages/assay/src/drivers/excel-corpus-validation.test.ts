import { describe, it, expect } from "vitest";
import { readFileSync, rmSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { loadTestSuite, resolveFormulaForPlatform, gridsEqual } from "../format/index.js";
import { analyzeFormula } from "@cartularium/drivers";
import { ExcelDriver } from "@cartularium/drivers";
import { outcomeGrid, projectScalarGrid, type DriverTask, type Outcome } from "../format/values.js";

function showGrid(o: Outcome): string {
  const g = outcomeGrid(o);
  return g ? JSON.stringify(projectScalarGrid(g)) : o.kind;
}

// LIVE Excel real-corpus tiling validation — opt-in RUN_LIVE_EXCEL_CORPUS=1. Runs a
// sample of the ACTUAL corpus through the Excel driver TWICE — dense-tiled
// (ASSAY_TILE_FACTOR=5) vs untiled (=1, one task per sheet) — and asserts every result
// is IDENTICAL. This isolates the tiling effect from everything else (stale fixtures,
// engine drift): same code, same Excel, only the packing differs, so any diff is a
// tiling regression. Reports the sheet-count reduction (the amortization). Volatile
// formulas (NOW/RAND/…) are excluded — they differ run-to-run by nature. READ-ONLY.
// Override the sample with ASSAY_CORPUS_SUITES=a,b,c.

const RUN = !!process.env.RUN_LIVE_EXCEL_CORPUS;
const TESTS_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "tests");
const DEFAULT_SUITES = [
  "arithmetic", "math", "math-longtail", "statistical-analytics", "statistical-descriptive",
  "statistical", "statistical-distributions", "engineering", "text", "text-longtail", "logical",
  "arrays", "array-longtail", "spill", "spill-edge", "lookup", "lookup-longtail", "lambda",
  "type-coercion", "operator", "broadcasting", "date", "info", "financial-securities",
  "financial-timevalue", "regex", "parser", "error-handling", "divergences",
];
const SUITES =
  process.env.ASSAY_CORPUS_SUITES?.split(",").map((s) => s.trim()).filter(Boolean) ?? DEFAULT_SUITES;

function outcomesMatch(a: Outcome, b: Outcome): boolean {
  if (a.kind === "value" && b.kind === "value") return gridsEqual(a.grid, b.grid);
  return a.kind === b.kind;
}

async function runAt(factor: number, tasks: DriverTask[]): Promise<{ results: { outcome: Outcome }[]; stats: Record<string, number> | null }> {
  const statsPath = join(tmpdir(), `assay-excel-corpus-${factor}.json`);
  rmSync(statsPath, { force: true });
  process.env.ASSAY_TILE_FACTOR = String(factor);
  process.env.ASSAY_EXCEL_STATS = statsPath;
  const d = new ExcelDriver();
  await d.init();
  try {
    const results = await d.evaluateBatch(tasks);
    const stats = existsSync(statsPath)
      ? (JSON.parse(readFileSync(statsPath, "utf8")) as Record<string, number>)
      : null;
    return { results, stats };
  } finally {
    delete process.env.ASSAY_TILE_FACTOR;
    delete process.env.ASSAY_EXCEL_STATS;
    rmSync(statsPath, { force: true });
    await d.destroy();
  }
}

describe.skipIf(!RUN)("Excel tiled == untiled across the real corpus (LIVE — RUN_LIVE_EXCEL_CORPUS=1)", () => {
  it("dense tiling produces identical results to one-per-sheet, on far fewer sheets", async () => {
    const tasks: DriverTask[] = [];
    const labels: string[] = [];
    let volatileSkipped = 0;
    let skipTagged = 0;

    for (const suite of SUITES) {
      const file = join(TESTS_DIR, `${suite}.yaml`);
      if (!existsSync(file)) continue;
      for (const t of loadTestSuite(file).tests) {
        const r = resolveFormulaForPlatform(t, "excel");
        if (r === null) continue;
        if (r.skip) {
          skipTagged++;
          continue;
        }
        if (analyzeFormula(r.formula).volatile) {
          volatileSkipped++;
          continue; // NOW/RAND/… differ run-to-run, can't compare
        }
        tasks.push({ formula: r.formula, grid: t.grid });
        labels.push(`${suite}/${t.id}`);
      }
    }

    expect(tasks.length, "no comparable corpus tasks found").toBeGreaterThan(0);

    const tiled = await runAt(5, tasks);
    const untiled = await runAt(1, tasks);

    const diffs: string[] = [];
    for (let i = 0; i < tasks.length; i++) {
      if (!outcomesMatch(tiled.results[i].outcome, untiled.results[i].outcome)) {
        diffs.push(
          `${labels[i]}: tiled=${showGrid(tiled.results[i].outcome)} vs untiled=${showGrid(untiled.results[i].outcome)}`,
        );
      }
    }

    const t = tiled.stats;
    const u = untiled.stats;
    // eslint-disable-next-line no-console
    console.log(
      `\n  corpus tiled==untiled: ${tasks.length} compared, ${tasks.length - diffs.length} identical, ` +
        `${diffs.length} differ (${skipTagged} skip-tagged, ${volatileSkipped} volatile excluded)`,
    );
    if (t && u) {
      // eslint-disable-next-line no-console
      console.log(
        `  amortization: tiled ${t.tasks} tasks → ${t.sheets} sheets / ${t.workbooks} wb ` +
          `(${t.spill_reruns} #SPILL! re-runs); untiled → ${u.sheets} sheets / ${u.workbooks} wb. ` +
          `${(u.sheets / Math.max(t.sheets, 1)).toFixed(1)}× fewer sheets.`,
      );
    }
    if (diffs.length > 0) {
      // eslint-disable-next-line no-console
      console.log(`  DIFFS:\n    ${diffs.slice(0, 40).join("\n    ")}`);
    }

    expect(diffs, diffs.slice(0, 20).join(" | ")).toEqual([]);
  }, 1_800_000);
});
