// O4 two-phase probe-en-masse — the gsheets read strategy under the O3 contract
// (seeding doc §5.2, GREENLIT 2026-06-14). Phase 1 measures extent BEFORE
// materializing: each task's formula F is wrapped in a scalar-collapsing COMPOSITE
// PROBE that returns one string encoding the engine-authoritative extent
// (rows × cols) plus a blank census (COUNTA / COUNTBLANK). Phase 2 then places the
// real formulas with packing planned from the known extents (`routeByExtent`).
//
// Why it matters (increasing importance, §5.2):
//   1. packing density — measure before you buy the host.
//   2. engine-authoritative extent — the phase-2 read range derives from a
//      declared extent, killing the semantic-null / trailing-blank ambiguity that
//      the wire representation can't resolve (the E5 solution).
//   3. crash screening — poison surfaces in cheap phase-1 hosts (AFL-prefilter).
//   4. the budget gate moves AHEAD of materialization — because the probe collapses
//      any spill to a scalar, `=ROWS(SEQUENCE(1e6))` is a scalar, so a T2 monster's
//      grid is never placed (capacity-safe, not capacity-spending).
//
// Composable with the co-host screen (cohost.ts): probe only where extent is in
// question. Open gating probe (§5.2): the composite-probe collapse behaviour live
// — ROWS/COUNTA over big arrays, and error propagation into the probe cell (an
// erroring F makes the probe return that error, not the reading; parsed as null).

import {
  projectScalarGrid,
  type CellValue,
  type RichGridValue,
} from "../../format/values.js";
import type { Extent } from "./read-model.js";

/** The LET binding name for the wrapped result. Underscore-prefixed to avoid
 *  colliding with a named range the formula might reference. */
const PROBE_BINDING = "_r";

/**
 * Wrap a formula in the scalar-collapsing composite probe. The result is a single
 * string `d:<rows>x<cols>;n:<counta>;b:<countblank>` — see `parseProbeReading`.
 * The leading `=` of the input (if any) is stripped before wrapping.
 */
export function compositeProbeFormula(formula: string): string {
  const body = formula.replace(/^\s*=/, "").trim();
  const r = PROBE_BINDING;
  return `=LET(${r},${body},"d:"&ROWS(${r})&"x"&COLUMNS(${r})&";n:"&COUNTA(${r})&";b:"&COUNTBLANK(${r}))`;
}

export interface ProbeReading {
  /** Engine-authoritative result extent (ROWS × COLUMNS of the spill). */
  extent: Extent;
  /** Non-blank cell count within the extent (COUNTA). */
  nonBlank: number;
  /** Blank cell count within the extent (COUNTBLANK) — the trailing-blank census. */
  blank: number;
}

const READING = /^d:(\d+)x(\d+);n:(\d+);b:(\d+)$/;

/**
 * Parse a composite-probe result string into a reading. Returns null when the
 * scalar doesn't match — including when an erroring F propagated its error into
 * the probe cell (a non-matching scalar), so callers fall back to the safety net
 * rather than trusting a bogus extent.
 */
export function parseProbeReading(scalar: string): ProbeReading | null {
  const m = READING.exec(scalar.trim());
  if (!m) return null;
  return {
    extent: { rows: Number(m[1]), cols: Number(m[2]) },
    nonBlank: Number(m[3]),
    blank: Number(m[4]),
  };
}

/** The minimal driver slice the probe needs (a structural subset of `Driver`). */
export interface ProbeSubject {
  evaluate(formula: string, grid?: Record<string, CellValue>): Promise<RichGridValue>;
}

/**
 * Phase 1: run the composite probe for `formula` against `subject` and parse the
 * reading. Returns null if the probe didn't yield a parseable extent (e.g. F
 * errored). The returned extent feeds `routeByExtent` to plan phase 2.
 */
export async function probeExtent(
  subject: ProbeSubject,
  formula: string,
  grid?: Record<string, CellValue>,
): Promise<ProbeReading | null> {
  const rich = await subject.evaluate(compositeProbeFormula(formula), grid);
  const scalar = projectScalarGrid(rich)[0]?.[0];
  return typeof scalar === "string" ? parseProbeReading(scalar) : null;
}
