// Batch layout contract — the single declared coordinate/dimension contract
// that replaces the per-driver magic constants (AA1 formula cell, A1:Z input
// region, 20×20 staging window, sheet dimensions) catalogued in
// docs/seeding-isolation-design-2026-06-07.md §5. One BatchLayout is the source
// of truth a driver consumes; it also travels to @cartularium/drivers at
// extraction (step 4) — until then it lives here (assay CLAUDE.md: drivers stay
// until the audit). See D5 (module-first).
//
// D2 (read/spill model) GREENLIT 2026-06-14 — O3 escalation ladder + O4 two-phase
// (design doc §5.2; charter §8 gate-check). The staging window here (stagingRows/
// stagingCols, stagingRangeA1) is T0's small default read-back window: an
// I/O-bounding default for the common case, NOT a semantic boundary on the
// engine's spill extent. The escalation ladder that turns a boundary hit into a
// re-read (never into a `truncated` evidence flag) lives in read-model.ts; the old
// `spillOverflowed`-as-evidence function (the rejected O1 model) graduated there
// into the routing predicate `stagingBoundaryReached`.
//
// Coordinates are 1-indexed (row 1, col 1 = A1), matching Excel's grid and the
// python driver's TARGET_ROW/TARGET_COL. Two §5 hardening rules fall out as
// functions: dimensions-derived-not-defaulted (`requiredDimensions`) and
// region-validation (`validateGrid`).

import type { CellValue } from "../../format/values.js";

/** A 1-indexed cell coordinate (row 1, col 1 == "A1"). */
export interface Coord {
  row: number;
  col: number;
}

/**
 * The declared layout for one batch host. Replaces the constants that drifted
 * per driver (TARGET_CELL, READ_RANGE, GRID_ROWS/COLS, the 20×20 window).
 *
 * Regions, all 1-indexed:
 * - INPUT:   cols [inputFirstCol..inputLastCol], rows from 1 — grid seeds.
 * - FORMULA: the single `formula` cell — must sit OUTSIDE the input region.
 * - STAGING: the `stagingRows × stagingCols` default read-back window anchored at
 *   `formula`. This is T0's I/O default (read-model.ts), NOT a boundary on extent:
 *   a result larger than staging is read via escalation (a sized re-read), never
 *   clipped to the window.
 * - OBSTACLES (optional): declared spill-path blocker cells — the spill-block
 *   family (§5.2 / charter §8). A test that deliberately seeds a blocker inside
 *   the staging window (to provoke `#SPILL!`) DECLARES it here, which turns that
 *   collision into a legal fixture; undeclared collisions stay violations.
 * A PROBE region (gsheets D8.β side-channel) lives on its own host/sheet, so it
 * is not modeled as a sub-rectangle here.
 */
export interface BatchLayout {
  inputFirstCol: number;
  inputLastCol: number;
  formula: Coord;
  stagingRows: number;
  stagingCols: number;
  /** Declared spill-path blockers (legal fixtures), never the formula cell. */
  obstacles?: Coord[];
}

/**
 * Default layout = the legacy constants, now declared once. formula AA1
 * (row 1, col 27); input A1:Z (cols 1..26); staging 20×20 → AA1:AT20. Every
 * current driver hard-codes some projection of exactly this. Under O4 two-phase
 * the staging window governs only the unprobed safety-net path (doc §5.2).
 */
export const DEFAULT_LAYOUT: BatchLayout = {
  inputFirstCol: 1,
  inputLastCol: 26, // Z
  formula: { row: 1, col: 27 }, // AA1
  stagingRows: 20,
  stagingCols: 20,
};

// === A1 <-> coordinate conversion (bijective base-26, 1-indexed) ===

