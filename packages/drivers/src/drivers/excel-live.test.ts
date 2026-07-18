import { describe, it, expect } from "vitest";
import { readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ExcelDriver } from "./excel.js";
import { outcomeGrid, projectScalarGrid, type DriverTask } from "../format/values.js";

// LIVE Excel D3 process-death recovery — opt-in only. Set BOTH:
//   RUN_LIVE_EXCEL=1        (gate; needs Excel installed + xlwings, `assay setup`)
//   ASSAY_SIMULATE_CRASH=1  (arms the env-gated crash sentinel in excel_driver.py)
//
// A real OOM/hard-crash can't be unit-verified without destroying the run, so the
// driver arms an env-gated sentinel (`=ASSAY_FORCE_CRASH()`) that simulates a
// process death — exercising the SAME relaunch + bisect-attribute control flow a
// real crash takes (design §6.2). Without ASSAY_SIMULATE_CRASH the sentinel is
// inert, so this never fires in CI / normal `vitest run`.
//
// The invariant under test (the D3 fix): a death mid-batch RELAUNCHES a fresh app
// and bisects to attribute the crash to its ONE culprit — the sentinel surfaces
// crashed{process-death}; its siblings re-run on the fresh app and still yield real
// values. The old code reused the dead handle and mislabeled the whole chunk.

const RUN = !!process.env.RUN_LIVE_EXCEL && !!process.env.ASSAY_SIMULATE_CRASH;

describe.skipIf(!RUN)(
  "Excel D3 process-death recovery (LIVE — RUN_LIVE_EXCEL=1 ASSAY_SIMULATE_CRASH=1)",
  () => {
    it("a lone crasher is isolated; its siblings survive on the relaunched app", async () => {
      const tasks: DriverTask[] = [
        { formula: "=1+1" },
        { formula: "=ASSAY_FORCE_CRASH()" },
        { formula: "=2+3" },
      ];
      const d = new ExcelDriver();
      await d.init();
      try {
        const results = await d.evaluateBatch(tasks);
        const scalar = (i: number) => {
          const g = outcomeGrid(results[i].outcome);
          return g ? projectScalarGrid(g)[0]?.[0] : undefined;
        };

        // F1 + F3 survive the crash, recovered on the fresh app (no mislabel cascade).
        expect(results[0].outcome.kind).toBe("value");
        expect(scalar(0)).toBe(2);
        expect(results[2].outcome.kind).toBe("value");
        expect(scalar(2)).toBe(5);

        // The sentinel is the lone attributed crasher.
        expect(results[1].outcome.kind).toBe("crashed");
        if (results[1].outcome.kind === "crashed") {
          expect(results[1].outcome.channel).toBe("process-death");
        }
      } finally {
        await d.destroy();
      }
    }, 180_000);
  },
);

// LIVE Excel packing-placement check (step 1a) — opt-in RUN_LIVE_EXCEL=1. The driver
// now drives formula placement + the read window from the TS packing plan instead of
// the fixed AA1 / 20×20 constants. Step 1a keeps one sheet per task (tiling factor 1),
// so this is a BEHAVIOUR-PRESERVING check: lumps move to A1 (position-insensitive, so
// the value is unchanged), in-place/isolate stay at AA1 with their grid at A1:Z. Known
// answers across every placement class prove the region plumbing is faithful.
describe.skipIf(!process.env.RUN_LIVE_EXCEL)(
  "Excel packing placement is value-faithful (LIVE — RUN_LIVE_EXCEL=1)",
  () => {
    it("lump / in-place / isolate placements all read back the right value", async () => {
      const tasks: DriverTask[] = [
        { formula: "=1+1" }, // lump scalar  → A1
        { formula: "=ABS(-3.4)" }, // lump function → A1
        { formula: "=SEQUENCE(3)" }, // lump array spill (within window) → A1:A3
        { formula: "=SUM(A1:A3)", grid: { A1: 1, A2: 2, A3: 3 } }, // in-place → AA1, grid A1:A3
        { formula: '=INDIRECT("A1")', grid: { A1: 42 } }, // isolate (opaque ref) → AA1, grid A1
      ];
      const d = new ExcelDriver();
      await d.init();
      try {
        const results = await d.evaluateBatch(tasks);
        const scalar = (i: number) => {
          const g = outcomeGrid(results[i].outcome);
          return g ? projectScalarGrid(g)[0]?.[0] : undefined;
        };
        const grid = (i: number) => {
          const g = outcomeGrid(results[i].outcome);
          return g ? projectScalarGrid(g) : undefined;
        };
        // eslint-disable-next-line no-console
        console.log(`  placement outcomes: ${results.map((r) => r.outcome.kind).join(", ")}`);

        expect(scalar(0)).toBe(2);
        expect(scalar(1)).toBe(3.4);
        expect(grid(2)).toEqual([[1], [2], [3]]);
        expect(scalar(3)).toBe(6);
        expect(scalar(4)).toBe(42);
      } finally {
        await d.destroy();
      }
    }, 180_000);
  },
);

