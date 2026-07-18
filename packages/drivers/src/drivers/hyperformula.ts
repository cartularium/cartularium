import { HyperFormula } from "hyperformula";
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

// hyperformula driver — runs in-process via the `hyperformula` npm package
// (mit/gpl-v3). single instance reused across evals; fresh sheet per test.
// formula at AA1 (cols A-Z reserved for grid:); 20×20 spill window read.

const TARGET_ROW = 0;
const TARGET_COL = 26; // AA, 0-indexed
const SPILL_ROWS = 20;
const SPILL_COLS = 20;

export class HyperFormulaDriver implements Driver {
  readonly platform = "hyperformula" as const;
  private hf: HyperFormula | null = null;
  private sheetCounter = 0;

  async init(): Promise<void> {
    this.hf = HyperFormula.buildEmpty({ licenseKey: "gpl-v3", useArrayArithmetic: true });
  }

  async evaluate(formula: string, grid?: Record<string, CellValue>): Promise<RichGridValue> {
    if (!this.hf) throw new Error("Driver not initialized");

    // fresh sheet per eval so grid state doesn't bleed across tests
    const sheetName = `s${this.sheetCounter++}`;
    this.hf.addSheet(sheetName);
    const sheetId = this.hf.getSheetId(sheetName);
    if (sheetId === undefined) throw new Error(`failed to create sheet ${sheetName}`);

    try {
      if (grid) {
        for (const [ref, val] of Object.entries(grid)) {
          if (val === null) continue;
          const [row, col] = parseCellRef(ref);
          this.hf.setCellContents({ sheet: sheetId, row, col }, [[toHFInput(val)]]);
        }
      }
      this.hf.setCellContents({ sheet: sheetId, row: TARGET_ROW, col: TARGET_COL }, [[formula]]);
      return liftScalarGrid(readResult(this.hf, sheetId), this.platform);
    } finally {
      this.hf.removeSheet(sheetId);
    }
  }

  async evaluateBatch(
    tasks: Array<{ formula: string; grid?: Record<string, CellValue> }>,
  ): Promise<DriverTaskResult[]> {
    const results: DriverTaskResult[] = [];
    for (const t of tasks) {
      try {
        results.push({ outcome: valueOutcome(await this.evaluate(t.formula, t.grid)) });
      } catch (e) {
        results.push({
          outcome: { kind: "rejected", reason: e instanceof Error ? e.message : String(e) },
        });
      }
    }
    return results;
  }

  capabilities(): CapabilityDescriptor {
    return capabilityDescriptorFor(this.platform);
  }

  async versionString(): Promise<string | null> {
    return HyperFormula.version;
  }

  async destroy(): Promise<void> {
    if (this.hf) {
      this.hf.destroy();
      this.hf = null;
    }
  }
}

function toHFInput(val: Exclude<CellValue, null>): number | string | boolean {
  if (typeof val === "object" && "error" in val) return val.error;
  return val;
}

function parseCellRef(ref: string): [number, number] {
  const m = /^([A-Z]+)(\d+)$/.exec(ref.toUpperCase());
  if (!m) throw new Error(`Invalid cell ref: ${ref}`);
  let col = 0;
  for (const ch of m[1]) col = col * 26 + (ch.charCodeAt(0) - 64);
  return [parseInt(m[2], 10) - 1, col - 1];
}

function readResult(hf: HyperFormula, sheetId: number): GridValue {
  const grid: CellValue[][] = [];
  for (let dr = 0; dr < SPILL_ROWS; dr++) {
    const row: CellValue[] = [];
    for (let dc = 0; dc < SPILL_COLS; dc++) {
      const v = hf.getCellValue({
        sheet: sheetId,
        row: TARGET_ROW + dr,
        col: TARGET_COL + dc,
      });
      row.push(fromHFValue(v));
    }
    grid.push(row);
  }

  // trim trailing all-null cols
  let maxCols = 0;
  for (const row of grid) {
    for (let c = row.length - 1; c >= 0; c--) {
      if (row[c] !== null) {
        if (c + 1 > maxCols) maxCols = c + 1;
        break;
      }
    }
  }
  if (maxCols === 0) maxCols = 1;
  const trimmedCols = grid.map((row) => row.slice(0, maxCols));

  // trim trailing all-null rows
  let maxRows = 0;
  for (let r = trimmedCols.length - 1; r >= 0; r--) {
    if (trimmedCols[r].some((v) => v !== null)) {
      maxRows = r + 1;
      break;
    }
  }
  if (maxRows === 0) maxRows = 1;
  return trimmedCols.slice(0, maxRows);
}

function fromHFValue(v: unknown): CellValue {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return v;
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return v;
  // hyperformula DetailedCellError
  if (typeof v === "object" && v !== null && "value" in v) {
    const err = (v as { value: unknown }).value;
    return { error: typeof err === "string" ? err : "#ERROR!" };
  }
  return String(v);
}
