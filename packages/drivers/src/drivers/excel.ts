import { execSync } from "node:child_process";
import { writeFileSync, readFileSync, mkdtempSync, rmSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import {
  legacyToOutcome,
  type CellValue,
  type DriverTask,
  type DriverTaskResult,
  type RichGridValue,
} from "../format/values.js";
import type { Driver, CapabilityDescriptor } from "./driver.js";
import { capabilityDescriptorFor } from "../format/capability-data.js";
import { probePythonVersion } from "./python-helpers.js";
import { planPacking, type PlacedTask } from "./contract/packing.js";
import { DEFAULT_LAYOUT } from "./contract/layout.js";

// Dense-tiling factor: lump tasks tile into a host of TILE_FACTOR × TILE_FACTOR
// staging windows (TILE_FACTOR² lumps per host). 5 ⇒ 25 lumps/host. Conservative:
// most lumps are scalars (cheap), and a lump that overflows its staging window trips
// #SPILL! → the driver re-runs it isolated, so the only cost of being wrong is a
// re-run, never a corrupt result. Excel's per-sheet memory is the cap (the OOM
// machinery); 25 mostly-scalar formulas/sheet is well under it. Env-overridable
// (ASSAY_TILE_FACTOR) for tuning + the tiled-vs-untiled cross-check (=1 ⇒ no tiling).
// Read per-call so the override is responsive within a process.
function tileFactor(): number {
  return Math.max(1, Number(process.env.ASSAY_TILE_FACTOR) || 5);
}

/** The placement plan, serialized per-task into the Python tasks JSON. Single-sourced
 * in TS (packing.ts) so the geometry + spill-reach invariant has one owner; Python is
 * a dumb executor. host = the co-hosting sheet; (top,left) = the formula cell; rows×cols
 * = the staging window read back. lump tasks densely tile into shared hosts; in-place/
 * isolate get a host each (charter §8). Python bounds sheets-per-workbook + re-runs any
 * co-tiled lump that #SPILL!s. */
function placementPlan(tasks: DriverTask[]): Map<number, PlacedTask> {
  const liveIndices: number[] = [];
  const liveFormulas: string[] = [];
  const liveHasInput: boolean[] = [];
  tasks.forEach((t, i) => {
    if (!t.skip) {
      liveIndices.push(i);
      liveFormulas.push(t.formula);
      // A task carrying grid seeds can't be co-tiled — its seeds would collide with
      // co-tenants on a shared host (the spill-block bleed). Force its own host.
      liveHasInput.push(!!t.grid && Object.keys(t.grid).length > 0);
    }
  });
  const factor = tileFactor();
  const plan = planPacking(liveFormulas, {
    hostRows: DEFAULT_LAYOUT.stagingRows * factor,
    hostCols: DEFAULT_LAYOUT.stagingCols * factor,
    hasInput: liveHasInput,
  });
  const byOrigIndex = new Map<number, PlacedTask>();
  plan.tasks.forEach((pt) => byOrigIndex.set(liveIndices[pt.taskIndex], pt));
  return byOrigIndex;
}

// excel driver using xlwings via python
// requires: excel installed locally, uv with xlwings (`assay setup`)
// batch mode: queues all evals, one subprocess call, excel opens once

const PROJECT_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const PYTHON_SCRIPT = join(PROJECT_ROOT, "python", "excel_driver.py");
const EXCEL_LOCK_PATH = join(tmpdir(), "assay-excel.lock");
const EXCEL_LOCK_STALE_MS = 15 * 60 * 1000;

function lockSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function staleLock(contents: string): boolean {
  try {
    const lock = JSON.parse(contents) as { pid?: number; timestamp?: string };
    const timestamp = typeof lock.timestamp === "string" ? Date.parse(lock.timestamp) : NaN;
    if (Number.isFinite(timestamp) && Date.now() - timestamp > EXCEL_LOCK_STALE_MS) return true;
    const pid = lock.pid;
    if (typeof pid !== "number" || !Number.isInteger(pid) || pid <= 0) return false;
    try {
      process.kill(pid, 0);
      return false;
    } catch (error) {
      return (error as NodeJS.ErrnoException).code === "ESRCH";
    }
  } catch {
    return false;
  }
}

/** xlwings drives a single live Excel instance; concurrent runs corrupt each other. */
export async function withExcelLock<T>(fn: () => T | Promise<T>): Promise<T> {
  let contents: string;
  for (;;) {
    const candidate = JSON.stringify({ pid: process.pid, timestamp: new Date().toISOString() });
    try {
      writeFileSync(EXCEL_LOCK_PATH, candidate, { flag: "wx" });
      contents = candidate;
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      try {
        const existing = readFileSync(EXCEL_LOCK_PATH, "utf8");
        if (staleLock(existing) && readFileSync(EXCEL_LOCK_PATH, "utf8") === existing) {
          unlinkSync(EXCEL_LOCK_PATH);
          continue;
        }
      } catch (readError) {
        if ((readError as NodeJS.ErrnoException).code === "ENOENT") continue;
        throw readError;
      }
      await lockSleep(250 + Math.floor(Math.random() * 250));
    }
  }

  try {
    return await fn();
  } finally {
    try {
      if (readFileSync(EXCEL_LOCK_PATH, "utf8") === contents) unlinkSync(EXCEL_LOCK_PATH);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
}

export class ExcelDriver implements Driver {
  readonly platform = "excel" as const;
  private tmpDir: string | null = null;
  private verbose: boolean;
  private workbookPath: string | null;

  constructor(verbose = false, workbookPath: string | null = null) {
    this.verbose = verbose;
    this.workbookPath = workbookPath;
  }

  private get env(): Record<string, string | undefined> {
    return this.verbose ? { ...process.env, ASSAY_VERBOSE: "1" } : process.env;
  }

  private get stderr(): "pipe" | "inherit" {
    return this.verbose ? "inherit" : "pipe";
  }

  private get workbookFlag(): string {
    return this.workbookPath ? `--workbook "${this.workbookPath}" ` : "";
  }

  async init(): Promise<void> {
    await withExcelLock(() => {
      try {
        execSync("uv run python -c 'import xlwings'", {
          cwd: PROJECT_ROOT,
          stdio: "pipe",
        });
      } catch {
        throw new Error("xlwings not available. Run: assay setup");
      }
    });
    this.tmpDir = mkdtempSync(join(tmpdir(), "assay-excel-"));
  }

  async evaluate(formula: string, grid?: Record<string, CellValue>): Promise<RichGridValue> {
    if (!this.tmpDir) throw new Error("Driver not initialized");

    const taskFile = join(this.tmpDir, "task.json");
    const resultFile = join(this.tmpDir, "result.json");

    writeFileSync(taskFile, JSON.stringify({ formula, grid: grid || {} }));

    await withExcelLock(() => {
      try {
        execSync(
          `uv run python "${PYTHON_SCRIPT}" ${this.workbookFlag}"${taskFile}" "${resultFile}"`,
          {
            cwd: PROJECT_ROOT,
            stdio: ["pipe", "pipe", this.stderr],
            env: this.env,
            timeout: 30000,
          },
        );
      } catch (e: unknown) {
        const err = e as { stderr?: Buffer };
        const msg = err.stderr?.toString() || String(e);
        throw new Error(`Excel evaluation failed: ${msg}`);
      }
    });

    const raw = JSON.parse(readFileSync(resultFile, "utf8"));
    if (raw.error) throw new Error(`Excel error: ${raw.error}`);
    // Python now emits rich JSON matching RichCellValue contract directly
    // (post-coalescing task 5). No lift needed at the boundary.
    return raw.result as RichGridValue;
  }

  async evaluateBatch(tasks: DriverTask[]): Promise<DriverTaskResult[]> {
    if (!this.tmpDir) throw new Error("Driver not initialized");

    const tasksFile = join(this.tmpDir, "tasks.json");
    const resultsFile = join(this.tmpDir, "results.json");

    const placement = placementPlan(tasks);
    writeFileSync(
      tasksFile,
      JSON.stringify(
        tasks.map((t, i) => {
          const pt = placement.get(i);
          return {
            formula: t.formula,
            grid: t.grid || {},
            ...(t.skip ? { skip: t.skip } : {}),
            ...(pt
              ? {
                  placement: {
                    host: pt.host,
                    top: pt.region.top,
                    left: pt.region.left,
                    rows: pt.region.rows,
                    cols: pt.region.cols,
                  },
                }
              : {}),
          };
        }),
      ),
    );

    const timedOut = await withExcelLock(() => {
      try {
        execSync(
          `uv run python "${PYTHON_SCRIPT}" ${this.workbookFlag}--batch "${tasksFile}" "${resultsFile}"`,
          {
            cwd: PROJECT_ROOT,
            stdio: ["pipe", "pipe", this.stderr],
            env: this.env,
            timeout: 600000,
          },
        );
        return false;
      } catch (e: unknown) {
        const err = e as { stderr?: Buffer; signal?: string; code?: string };
        // A subprocess timeout (execSync sends killSignal on the 600s ceiling) is a
        // HANG — engine-attributable as crashed{timeout}, NOT a driver failure (D3
        // §6.2). We can't pin the hang on one formula without re-running, so the whole
        // batch is marked crashed rather than thrown away (which would lose every
        // sibling result). A bounded hang surfaces as data, not an exception.
        if (err.signal === "SIGTERM" || err.code === "ETIMEDOUT") return true;
        const msg = err.stderr?.toString() || String(e);
        throw new Error(`Excel batch evaluation failed: ${msg}`);
      }
    });
    if (timedOut) {
      return tasks.map((): DriverTaskResult => ({ outcome: { kind: "crashed", channel: "timeout" } }));
    }

    // Python emits rich JSON in the legacy {result,error,skipped} shape, plus the
    // D3 `crashed` field for a process-death the bisect attributed to one formula.
    // Lift each to the §6.6 Outcome at this boundary (the grid is already rich).
    const raw = JSON.parse(readFileSync(resultsFile, "utf8")) as Array<{
      result?: RichGridValue;
      error?: string;
      skipped?: string;
      crashed?: string;
    }>;
    return raw.map((r): DriverTaskResult =>
      r.crashed
        ? { outcome: { kind: "crashed", channel: r.crashed } }
        : { outcome: legacyToOutcome(r) },
    );
  }

  capabilities(): CapabilityDescriptor {
    return capabilityDescriptorFor(this.platform);
  }

  async versionString(): Promise<string | null> {
    // opens excel briefly (~3-5s) — only invoked from `assay history --record`
    return withExcelLock(() => probePythonVersion(PYTHON_SCRIPT, PROJECT_ROOT, 60000));
  }

  async destroy(): Promise<void> {
    if (this.tmpDir) {
      rmSync(this.tmpDir, { recursive: true, force: true });
      this.tmpDir = null;
    }
  }
}