// LIVE Excel dense-tiling check (step 1b) — opt-in RUN_LIVE_EXCEL=1. Lump tasks now
// co-tile onto shared sheets (TILE_FACTOR² per host), so the driver builds far fewer
// sheets than tasks (the amortization). A co-tiled lump that overflows its staging
// window #SPILL!s (blocked by a neighbour tile) → the driver re-runs it ISOLATED so it
// spills freely. This verifies all three at once: correctness under tiling, that the
// tiling actually happened (the ASSAY_EXCEL_STATS sidecar: sheets < tasks), and the
// #SPILL!-artifact recovery (the spilly lump comes back as data, not a #SPILL! error).
describe.skipIf(!process.env.RUN_LIVE_EXCEL)(
  "Excel dense tiling amortizes sheets + recovers co-tiled #SPILL! (LIVE — RUN_LIVE_EXCEL=1)",
  () => {
    it("tiles many lumps onto few sheets, recovers a blocked spill, all values faithful", async () => {
      // SEQUENCE(30) first (spills 30 rows down col A) + 7 scalar lumps. The 6th
      // scalar tiles at A21, blocking the spill ⇒ #SPILL! ⇒ isolated re-run.
      const tasks: DriverTask[] = [
        { formula: "=SEQUENCE(30)" },
        ...Array.from({ length: 7 }, (_, k) => ({ formula: `=${k}+1` })),
      ];
      const statsPath = join(tmpdir(), "assay-excel-1b-stats.json");
      rmSync(statsPath, { force: true });
      process.env.ASSAY_EXCEL_STATS = statsPath;

      const d = new ExcelDriver();
      await d.init();
      try {
        const results = await d.evaluateBatch(tasks);
        const grid = (i: number) => {
          const g = outcomeGrid(results[i].outcome);
          return g ? projectScalarGrid(g) : undefined;
        };
        // eslint-disable-next-line no-console
        console.log(`  tiling outcomes: ${results.map((r) => r.outcome.kind).join(", ")}`);

        // The blocked spill recovered to DATA (window-clipped to 20 rows), not #SPILL!.
        expect(results[0].outcome.kind).toBe("value");
        const seq = grid(0)!;
        expect(seq.length).toBe(20);
        expect(seq[0][0]).toBe(1);
        // The 7 co-tiled scalars are all faithful (=k+1 → k+1).
        for (let k = 0; k < 7; k++) {
          expect(grid(1 + k)?.[0]?.[0], `=${k}+1`).toBe(k + 1);
        }

        // The amortization actually happened + the #SPILL! path fired.
        const stats = JSON.parse(readFileSync(statsPath, "utf8")) as {
          tasks: number;
          sheets: number;
          workbooks: number;
          spill_reruns: number;
        };
        // eslint-disable-next-line no-console
        console.log(`  tiling stats: ${JSON.stringify(stats)}`);
        expect(stats.tasks).toBe(8);
        expect(stats.sheets).toBeLessThan(stats.tasks); // tiled onto fewer sheets
        expect(stats.spill_reruns).toBeGreaterThanOrEqual(1); // the blocked spill re-ran
      } finally {
        delete process.env.ASSAY_EXCEL_STATS;
        rmSync(statsPath, { force: true });
        await d.destroy();
      }
    }, 180_000);
  },
);
