// Divergence-measurement: fixtures → outcome rows (the impure bridge).
//
// Reads the recorded per-engine fixtures, classifies each (probe × engine) cell
// (ok / unimplemented / hole), and reduces the foreign pair to a single outcome
// per probe. Holes never masquerade as agreement; a driver-level skip/“not
// implemented” is a real (syntactic) UNIMPLEMENTED outcome, but a *computed*
// cell `#N/A` is a value (VLOOKUP not-found), never unimplemented.

import { behaviorSignature } from "../divergences/cluster.js";
import { gridsEqual } from "../format/match.js";
import { outcomeErrorText, toScalarGrid, type GridValue } from "../format/values.js";
import type { FixtureFile } from "../fixtures.js";
import type { Assignment } from "./family.js";
import { AGREE_TARGET, type OutcomeRow } from "./analyze.js";

export type EngineOutcome =
  | { kind: "ok"; signature: string; grid: GridValue }
  | { kind: "unimplemented" }
  | { kind: "hole"; reason: string };

// driver-LEVEL "not implemented" only (entry.error / skipped). A computed cell
// error in entry.result is a value and is handled by the ok path.
const DRIVER_UNIMPL_RE = /#NAME\?|#N\/IMPL!|not.?impl|unsupported/i;

export function classifyEntry(entry: FixtureFile["results"][string] | undefined): EngineOutcome {
  if (!entry) return { kind: "hole", reason: "missing fixture entry" };
  const o = entry.outcome;
  if (o.kind === "skipped") return { kind: "unimplemented" };
  if (o.kind !== "value") {
    // §6.6: a non-value outcome is driver-level (rejected/crashed/infra/...). An
    // engine-emitted #NAME?/#N/IMPL! is a *value* (in-cell error) and takes the ok
    // path below; this branch keeps the driver-level unimplemented-vs-hole split.
    const msg = outcomeErrorText(o) ?? o.kind;
    return DRIVER_UNIMPL_RE.test(msg) ? { kind: "unimplemented" } : { kind: "hole", reason: msg };
  }
  const grid = toScalarGrid(o.grid);
  return { kind: "ok", signature: behaviorSignature(grid), grid };
}

export type ForeignOutcome =
  | "agree"
  | "differ"
  | "unimpl-a"
  | "unimpl-b"
  | "both-unimpl"
  | "incomplete";

export interface ForeignPair {
  a: string; // e.g. "excel"
  b: string; // e.g. "gsheets"
}

/** Reduce the foreign pair to one outcome. Agreement is tolerance-aware
 * (gridsEqual) — matching assay's default divergence semantics; a within-tol
 * difference is `agree` but flagged `precision`. */
export function foreignOutcome(
  oa: EngineOutcome,
  ob: EngineOutcome,
  tol: number,
): { outcome: ForeignOutcome; precision: boolean } {
  if (oa.kind === "hole" || ob.kind === "hole") return { outcome: "incomplete", precision: false };
  if (oa.kind === "unimplemented" && ob.kind === "unimplemented") {
    return { outcome: "both-unimpl", precision: false };
  }
  if (oa.kind === "unimplemented") return { outcome: "unimpl-a", precision: false };
  if (ob.kind === "unimplemented") return { outcome: "unimpl-b", precision: false };
  if (gridsEqual(oa.grid, ob.grid, tol)) {
    return { outcome: "agree", precision: oa.signature !== ob.signature };
  }
  return { outcome: "differ", precision: false };
}

export interface ProbeRow {
  caseKey: string;
  name: string;
  assignment: Assignment;
  outcomes: Record<string, EngineOutcome>;
  foreign: ForeignOutcome;
  precision: boolean;
}

/** parse `ax:<axis>=<setting>` tags back into an assignment vector. */
export function parseAssignment(tags: string[]): Assignment {
  const out: Assignment = {};
  for (const tag of tags) {
    if (!tag.startsWith("ax:")) continue;
    const eq = tag.indexOf("=");
    if (eq < 0) continue;
    out[tag.slice(3, eq)] = tag.slice(eq + 1);
  }
  return out;
}

export interface LoadedProbe {
  caseKey: string;
  name: string;
  tags: string[];
}

// both-unimpl reads as "no porting question" (absent on both) → not a divergence.
function toTarget(o: ForeignOutcome): string {
  return o === "both-unimpl" ? AGREE_TARGET : o;
}

export interface BuildRowsResult {
  rows: ProbeRow[];
  outcomeRows: OutcomeRow[];
  precisionCount: number;
}

export function buildRows(
  probes: LoadedProbe[],
  fixtures: Record<string, FixtureFile | null>,
  pair: ForeignPair,
  tol: number,
): BuildRowsResult {
  const rows: ProbeRow[] = [];
  const outcomeRows: OutcomeRow[] = [];
  let precisionCount = 0;

  for (const probe of probes) {
    const oa = classifyEntry(fixtures[pair.a]?.results[probe.caseKey]);
    const ob = classifyEntry(fixtures[pair.b]?.results[probe.caseKey]);
    const { outcome, precision } = foreignOutcome(oa, ob, tol);
    if (precision) precisionCount++;

    const assignment = parseAssignment(probe.tags);
    rows.push({
      caseKey: probe.caseKey,
      name: probe.name,
      assignment,
      outcomes: { [pair.a]: oa, [pair.b]: ob },
      foreign: outcome,
      precision,
    });
    outcomeRows.push({
      assignment,
      target: toTarget(outcome),
      incomplete: outcome === "incomplete",
    });
  }

  return { rows, outcomeRows, precisionCount };
}
