// Divergence-measurement: the reduct analysis (pure — no engines, no fixtures).
//
// Given an outcome table (one row per probe: an axis-assignment + the observed
// cross-engine outcome), find the minimal sets of axes that the outcome depends
// on. This is a Rough-Set *reduct*: a minimal subset R of axes such that the
// outcome is constant on every fiber of the projection to R. Searching subsets
// (not single axes) is what lets it catch interaction — a divergence that
// requires axis A=x AND axis B=y, which §6 says is the common case.
//
// The data model is deliberately abstract (assignment → target string) so the
// analysis is unit-tested against synthetic tables with no live engines.

import type { Assignment } from "./family.js";

export const AGREE_TARGET = "agree";

export interface OutcomeRow {
  assignment: Assignment;
  // the observed outcome class for this probe, e.g. "agree" | "differ" | ...
  target: string;
  // holes (a missing/errored engine on the foreign pair): excluded from the
  // reduct, counted as a coverage gap. Never silently treated as "agree".
  incomplete?: boolean;
}

export interface ReductResult {
  axes: string[]; // the axis universe analyzed
  okCount: number; // rows with a usable (non-incomplete) outcome
  incompleteCount: number;
  agreeCount: number; // ok rows whose target === AGREE_TARGET
  divergeCount: number; // ok rows whose target !== AGREE_TARGET
  cardinality: Record<string, number>; // distinct axis values among ok rows
  // minimal sufficient axis subsets. [[]] (the empty reduct) means the outcome
  // is constant over all ok rows — see `constantTarget`.
  reducts: string[][];
  core: string[]; // intersection of all reducts (indispensable axes)
  // set when the outcome is constant over ok rows (reducts === [[]]).
  constantTarget?: string;
  // set when two ok rows share a full assignment but disagree — an uncontrolled
  // variable. When present, no reduct is computed (verdict must abort).
  purityViolation?: { assignment: Assignment; targets: string[] };
}

// === combinatorics =========================================================

function combinations<T>(items: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (k > items.length) return [];
  const out: T[][] = [];
  const idx = Array.from({ length: k }, (_, i) => i);
  while (true) {
    out.push(idx.map((i) => items[i]));
    let p = k - 1;
    while (p >= 0 && idx[p] === items.length - k + p) p--;
    if (p < 0) break;
    idx[p]++;
    for (let j = p + 1; j < k; j++) idx[j] = idx[j - 1] + 1;
  }
  return out;
}

function isSubset(a: string[], b: string[]): boolean {
  const set = new Set(b);
  return a.every((x) => set.has(x));
}

/** projection of an assignment onto an axis subset, as a stable string key. */
function project(a: Assignment, subset: string[]): string {
  return subset.map((axis) => `${axis}=${a[axis]}`).join("&");
}

/**
 * A subset R is *sufficient* iff no two ok rows share their projection to R but
 * disagree on the target — i.e. target is a function of R alone.
 */
function sufficient(subset: string[], okRows: OutcomeRow[]): boolean {
  const byProjection = new Map<string, string>();
  for (const row of okRows) {
    const key = project(row.assignment, subset);
    const prev = byProjection.get(key);
    if (prev === undefined) byProjection.set(key, row.target);
    else if (prev !== row.target) return false;
  }
  return true;
}

// === the analysis ==========================================================

export function analyzeOutcomes(rows: OutcomeRow[], axes: string[]): ReductResult {
  const okRows = rows.filter((r) => !r.incomplete);
  const incompleteCount = rows.length - okRows.length;

  const cardinality: Record<string, number> = {};
  for (const axis of axes) {
    cardinality[axis] = new Set(okRows.map((r) => r.assignment[axis])).size;
  }

  const agreeCount = okRows.filter((r) => r.target === AGREE_TARGET).length;
  const divergeCount = okRows.length - agreeCount;

  const base = {
    axes,
    okCount: okRows.length,
    incompleteCount,
    agreeCount,
    divergeCount,
    cardinality,
  };

  // Purity precondition: the full axis set must be sufficient. If not, two ok
  // rows are identical on every axis yet disagree — an uncontrolled variable.
  if (okRows.length > 0 && !sufficient(axes, okRows)) {
    const violation = findPurityViolation(okRows, axes);
    return { ...base, reducts: [], core: [], purityViolation: violation };
  }

  // Constant outcome over ok rows → the empty reduct.
  const targets = new Set(okRows.map((r) => r.target));
  if (targets.size <= 1) {
    return { ...base, reducts: [[]], core: [], constantTarget: okRows[0]?.target ?? AGREE_TARGET };
  }

  // Enumerate all minimal sufficient subsets (ascending size; a subset is added
  // only if no already-found reduct is a subset of it).
  const reducts: string[][] = [];
  for (let size = 1; size <= axes.length; size++) {
    for (const subset of combinations(axes, size)) {
      if (reducts.some((red) => isSubset(red, subset))) continue;
      if (sufficient(subset, okRows)) reducts.push(subset);
    }
  }

  const core = reducts.length > 0 ? intersection(reducts) : [];
  return { ...base, reducts, core };
}

function intersection(sets: string[][]): string[] {
  if (sets.length === 0) return [];
  return sets.reduce((acc, s) => acc.filter((x) => s.includes(x)));
}

function findPurityViolation(
  okRows: OutcomeRow[],
  axes: string[],
): { assignment: Assignment; targets: string[] } {
  const byFull = new Map<string, OutcomeRow[]>();
  for (const row of okRows) {
    const key = project(row.assignment, axes);
    (byFull.get(key) ?? byFull.set(key, []).get(key)!).push(row);
  }
  for (const group of byFull.values()) {
    const targets = [...new Set(group.map((r) => r.target))];
    if (targets.length > 1) return { assignment: group[0].assignment, targets };
  }
  // unreachable when called only after sufficient(axes)===false
  return { assignment: {}, targets: [] };
}

/**
 * The triggering condition for a reduct: the projections (over the reduct's
 * axes) whose outcome is not AGREE, with the outcome each maps to. This is the
 * DNF a bridge keys off (or the diagnostic the author sees).
 */
export function triggerDNF(
  reduct: string[],
  okRows: OutcomeRow[],
): Array<{ where: Record<string, string>; outcome: string }> {
  const seen = new Map<string, { where: Record<string, string>; outcome: string }>();
  for (const row of okRows) {
    if (row.target === AGREE_TARGET) continue;
    const key = project(row.assignment, reduct);
    if (seen.has(key)) continue;
    const where: Record<string, string> = {};
    for (const axis of reduct) where[axis] = row.assignment[axis];
    seen.set(key, { where, outcome: row.target });
  }
  return [...seen.values()];
}
