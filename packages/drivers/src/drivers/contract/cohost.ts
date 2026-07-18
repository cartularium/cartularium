// Co-host screen — the conservative static analysis of formula TEXT that the
// packing planner uses to decide how a task may share a host. Two ratified
// consumers (seeding doc §5.2 lump screen; charter §8 co-host-safety):
//
//   - LUMP screen: dense-pack a task into a shared chunk ONLY when its formula is
//     statically reference-free ∧ position-insensitive (no A1/R1C1 tokens, no
//     ROW()/COLUMN()/CELL/OFFSET/INDIRECT). Everything else probes IN-PLACE at its
//     own seeded cell so context-sensitivity dissolves.
//   - ISOLATE: a formula whose reach can't be statically bounded — INDIRECT /
//     OFFSET — defeats static co-host analysis (we can't know which cells it
//     reads), so it can't be safely co-hosted. Route it to ISOLATION (the isolation
//     contract, §6 / D3-D4), the same mode misbehaving tasks use (charter §8). This
//     screen is the AUTOMATIC safety floor: on the frozen author-less corpus no
//     declared tag is ever set, so co-host safety MUST NOT hinge on a tag — it rests
//     here ("annotations are never load-bearing", §5.3 Move 5 / unifying principle).
//
// The screen is OVER-APPROXIMATE in the safe direction: a false "unsafe" costs one
// un-lumped or isolated task, never wrong data — the same cost-not-truth posture
// as the read model. It is a text analysis (no parser): string literals are
// stripped so `"A1"` / `"INDIRECT"` inside a string don't masquerade as a
// reference or an opaque call, and function-call names are removed before
// reference-scanning so digits inside a name (LOG10, ATAN2) aren't read as cell
// refs. This screen MUST stay name-based (arch-review m3): an INDIRECT/OFFSET with a
// COMPUTED argument — e.g. `INDIRECT(A1&"!B2")` over a seeded A1 — is not statically
// foldable, and "relaxing to constant-foldable args may co-host" would reopen the
// silent value-contamination hole §6.1 exists for. Conservative by mandate.

/** Functions whose value depends on WHERE the formula sits (position-sensitive). */
export const POSITION_FNS: ReadonlySet<string> = new Set([
  "ROW",
  "COLUMN",
  "CELL",
  "OFFSET",
  "INDIRECT",
  "ADDRESS",
]);

/** Functions whose reach can't be statically bounded ⇒ unsafe to co-host (charter §8). */
export const OPAQUE_REF_FNS: ReadonlySet<string> = new Set(["INDIRECT", "OFFSET"]);

/** Functions whose value is nondeterministic per evaluation (excluded from drift). */
export const VOLATILE_FNS: ReadonlySet<string> = new Set([
  "NOW",
  "TODAY",
  "RAND",
  "RANDBETWEEN",
  "RANDARRAY",
]);

const STRING_LITERAL = /"(?:[^"]|"")*"/g;
const FN_CALL = /([A-Za-z_][A-Za-z0-9_.]*)\s*\(/g;
const A1_REF = /\$?[A-Za-z]{1,3}\$?[0-9]+/; // cell / range start, e.g. A1 $A$1 AA10
const COL_RANGE = /\b[A-Za-z]{1,3}:[A-Za-z]{1,3}\b/; // whole column A:A
const ROW_RANGE = /\b[0-9]+:[0-9]+\b/; // whole row 1:1
const R1C1_REF = /\bR\[?-?[0-9]*\]?C\[?-?[0-9]*\]?\b/; // R1C1 / R[-1]C[2] / RC

export interface FormulaFacts {
  /** Upper-cased names of functions called, in source order (duplicates kept). */
  functionsUsed: string[];
  /** Any A1/R1C1 cell, range, or whole row/column token (string literals excluded). */
  hasReferences: boolean;
  /** Uses a position-sensitive function ⇒ moving the formula changes its value. */
  positionSensitive: boolean;
  /** Uses INDIRECT/OFFSET ⇒ reach unbounded by static analysis (charter §8). */
  opaqueReference: boolean;
  /** Uses a nondeterministic-value function (NOW/RAND family). */
  volatile: boolean;
}

/** Conservative static facts about a formula's text. See module header. */
export function analyzeFormula(formula: string): FormulaFacts {
  const noStrings = formula.replace(STRING_LITERAL, '""');
  const functionsUsed = [...noStrings.matchAll(FN_CALL)].map((m) => m[1].toUpperCase());
  const fnSet = new Set(functionsUsed);
  // Drop the function-call NAMES so digits inside them aren't read as cell refs.
  const residual = noStrings.replace(FN_CALL, "(");
  const hasReferences =
    A1_REF.test(residual) ||
    COL_RANGE.test(residual) ||
    ROW_RANGE.test(residual) ||
    R1C1_REF.test(residual);
  return {
    functionsUsed,
    hasReferences,
    positionSensitive: [...fnSet].some((f) => POSITION_FNS.has(f)),
    opaqueReference: [...fnSet].some((f) => OPAQUE_REF_FNS.has(f)),
    volatile: [...fnSet].some((f) => VOLATILE_FNS.has(f)),
  };
}

/** How a task may share a host (the packing planner's per-formula decision). */
export type CoHostPlacement = "lump" | "in-place" | "isolate";

/**
 * Route a formula to a co-hosting placement:
 * - `isolate`  — opaque reach (INDIRECT/OFFSET); can't be safely co-hosted (charter §8)
 * - `lump`     — reference-free ∧ position-insensitive ∧ NO seeded input; dense-pack (§5.2)
 * - `in-place` — has references / is position-sensitive / carries seeded input
 *
 * Order matters: opaque references are also position-sensitive, so the isolate
 * check comes first (isolation is strictly stronger than in-place).
 *
 * `hasInput` = the task carries grid seeds. A task with seeded input CANNOT be
 * co-tiled even when its formula is reference-free: its seeds occupy input/staging
 * cells which, on a SHARED host, collide with a co-tenant's tile. The decisive case
 * (found via the tiled-vs-untiled corpus check, 2026-06-15): a spill-block test —
 * `=SEQUENCE(...)` (reference-free ⇒ looked lumpable) with a `{"blocker"}` grid — bled
 * its blocker seeds into a co-tiled lump's read window. Formula text alone can't see
 * this, so the placement must consider the task's input.
 */
export function coHostPlacement(formula: string, hasInput = false): CoHostPlacement {
  const f = analyzeFormula(formula);
  if (f.opaqueReference) return "isolate";
  if (hasInput) return "in-place";
  if (!f.hasReferences && !f.positionSensitive) return "lump";
  return "in-place";
}

/** True iff a task is safe to dense-lump (the §5.2 lump screen). `hasInput` = it
 * carries grid seeds, which forces its own host (the seeds would collide co-tiled). */
export function isLumpable(formula: string, hasInput = false): boolean {
  return coHostPlacement(formula, hasInput) === "lump";
}

/** True iff `formula` must be isolated rather than co-hosted (charter §8). */
export function requiresIsolation(formula: string): boolean {
  return analyzeFormula(formula).opaqueReference;
}
