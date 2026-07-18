// Divergence-measurement: the portability verdict (pure).
//
// Turns a reduct analysis + the per-axis loci into a portability classification
// (bridge-translation §6). The governing rule: a static rewrite/guard can only
// key off what is visible without running — so syntactic and environment
// discriminators are statically resolvable (rewrite vs. config), while a
// data-borne discriminator is the wall (total-decompose / runtime-guard /
// author-flag). The verdict is keyed on the cheapest reduct's loci.

import type { Axis, AxisLocus } from "./family.js";
import { AGREE_TARGET, triggerDNF, type OutcomeRow, type ReductResult } from "./analyze.js";

export type VerdictKind =
  | "AGREES_EVERYWHERE"
  | "EXPLICIT_BRIDGE" // statically carve-able (rewrite and/or config)
  | "IRREDUCIBLE" // a data-borne discriminator remains
  | "ABORTED"; // uncontrolled variable — no honest verdict

export interface Verdict {
  kind: VerdictKind;
  subject: string;
  // the reduct the verdict is keyed on (the chosen explanation).
  discriminators?: string[];
  byLocus?: Record<AxisLocus, string[]>;
  // assignments (over the reduct) where engines do NOT agree, with the outcome.
  trigger?: Array<{ where: Record<string, string>; outcome: string }>;
  // EXPLICIT_BRIDGE: how to fix, split by locus.
  fix?: { rewriteOn?: string[]; configOn?: string[]; note?: string };
  // IRREDUCIBLE: the static sub-region needing handling + the residual runtime axes.
  staticNarrowing?: string[];
  residualDataBorne?: string[];
  option?: "runtime-guard" | "author-flag";
  // honesty signals.
  completeness: number; // ok / (ok + incomplete) over the foreign pair
  provisional: boolean; // completeness < 1, or a pinned data-borne/env axis
  pinnedAxes?: Array<{ axis: string; locus: AxisLocus }>;
  // the incompatibility-surface magnitude for this family.
  surface: {
    okProbes: number;
    divergentProbes: number;
    divergentFraction: number;
    // for IRREDUCIBLE: number of distinct data-borne divergence regions.
    irreducibleRegions?: number;
  };
  reason?: string; // ABORTED detail
}

function lociOf(reduct: string[], byName: Map<string, Axis>): Record<AxisLocus, string[]> {
  const out: Record<AxisLocus, string[]> = { syntactic: [], environment: [], "data-borne": [] };
  for (const axis of reduct) {
    const a = byName.get(axis);
    if (a) out[a.locus].push(axis);
  }
  return out;
}

/** cheapest reduct: fewest axes, then fewest data-borne, then fewest total. */
function pickStaticReduct(reducts: string[][], byName: Map<string, Axis>): string[] | null {
  const statics = reducts.filter((r) => lociOf(r, byName)["data-borne"].length === 0);
  if (statics.length === 0) return null;
  return statics.slice().sort((a, b) => a.length - b.length)[0];
}

function pickSmallest(reducts: string[][]): string[] {
  return reducts.slice().sort((a, b) => a.length - b.length)[0];
}

export function decideVerdict(
  subject: string,
  analysis: ReductResult,
  axes: Axis[],
  okRows: OutcomeRow[],
): Verdict {
  const byName = new Map(axes.map((a) => [a.name, a]));
  const completeness =
    analysis.okCount + analysis.incompleteCount === 0
      ? 1
      : analysis.okCount / (analysis.okCount + analysis.incompleteCount);

  const pinnedAxes = axes
    .filter((a) => (analysis.cardinality[a.name] ?? 0) <= 1)
    .map((a) => ({ axis: a.name, locus: a.locus }));
  const pinnedRisk = pinnedAxes.some((p) => p.locus === "data-borne" || p.locus === "environment");

  const surface = {
    okProbes: analysis.okCount,
    divergentProbes: analysis.divergeCount,
    divergentFraction:
      analysis.okCount === 0 ? 0 : Math.round((analysis.divergeCount / analysis.okCount) * 1000) / 1000,
  };

  const base = {
    subject,
    completeness,
    provisional: completeness < 1 || pinnedRisk,
    pinnedAxes,
    surface,
  };

  if (analysis.purityViolation) {
    return {
      ...base,
      kind: "ABORTED",
      reason:
        `uncontrolled variable: rows with identical axis assignment ` +
        `(${JSON.stringify(analysis.purityViolation.assignment)}) gave different outcomes ` +
        `[${analysis.purityViolation.targets.join(", ")}]`,
    };
  }

  // Constant outcome over ok rows (the empty reduct).
  if (analysis.constantTarget !== undefined) {
    if (analysis.constantTarget === AGREE_TARGET) {
      return { ...base, kind: "AGREES_EVERYWHERE", discriminators: [] };
    }
    // Unconditional divergence — no data dependence → statically decidable.
    return {
      ...base,
      kind: "EXPLICIT_BRIDGE",
      discriminators: [],
      trigger: [{ where: {}, outcome: analysis.constantTarget }],
      fix: { note: `diverges unconditionally (${analysis.constantTarget}); whole-function rewrite` },
    };
  }

  // Prefer a statically-resolvable explanation if one exists.
  const staticReduct = pickStaticReduct(analysis.reducts, byName);
  if (staticReduct) {
    const loci = lociOf(staticReduct, byName);
    return {
      ...base,
      kind: "EXPLICIT_BRIDGE",
      discriminators: staticReduct,
      byLocus: loci,
      trigger: triggerDNF(staticReduct, okRows),
      fix: {
        rewriteOn: loci.syntactic.length ? loci.syntactic : undefined,
        configOn: loci.environment.length ? loci.environment : undefined,
      },
    };
  }

  // Every reduct carries a data-borne axis → irreducible at the static level.
  const reduct = pickSmallest(analysis.reducts);
  const loci = lociOf(reduct, byName);
  const residual = loci["data-borne"];
  const staticNarrowing = [...loci.syntactic, ...loci.environment];
  const allCheckable = residual.every((name) => byName.get(name)?.runtimeCheckable === true);
  const trigger = triggerDNF(reduct, okRows);

  return {
    ...base,
    kind: "IRREDUCIBLE",
    discriminators: reduct,
    byLocus: loci,
    trigger,
    staticNarrowing: staticNarrowing.length ? staticNarrowing : undefined,
    residualDataBorne: residual,
    option: allCheckable ? "runtime-guard" : "author-flag",
    surface: { ...surface, irreducibleRegions: trigger.length },
  };
}
