// Transitional helper for drivers that still produce only legacy scalar grids.
// Excel and Google Sheets emit native rich cells; the remaining engines use
// this small lift so the Driver contract can stay uniformly rich.

import type {
  EngineExtras,
  PrimitiveValue,
  RichCellValue,
  RichGridValue,
} from "@cartularium/contracts";
import {
  isCellError,
  legacyToOutcome,
  type CellValue,
  type DriverTaskResult,
  type GridValue,
  type Platform,
} from "../format/values.js";

export function liftScalarToRich(value: CellValue, platform: Platform): RichCellValue | null {
  // Preserve the scalar grid's null-position semantic ("no cell here").
  // A driver that wants to disambiguate untouched-vs-blank populates a real
  // RichCellValue with kind:"blank" + a reason; the lift path is for
  // engines that don't carry that distinction yet.
  if (value === null) return null;
  return {
    primitive: liftPrimitive(value),
    engine: minimalEngineExtras(platform),
  };
}

export function liftScalarGrid(grid: GridValue, platform: Platform): RichGridValue {
  return grid.map((row) => row.map((v) => liftScalarToRich(v, platform)));
}

// Lift an array of scalar-shaped subprocess results to the §6.6 DriverTaskResult.
// Subprocess drivers (Python/uv-based) parse scalar JSON ({result,error,skipped})
// from their subprocess; we lift the grid to rich and the whole entry to an
// Outcome at this boundary (legacyToOutcome), so the live driver layer speaks
// §6.6 without each subprocess having to.
export function liftTaskResults(
  raw: Array<{ result?: GridValue; error?: string; skipped?: string }>,
  platform: Platform,
): DriverTaskResult[] {
  return raw.map((r) => ({
    outcome: legacyToOutcome({
      result: r.result ? liftScalarGrid(r.result, platform) : undefined,
      error: r.error,
      skipped: r.skipped,
    }),
  }));
}

function liftPrimitive(value: NonNullable<CellValue>): PrimitiveValue {
  if (typeof value === "number") return { kind: "number", value };
  if (typeof value === "string") return { kind: "string", value };
  if (typeof value === "boolean") return { kind: "boolean", value };
  if (isCellError(value)) return { kind: "error", sentinel: value.error };
  // Unreachable per the CellValue union narrowing, but TypeScript can't always
  // infer that — fall back to a blank rather than throwing so a transitional
  // stub never crashes mid-run.
  return { kind: "blank", reason: "untouched" };
}

function minimalEngineExtras(platform: Platform): EngineExtras {
  switch (platform) {
    case "excel":
      return { platform: "excel" };
    case "gsheets":
      // wire_kind is required by GSheetsExtras. Native gsheets output carries
      // the real value; this fallback only exists for lifted scalar results.
      return { platform: "gsheets", wire_kind: "blank" };
    case "lattice":
      return { platform: "lattice" };
    case "hyperformula":
      return { platform: "hyperformula" };
    case "ironcalc":
      return { platform: "ironcalc" };
    case "libreoffice":
      return { platform: "libreoffice" };
    case "formulas":
      return { platform: "formulas" };
    case "pycel":
      return { platform: "pycel" };
  }
}
