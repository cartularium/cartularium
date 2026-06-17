// Rich-aware value equality — the divergence-comparison spine over RichCellValue,
// reified per the ratified value-equality-and-fingerprint model (2026-06-15) and
// the B1 architecture-review fix. The legacy scalar comparison (projectScalarGrid →
// cellsEqual) collapses BOTH `blank` and `null` to the same scalar `null`, so
// `null === null` manufactures AGREEMENT on the ratified blank-vs-null divergence
// (D8.β) — a CIRCULATING facet (it survives the deref map `=A1`). The circulating
// projection (`canonicalizeCell`, now in the contracts value spine) preserves the
// distinctions the scalar projection drops; this module is the comparison over it.
//
// What's compared (circulating facets, equality doc §1): value, type/coercion,
// error-vs-value, blank-vs-null, opaque-by-kind. What's NOT (terminal — excluded
// from divergence): number_format, the formatted display string, engine extras.
// Descriptive by default — blank≠null, number≠string, error≠value — so agreement
// is never manufactured.
//
// `opaque` (rendered-rich: image / sparkline) compares by `type_tag` ONLY: its
// content is no-data through every channel (driver capture is empty; in-engine `=`
// is content-blind, so different-data sparklines compare equal). That is
// capability/no-data, never manufactured agreement on content the engine itself
// cannot see (cell-value.ts `opaque`; equality doc §3). A grid HOLE (no cell)
// canonicalizes to `blank` (untouched).

import type { RichCellValue, RichGridValue, CirculatingCell } from "./values.js";
import { canonicalizeCell } from "./values.js";

/** Default relative numeric tolerance — mirrors match.ts cellsEqual. */
export const DEFAULT_NUM_TOL = 1e-10;

/** True iff two circulating cells are equal (numbers within relative tolerance). */
export function canonicalEquals(
  a: CirculatingCell,
  b: CirculatingCell,
  tol: number = DEFAULT_NUM_TOL,
): boolean {
  if (a.c !== b.c) return false; // class distinction is load-bearing (descriptive default)
  if (a.c === "number" && b.c === "number") {
    if (a.v === b.v) return true;
    if (Number.isNaN(a.v) && Number.isNaN(b.v)) return true;
    const diff = Math.abs(a.v - b.v);
    const mag = Math.max(Math.abs(a.v), Math.abs(b.v), 1);
    return diff / mag < tol;
  }
  // Same class, non-number: blank/null carry no value (class match suffices);
  // everything else compares its single payload exactly.
  if ("v" in a && "v" in b) return a.v === b.v;
  return true;
}

/** Rich-aware cell equality — preserves blank/null/opaque the scalar path drops. */
export function richCellsEqual(
  a: RichCellValue | null,
  b: RichCellValue | null,
  tol: number = DEFAULT_NUM_TOL,
): boolean {
  return canonicalEquals(canonicalizeCell(a), canonicalizeCell(b), tol);
}

/** Rich-aware grid equality — the divergence spine when both sides are rich. */
export function richGridsEqual(
  a: RichGridValue,
  b: RichGridValue,
  tol: number = DEFAULT_NUM_TOL,
): boolean {
  if (a.length !== b.length) return false;
  for (let r = 0; r < a.length; r++) {
    if (a[r].length !== b[r].length) return false;
    for (let c = 0; c < a[r].length; c++) {
      if (!richCellsEqual(a[r][c], b[r][c], tol)) return false;
    }
  }
  return true;
}
