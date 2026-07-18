import { execSync } from "node:child_process";
import { writeFileSync, readFileSync, mkdtempSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import type { CellValue, DriverTaskResult, GridValue, RichGridValue } from "../format/values.js";
import type { Driver, CapabilityDescriptor } from "./driver.js";
import { capabilityDescriptorFor } from "../format/capability-data.js";
import { liftScalarGrid, liftTaskResults } from "./lift.js";
import { probePythonVersion } from "./python-helpers.js";

// ironcalc driver — drives the `ironcalc` python package via subprocess
// requires the uv-managed python env from `assay setup`

const PROJECT_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const PYTHON_SCRIPT = join(PROJECT_ROOT, "python", "ironcalc_driver.py");

export class IronCalcDriver implements Driver {
  readonly platform = "ironcalc" as const;
  private tmpDir: string | null = null;

  async init(): Promise<void> {
    try {
      execSync("uv run python -c 'import ironcalc'", {
        cwd: PROJECT_ROOT,
        stdio: "pipe",
      });
    } catch {
      throw new Error("ironcalc not available. Run: assay setup");
    }
    this.tmpDir = mkdtempSync(join(tmpdir(), "assay-ironcalc-"));
  }

  async evaluate(formula: string, grid?: Record<string, CellValue>): Promise<RichGridValue> {
    if (!this.tmpDir) throw new Error("Driver not initialized");

    const taskFile = join(this.tmpDir, "task.json");
    const resultFile = join(this.tmpDir, "result.json");

    writeFileSync(taskFile, JSON.stringify({ formula, grid: grid || {} }));

    try {
      execSync(`uv run python "${PYTHON_SCRIPT}" "${taskFile}" "${resultFile}"`, {
        cwd: PROJECT_ROOT,
        stdio: ["pipe", "pipe", "pipe"],
        timeout: 30000,
      });
    } catch (e: unknown) {
      const err = e as { stderr?: Buffer };
      throw new Error(`IronCalc evaluation failed: ${err.stderr?.toString() || String(e)}`);
    }

    const raw = JSON.parse(readFileSync(resultFile, "utf8"));
    if (raw.error) throw new Error(`IronCalc error: ${raw.error}`);
    return liftScalarGrid(raw.result as GridValue, this.platform);
  }

  async evaluateBatch(
    tasks: Array<{ formula: string; grid?: Record<string, CellValue> }>,
  ): Promise<DriverTaskResult[]> {
    if (!this.tmpDir) throw new Error("Driver not initialized");

    const tasksFile = join(this.tmpDir, "tasks.json");
    const resultsFile = join(this.tmpDir, "results.json");

    writeFileSync(
      tasksFile,
      JSON.stringify(tasks.map((t) => ({ formula: t.formula, grid: t.grid || {} }))),
    );

    try {
      execSync(`uv run python "${PYTHON_SCRIPT}" --batch "${tasksFile}" "${resultsFile}"`, {
        cwd: PROJECT_ROOT,
        stdio: ["pipe", "pipe", "pipe"],
        timeout: 600000,
      });
    } catch (e: unknown) {
      const err = e as { stderr?: Buffer };
      throw new Error(`IronCalc batch evaluation failed: ${err.stderr?.toString() || String(e)}`);
    }

    const raw = JSON.parse(readFileSync(resultsFile, "utf8")) as Array<{
      result?: GridValue;
      error?: string;
      skipped?: string;
    }>;
    return liftTaskResults(raw, this.platform);
  }

  capabilities(): CapabilityDescriptor {
    return capabilityDescriptorFor(this.platform);
  }

  async versionString(): Promise<string | null> {
    return probePythonVersion(PYTHON_SCRIPT, PROJECT_ROOT);
  }

  async destroy(): Promise<void> {
    if (this.tmpDir) {
      rmSync(this.tmpDir, { recursive: true, force: true });
      this.tmpDir = null;
    }
  }
}
