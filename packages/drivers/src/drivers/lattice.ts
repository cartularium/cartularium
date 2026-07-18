import { execSync, spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import { createInterface, type Interface } from "node:readline";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  valueOutcome,
  type CellValue,
  type DriverTaskResult,
  type GridValue,
  type RichGridValue,
} from "../format/values.js";
import type { Driver, CapabilityDescriptor } from "./driver.js";
import { capabilityDescriptorFor } from "../format/capability-data.js";
import { liftScalarGrid } from "./lift.js";

const PROJECT_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const LATTICE_ROOT_CANDIDATES = [
  join(PROJECT_ROOT, "..", "lattice"),
  join(PROJECT_ROOT, "..", "..", "..", "lattice"),
];
const LATTICE_ROOT =
  LATTICE_ROOT_CANDIDATES.find((path) => existsSync(join(path, "Cargo.toml"))) ??
  LATTICE_ROOT_CANDIDATES[0];

// lattice driver via the `lattice assay` json-line protocol
// one persistent subprocess; one json line in/out per evaluation

export class LatticeDriver implements Driver {
  readonly platform = "lattice" as const;
  private proc: ChildProcess | null = null;
  private rl: Interface | null = null;
  private latticeBin: string;

  constructor(latticeBin?: string) {
    this.latticeBin = latticeBin || join(LATTICE_ROOT, "target", "debug", "lattice");
  }

  async init(): Promise<void> {
    this.proc = spawn(this.latticeBin, ["assay"], {
      stdio: ["pipe", "pipe", "pipe"],
      cwd: LATTICE_ROOT,
    });

    this.proc.on("error", (err) => {
      throw new Error(
        `Failed to start Lattice: ${err.message}. Is it built? Run: cd ../lattice && cargo build`,
      );
    });

    this.rl = createInterface({ input: this.proc.stdout! });
  }

  async evaluate(formula: string, grid?: Record<string, CellValue>): Promise<RichGridValue> {
    if (!this.proc || !this.rl) throw new Error("Driver not initialized");

    const task = {
      formula,
      grid: grid ? serializeGrid(grid) : {},
    };
    this.proc.stdin!.write(JSON.stringify(task) + "\n");

    const line = await new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Lattice eval timeout")), 10000);
      this.rl!.once("line", (l) => {
        clearTimeout(timeout);
        resolve(l);
      });
    });

    const parsed = JSON.parse(line);
    if (parsed.error) throw new Error(`Lattice error: ${parsed.error}`);

    return liftScalarGrid(deserializeResult(parsed.result), this.platform);
  }

  async evaluateBatch(
    tasks: Array<{ formula: string; grid?: Record<string, CellValue> }>,
  ): Promise<DriverTaskResult[]> {
    const results: DriverTaskResult[] = [];
    for (const task of tasks) {
      try {
        const result = await this.evaluate(task.formula, task.grid);
        results.push({ outcome: valueOutcome(result) });
      } catch (e) {
        results.push({ outcome: { kind: "rejected", reason: String(e) } });
      }
    }
    return results;
  }

  capabilities(): CapabilityDescriptor {
    return capabilityDescriptorFor(this.platform);
  }

  async versionString(): Promise<string | null> {
    try {
      const sha = execSync("git rev-parse --short HEAD", {
        cwd: LATTICE_ROOT,
        stdio: ["pipe", "pipe", "pipe"],
      })
        .toString()
        .trim();
      return sha ? `git:${sha}` : null;
    } catch {
      return null;
    }
  }

  async destroy(): Promise<void> {
    if (this.proc) {
      this.proc.stdin!.end();
      this.proc.kill();
      this.proc = null;
      this.rl = null;
    }
  }
}

// lattice grid setup wants string cell contents (it parses them internally)
function serializeGrid(grid: Record<string, CellValue>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [ref, val] of Object.entries(grid)) {
    if (val === null) continue;
    if (typeof val === "object" && "error" in val) {
      result[ref] = val.error;
    } else {
      result[ref] = String(val);
    }
  }
  return result;
}

// lattice returns numbers/strings/booleans as-is, errors as {"error": "#CODE"}
function deserializeResult(grid: unknown[][]): GridValue {
  return grid.map((row) =>
    row.map((cell): CellValue => {
      if (cell === null) return null;
      if (typeof cell === "number") return cell;
      if (typeof cell === "string") return cell;
      if (typeof cell === "boolean") return cell;
      if (typeof cell === "object" && cell !== null && "error" in cell) {
        return { error: (cell as { error: string }).error };
      }
      return String(cell);
    }),
  );
}
