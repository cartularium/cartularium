// Ingestion clause (§4) — the canonical seed vocabulary + classification every
// driver routes through, so a seed's TYPE is decided ONCE here and never
// re-inferred per engine (the manufactured-divergence fix). Folds in:
//   D1  — scalar-type-is-declaration (a number is a number, "3" is text).
//   D6  — errors are a real native error literal (CellError, already a
//         CellValue); dates & any value scalars can't express are formula-seeded.
//   B   — a seed may be a formula-bearing entry {formula:"…"} (the carrier that
//         lets the corpus declare a date input, =DATE(y,m,d), or any
//         formula-derived input). The grid seed type widens accordingly.
//   D5  — this is the contract, built module-first; per-engine *rendering* of an
//         intent (gsheets RAW vs USER_ENTERED-sentinel, openpyxl data_type) is
//         the driver's conformance, gated by the type-fidelity invariant.

import { isCellError, type CellValue } from "../../format/values.js";

/** A formula-bearing grid entry (decision B) — written as a formula, evaluated in-engine. */
export interface SeedFormula {
  formula: string;
}

/** What a grid input cell may be: a scalar/error literal, or a formula entry. */
export type SeedValue = CellValue | SeedFormula;

/**
 * The single, engine-independent meaning of a seed. Drivers render this — they
 * never re-derive it. `blank` is an empty cell; `error` carries the sentinel a
 * driver must materialize as a native error literal (not text); `formula` is
 * written as a formula and the engine supplies the value.
 */
export type SeedIntent =
  | { kind: "blank" }
  | { kind: "number"; value: number }
  | { kind: "text"; value: string }
  | { kind: "boolean"; value: boolean }
  | { kind: "error"; sentinel: string }
  | { kind: "formula"; formula: string };

/** The classic-7 Excel error sentinels — the portable error set the type-fidelity
 * invariant sweeps (only `#DIV/0!` is confirmed live on gsheets' USER_ENTERED
 * sentinel path so far, D6). Non-classic engine errors are out of this set. */
export const CLASSIC_ERROR_SENTINELS: readonly string[] = [
  "#DIV/0!",
  "#N/A",
  "#NAME?",
  "#NULL!",
  "#NUM!",
  "#REF!",
  "#VALUE!",
];

export function isSeedFormula(v: SeedValue): v is SeedFormula {
  return typeof v === "object" && v !== null && "formula" in v;
}

/** Normalize a seed/formula string to exactly one leading `=` (the stored form). */
export function normalizeFormula(formula: string): string {
  const t = formula.trim();
  if (t === "" || t === "=") {
    throw new RangeError(`normalizeFormula: empty formula`);
  }
  return t.startsWith("=") ? t : `=${t}`;
}

/**
 * Classify a grid seed into its single canonical intent. This is the *only*
 * place a seed's type is decided. Note the D1 consequence: a string that merely
 * *looks* like an error (e.g. `"#DIV/0!"`) is **text** — to seed an error you
 * pass a `CellError` (`{error:"#DIV/0!"}`), not a string.
 */
export function classifySeed(v: SeedValue): SeedIntent {
  if (v === null) return { kind: "blank" };
  if (typeof v === "object") {
    if (isSeedFormula(v)) return { kind: "formula", formula: normalizeFormula(v.formula) };
    if (isCellError(v)) return { kind: "error", sentinel: v.error };
    throw new TypeError(`classifySeed: unrecognized seed object ${JSON.stringify(v)}`);
  }
  switch (typeof v) {
    case "number":
      return { kind: "number", value: v };
    case "string":
      return { kind: "text", value: v };
    case "boolean":
      return { kind: "boolean", value: v };
    default:
      throw new TypeError(`classifySeed: unsupported seed ${JSON.stringify(v)}`);
  }
}

/**
 * The type-probes a faithfully-ingested seed MUST satisfy, evaluated by a
 * passthrough formula reading the seed cell (`=ISNUMBER(A1)`, `=ISTEXT(A1)`,
 * `=ISLOGICAL(A1)`, `=ISERROR(A1)`). The type-fidelity invariant asserts every
 * driver reports exactly this for a given seed; any driver that coerces fails.
 * `formula` seeds carry no fixed type expectation (the formula decides), so they
 * return `null` here — the invariant skips them.
 */
export function expectedTypeProbes(
  intent: SeedIntent,
): { isNumber: boolean; isText: boolean; isLogical: boolean; isError: boolean } | null {
  switch (intent.kind) {
    case "number":
      return { isNumber: true, isText: false, isLogical: false, isError: false };
    case "text":
      return { isNumber: false, isText: true, isLogical: false, isError: false };
    case "boolean":
      return { isNumber: false, isText: false, isLogical: true, isError: false };
    case "error":
      return { isNumber: false, isText: false, isLogical: false, isError: true };
    case "blank":
      // An empty cell is type-less: ISNUMBER/ISTEXT/ISLOGICAL/ISERROR all false.
      return { isNumber: false, isText: false, isLogical: false, isError: false };
    case "formula":
      return null;
  }
}
