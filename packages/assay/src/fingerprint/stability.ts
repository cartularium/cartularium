// The stability relation (approved design §4). Asymmetric by construction:
// a fingerprint match at the same version IS the conclusion (stable); a
// mismatch is only a trigger — escalation materializes both projected
// values and runs the tolerant comparator over normalized circulating
// grids WITH EXPLICIT EXTENT, never the lossy mixed scalar/rich fallback
// (a grid hole must not reverse a blank/null mismatch into agreement).
// When a historical materialization is unavailable the verdict is
// UNRESOLVED — never a default to "changed". Across fingerprint versions
// the verdict is INCOMPARABLE unless both sides are reprojected under one
// version (an fpv transition is an epoch event, not drift).

import { canonicalizeCell, type Extent, type Outcome, type RichGridValue } from "../format/values.js";
import { canonicalEquals } from "../format/equality.js";
import { isStabilityComparable, type Fingerprint } from "./encode.js";

export type StabilityVerdict = "stable" | "changed" | "unresolved" | "incomparable";

export interface ObservationRef {
  fingerprint: Fingerprint;
  fpv: number;
  /** the materialized outcome, when recoverable (fixture or evidence commit) */
  outcome?: Outcome;
}

export function compareStability(a: ObservationRef, b: ObservationRef): StabilityVerdict {
  if (a.fpv !== b.fpv) return "incomparable";
  if (a.fingerprint === b.fingerprint) return "stable";
  // escalation: the hash cannot conclude inequality
  if (a.outcome === undefined || b.outcome === undefined) return "unresolved";
  if (a.outcome.kind === "value" && b.outcome.kind === "value") {
    return circulatingGridsEqual(a.outcome.grid, a.outcome.extent, b.outcome.grid, b.outcome.extent)
      ? "stable" // tolerance residual the hash could not absorb
      : "changed";
  }
  // non-value identity projections are discrete: differing hashes of
  // materialized outcomes mean the projection genuinely differs
  return "changed";
}

/** True when one of the observations is outside the engine-stability
 * relation entirely (operational outcome) — record, don't compare. */
export function isOperationalGap(a: Outcome, b: Outcome): boolean {
  return !isStabilityComparable(a) || !isStabilityComparable(b);
}

// tolerant equality over the circulating projection with explicit extent —
// the escalation comparator. Grid holes canonicalize to blank (a hole is
// an untouched cell, not a runtime null), and extent inequality is
// inequality no matter what the cells say.
export function circulatingGridsEqual(
  a: RichGridValue,
  aExtent: Extent,
  b: RichGridValue,
  bExtent: Extent,
): boolean {
  if (aExtent.rows !== bExtent.rows || aExtent.cols !== bExtent.cols) return false;
  if (a.length !== b.length) return false;
  for (let r = 0; r < a.length; r++) {
    if (a[r].length !== b[r].length) return false;
    for (let c = 0; c < a[r].length; c++) {
      if (!canonicalEquals(canonicalizeCell(a[r][c]), canonicalizeCell(b[r][c]))) return false;
    }
  }
  return true;
}
