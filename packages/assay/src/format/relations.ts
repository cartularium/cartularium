// The M3 relation layer — cross-engine, stability, and fidelity relations
// expressed as VERDICT-FREE partitions (no-verdict principle, ratified
// 2026-06-16). assay holds no verdicts; it records relationships. This first
// slice (spec: docs/m3-cross-engine-relation-spec-2026-06-16.md) carries the
// CROSS-ENGINE relation only; the stability and fidelity relations join here
// later (spec §6) and reuse the same partition machinery.
//
// The cross-engine relation is a SYMMETRIC partition of the engines into
// agreement-classes at a chosen rung — no engine is the reference, none is
// "correct." A "fork" is just "more than one class." The symmetry is
// structural: no field encodes correctness/reference, and the partition is
// invariant under permutation of the input engines (the executable guarantee;
// see relations.test.ts). This replaces the old `first`-pivot boolean, which
// smuggled an implicit reference engine.

import { gridsEqual } from "./match.js";
import { toleranceFor } from "./tolerance.js";
import type { Platform, RichGridValue } from "./values.js";

/** One agreement-class: the engines whose results agree at the partition's rung.
 *
 * Carries NO authority. `engines` is an unordered set (sorted only for
 * deterministic output — sorting grants no engine reference status).
 * `representative` is a grid from this class for DISPLAY ONLY; it is not a
 * canonical/correct value. No field encodes correctness or a reference arrow —
 * that invariant is the no-verdict principle made structural (and is grep-able). */
export interface AgreementClass {
  engines: Platform[];
  /** A grid from this class, for display only — carries no reference authority. */
  representative: RichGridValue;
}

/** The default pairwise agreement test: rich-grid equality at the per-pair
 * tolerance — exactly the comparison the old `first`-pivot detection used. */
function agreesByValue(results: Record<string, RichGridValue>) {
  return (a: string, b: string): boolean =>
    gridsEqual(results[a], results[b], toleranceFor(a, b));
}

/** Partition the engines into agreement-classes by union-find over the FULL
 * pairwise agreement graph.
 *
 * Why union-find (not canonical-key bucketing): the relative numeric tolerance
 * is NON-transitive (`a≈b ∧ b≈c ⇏ a≈c`), so honest grouping is the connected
 * components of the "agrees-with" graph. Because every i<j pair is compared and
 * every agreeing pair is unioned, the resulting classes are the graph's
 * connected components — independent of engine order (this is what makes the
 * partition symmetric / pivot-free). A near-tolerance chain CAN therefore merge
 * endpoints that wouldn't pair directly; that is cohort equality, descriptive
 * and not a verdict (spec §5). An exact, transitive canonical-key partition is a
 * future per-test "exact" lens, not the default.
 *
 * Only engines present in `results` participate. No-data engines (skipped /
 * unreadable / non-`value` outcome) are absent upstream and are never folded in
 * as silent members of a value-agreement class (capture ≠ circulation).
 *
 * `equal` defaults to value agreement; inject a predicate for testing. */
export function partitionByAgreement(
  results: Record<string, RichGridValue>,
  equal: (a: string, b: string) => boolean = agreesByValue(results),
): AgreementClass[] {
  const engines = Object.keys(results);

  // union-find — no path compression: at ≤8 engines the find-walk is trivial.
  const parent = new Map<string, string>();
  for (const e of engines) parent.set(e, e);
  const find = (x: string): string => {
    let root = x;
    while (parent.get(root) !== root) root = parent.get(root)!;
    return root;
  };
  const union = (a: string, b: string): void => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };

  // FULL pairwise scan — union every agreeing pair. Connected components are
  // order-independent, so the partition does not depend on a pivot engine.
  for (let i = 0; i < engines.length; i++) {
    for (let j = i + 1; j < engines.length; j++) {
      // Already in the same component → the edge is redundant (a union would be
      // a no-op, and under non-transitive tolerance a `false` here couldn't
      // disconnect them). Skip the expensive equality check.
      if (find(engines[i]) === find(engines[j])) continue;
      if (equal(engines[i], engines[j])) union(engines[i], engines[j]);
    }
  }

  // gather components keyed by root
  const byRoot = new Map<string, string[]>();
  for (const e of engines) {
    const root = find(e);
    const members = byRoot.get(root);
    if (members) members.push(e);
    else byRoot.set(root, [e]);
  }

  // Deterministic, canonical output: engines sorted within each class; classes
  // sorted by their first engine. Sorting is presentation only — it grants no
  // engine authority. Canonical ordering also makes the permutation-invariance
  // guarantee directly deep-equal-checkable.
  const classes: AgreementClass[] = [];
  for (const members of byRoot.values()) {
    const sorted = [...members].sort();
    classes.push({
      engines: sorted as Platform[],
      representative: results[sorted[0]],
    });
  }
  classes.sort((a, b) =>
    a.engines[0] < b.engines[0] ? -1 : a.engines[0] > b.engines[0] ? 1 : 0,
  );
  return classes;
}

/** True iff the partition forks — more than one agreement-class. The class COUNT
 * is the only judgment the relation makes; it flags no class as correct. */
export function isForked(classes: AgreementClass[]): boolean {
  return classes.length > 1;
}
