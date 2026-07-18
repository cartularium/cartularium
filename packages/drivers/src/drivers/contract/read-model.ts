// The read model — §5.3 (RATIFIED 2026-06-15), superseding the O3 escalation ladder.
//
// Move 2 KILLED the ladder: it conflated three orthogonal axes — packing (layout.ts),
// extent-routing (this module), and isolation (a SEPARATE failure axis, §6 / D3-D4).
// O4's composite probe yields the engine-authoritative extent BEFORE the value read,
// so "escalate by discovery" (T0→T1→T2) collapses into "route by known extent": ONE
// binary budget fork — materialize | digest. There is no tier ladder and no
// `isolated` rung here (isolation is the compute/liveness axis, not an extent route).
//
// Two load-bearing invariants survive verbatim:
//
//   1. Boundary-hit is a ROUTING TRIGGER, never an evidence marker — there is no
//      `truncated` outcome (§6.6). The rejected O1 model treated a window-filling
//      result as `truncated`, which could manufacture agreement (two engines'
//      identical 20×20 prefixes of diverging 50-row results). Here a boundary hit
//      only fires the extent probe; a false trigger costs one probe, never wrong data.
//
//   2. Thresholds route COST, never TRUTH — materialize and digest are BOTH faithful:
//      materialize reads the full grid; digest emits divergence at a DECLARED fidelity
//      (never a clipped grid, §6.6). The fork is a cost call, not a truth call.

import type { BatchLayout } from "./layout.js";
import type { Extent, RichGridValue } from "../../format/values.js";

// Extent is the shared value-model type (format/values.ts); re-exported so existing
// read-model consumers keep their import site.
export type { Extent };

/**
 * The §5.3 budget fork: once the engine-authoritative extent is known, a read is
 * EITHER materialized in full OR reduced to a digest — the single output-extent
 * decision. Isolation (the compute/liveness axis) is decided separately (§6).
 */
export type BudgetRoute = "materialize" | "digest";

/**
 * The materialize budget — the cell count above which a read switches from values
 * to a digest. Declared + measured, never a hidden constant (doc §5.2); a per-batch
 * knob.
 */
export interface ReadBudget {
  maxMaterializeCells: number;
}

/** A conservative default budget. Real batches declare their own (doc §5.2). */
export const DEFAULT_BUDGET: ReadBudget = { maxMaterializeCells: 1_000_000 };

export interface ReadRouting {
  route: BudgetRoute;
  /** Why this route — surfaced for observability, never a truncation claim. */
  reason: string;
}

/** Cells the layout's staging window covers — the initial direct-read capacity. */
export function stagingCells(layout: BatchLayout): number {
  return layout.stagingRows * layout.stagingCols;
}

/** True iff `extent` fits the staging window — a single direct read suffices, no probe. */
export function fitsStaging(extent: Extent, layout: BatchLayout): boolean {
  return extent.rows <= layout.stagingRows && extent.cols <= layout.stagingCols;
}

/**
 * The binary budget fork (§5.3 Move 2). Given the known extent:
 *
 *   - cells ≤ budget → `materialize` (read the full grid — "fits staging" and
 *     "exceeds staging but within budget" are the SAME route; T0/T1 collapsed)
 *   - cells > budget → `digest`      (divergence at declared fidelity, never clipped)
 *
 * Layout-independent: the staging window governs the initial READ size, not this
 * cost decision. Isolation is never returned here.
 */
export function routeByExtent(
  extent: Extent,
  budget: ReadBudget = DEFAULT_BUDGET,
): ReadRouting {
  const cells = extent.rows * extent.cols;
  if (cells <= budget.maxMaterializeCells) {
    return {
      route: "materialize",
      reason: `extent ${extent.rows}×${extent.cols} within materialize budget`,
    };
  }
  return {
    route: "digest",
    reason: `extent ${cells} cells exceeds materialize budget (${budget.maxMaterializeCells})`,
  };
}

/**
 * The common-case tripwire (Move 4 — runtime-triggered probe): after a direct staged
 * read, did the result fill the staging window to an edge? If so the true extent MAY
 * exceed staging ⇒ fire the extent probe to learn the engine-authoritative extent,
 * then route by it. NEVER a truncation flag (the rejected O1 sin) — it only triggers
 * a probe.
 *
 * ⚠ gsheets caveat (arch-review m1): this reads the TRIMMED grid, and gsheets'
 * trailing blanks are wire-ambiguous (D8.β) — the trim can FALSE-NEGATIVE (a result
 * that overflowed looks like it fit). So on gsheets the PROBE is the sole extent
 * authority; the tripwire is a reliable backstop only on Excel (fixed grid,
 * unambiguous trim).
 */
export function stagingBoundaryReached(grid: RichGridValue, layout: BatchLayout): boolean {
  if (grid.length >= layout.stagingRows) return true;
  for (const row of grid) {
    if (row.length >= layout.stagingCols) return true;
  }
  return false;
}
