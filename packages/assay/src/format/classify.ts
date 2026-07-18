// per-engine result classification — pure data-layer logic shared by the
// catalogue site's cell rendering and the manifest builder

import { toScalarGrid, type CellValue, type GridValue, type RichGridValue } from "./values.js";
import { normalizeToGrid } from "./parse.js";
import { gridsEqual } from "./match.js";
import { toleranceFor } from "./tolerance.js";
import type { TestInfo } from "../catalogue-site/load.js";

export type Verdict = { kind: "match" | "diverge" | "no-data"; label: string };

export function classifyEngineResult(
  engine: string,
  fixtureValue: unknown,
  canonicalGrid: GridValue,
  override: TestInfo["overrides"][string] | undefined,
): Verdict {
  if (fixtureValue === undefined) return { kind: "no-data", label: "no fixture" };
  // Catalogue display is scalar; project rich fixture values down before
  // running through normalizeToGrid (which expects scalar CellValue).
  const scalarFx = toScalarGrid(fixtureValue as GridValue | RichGridValue);
  const fxGrid = normalizeToGrid(scalarFx as CellValue | CellValue[] | CellValue[][]);
  const tol = toleranceFor(engine);

  if (override?.recorded !== undefined) {
    const recordedGrid = normalizeToGrid(override.recorded as CellValue | CellValue[] | CellValue[][]);
    if (gridsEqual(recordedGrid, fxGrid, tol)) {
      return { kind: "diverge", label: `documented divergence (cause: ${override.cause})` };
    }
  }

  if (gridsEqual(fxGrid, canonicalGrid, tol)) {
    return { kind: "match", label: "matches canonical" };
  }
  return { kind: "diverge", label: "diverges from canonical" };
}