/** 1-indexed column number to A1 letters: 1 -> "A", 26 -> "Z", 27 -> "AA". */
export function colToLetter(col: number): string {
  if (col < 1 || !Number.isInteger(col)) {
    throw new RangeError(`colToLetter: column must be a positive integer, got ${col}`);
  }
  let s = "";
  let x = col;
  while (x > 0) {
    const m = (x - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    x = Math.floor((x - 1) / 26);
  }
  return s;
}

/** A1 letters to 1-indexed column number: "A" -> 1, "AA" -> 27. */
export function letterToCol(letters: string): number {
  if (!/^[A-Z]+$/.test(letters)) {
    throw new RangeError(`letterToCol: expected A-Z letters, got ${JSON.stringify(letters)}`);
  }
  let col = 0;
  for (const ch of letters) col = col * 26 + (ch.charCodeAt(0) - 64);
  return col;
}

/** Coord to an A1 reference, e.g. {row:1,col:27} -> "AA1". */
export function coordToA1(c: Coord): string {
  return `${colToLetter(c.col)}${c.row}`;
}

/** Parse an A1 reference (no $ anchors) to a Coord, e.g. "AA1" -> {row:1,col:27}. */
export function a1ToCoord(ref: string): Coord {
  const m = /^([A-Z]+)(\d+)$/.exec(ref.trim().toUpperCase());
  if (!m) throw new RangeError(`a1ToCoord: not a plain A1 ref: ${JSON.stringify(ref)}`);
  return { col: letterToCol(m[1]), row: Number.parseInt(m[2], 10) };
}

// === Derived ranges (what drivers actually write/read) ===

/** The formula cell as A1, e.g. "AA1". */
export function formulaCellA1(layout: BatchLayout): string {
  return coordToA1(layout.formula);
}

/**
 * The default read-back (staging) window as an A1 range anchored at the formula
 * cell, e.g. "AA1:AT20". This is the T0 staged read; larger extents escalate to a
 * sized re-read (read-model.ts), they are not bounded by this range.
 */
export function stagingRangeA1(layout: BatchLayout): string {
  const start = layout.formula;
  const end: Coord = {
    row: start.row + layout.stagingRows - 1,
    col: start.col + layout.stagingCols - 1,
  };
  return `${coordToA1(start)}:${coordToA1(end)}`;
}

/** The input-seed region as an A1 range for a grid of `rows` height, e.g. "A1:Z30". */
export function inputRangeA1(layout: BatchLayout, rows: number): string {
  const r = Math.max(1, rows);
  return `${colToLetter(layout.inputFirstCol)}1:${colToLetter(layout.inputLastCol)}${r}`;
}

/**
 * §5 rule 1 — dimensions derived, never defaulted. The minimal host size that
 * covers the input region, the formula cell, and the full staging window, plus
 * optional headroom. This is the floor for the T0 default read; an escalated
 * sized re-read (read-model.ts T1) sizes the host from the known extent — that
 * sizing is the driver's, this is the floor. Callers clamp to the engine's caps
 * (e.g. gsheets 10M cells).
 */
export function requiredDimensions(
  layout: BatchLayout,
  inputRows: number,
  headroom = 0,
): { rows: number; cols: number } {
  const lastCol = layout.formula.col + layout.stagingCols - 1;
  const lastRow = Math.max(inputRows, layout.formula.row + layout.stagingRows - 1);
  return { rows: lastRow + headroom, cols: lastCol + headroom };
}

// === §5 rule 3 — region validation (closes foot-gun #2, formula overwrite) ===

export interface GridViolation {
  ref: string;
  reason: string;
}

/** True iff `c` falls inside the INPUT region (the only place grid seeds belong). */
export function inInputRegion(layout: BatchLayout, c: Coord): boolean {
  return (
    c.row >= 1 &&
    c.col >= layout.inputFirstCol &&
    c.col <= layout.inputLastCol
  );
}

/**
 * True iff `c` is a declared spill-path obstacle — a legal blocker fixture (the
 * spill-block family, §5.2 / charter §8). The formula cell is never an obstacle,
 * even if listed, so a seed can never legally overwrite the formula.
 */
export function isDeclaredObstacle(layout: BatchLayout, c: Coord): boolean {
  if (c.row === layout.formula.row && c.col === layout.formula.col) return false;
  return (layout.obstacles ?? []).some((o) => o.row === c.row && o.col === c.col);
}

/**
 * Reject any grid seed whose ref is unparseable, or falls outside INPUT, or
 * collides with the FORMULA/STAGING window. Returns one violation per bad ref
 * (empty array == valid). Drivers/loaders call this before writing a seed. The
 * staging window is the reserved no-go floor (where the T0 read-back lands);
 * declared spill-path obstacles are a separate, deliberate fixture (the
 * spill-block family) handled at a higher layer, not here.
 */
export function validateGrid(
  layout: BatchLayout,
  grid: Record<string, CellValue>,
): GridViolation[] {
  const out: GridViolation[] = [];
  const stagingFirstCol = layout.formula.col;
  const stagingLastCol = layout.formula.col + layout.stagingCols - 1;
  const stagingLastRow = layout.formula.row + layout.stagingRows - 1;
  for (const ref of Object.keys(grid)) {
    let c: Coord;
    try {
      c = a1ToCoord(ref);
    } catch {
      out.push({ ref, reason: "unparseable A1 reference" });
      continue;
    }
    if (inInputRegion(layout, c)) continue;
    // Outside INPUT — say specifically whether it hits the reserved window.
    const hitsStaging =
      c.col >= stagingFirstCol &&
      c.col <= stagingLastCol &&
      c.row >= layout.formula.row &&
      c.row <= stagingLastRow;
    // A declared spill-path obstacle inside the window is a legal fixture
    // (the spill-block family), not a violation.
    if (hitsStaging && isDeclaredObstacle(layout, c)) continue;
    out.push({
      ref,
      reason: hitsStaging
        ? `collides with FORMULA/STAGING window (${stagingRangeA1(layout)})`
        : `outside INPUT region (${colToLetter(layout.inputFirstCol)}..${colToLetter(layout.inputLastCol)})`,
    });
  }
  return out;
}
