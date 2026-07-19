// Capability ADAPTERS (the generation-layer rewrite half) — reconcile a test's declared
// features against an engine + apply the syntax rewrite. This is the proto-translation
// step (ratified §2.1, bound for interleaf); it STAYS in assay while the capability DATA
// (capability-data.ts) moves to @cartularium/drivers. Imports the data from there.

import type { Platform } from "./values.js";
import { loadCapability, type FeatureCapability } from "@cartularium/drivers";

// per schema §4: any absent → skip; else any wrapped → apply adapter; else native
export type Reconciled =
  | { kind: "native" }
  | { kind: "wrapped"; adapter: FeatureCapability }
  | { kind: "skip"; reason: string };

export function reconcileFeatures(
  features: string[] | undefined,
  engine: Platform,
): Reconciled {
  if (!features || features.length === 0) return { kind: "native" };
  const cap = loadCapability(engine);
  let wrappedAdapter: FeatureCapability | null = null;
  for (const f of features) {
    const fc = cap.features[f];
    if (!fc) {
      // unknown features fail-safe to skip; lint will catch this
      return { kind: "skip", reason: `feature not declared in capabilities/${engine}.json: ${f}` };
    }
    if (fc.support === "absent") {
      return { kind: "skip", reason: `feature absent: ${f}` };
    }
    if (fc.support === "wrapped" && !wrappedAdapter) {
      wrappedAdapter = fc;
    }
  }
  if (wrappedAdapter) return { kind: "wrapped", adapter: wrappedAdapter };
  return { kind: "native" };
}

export function applyAdapter(formula: string, adapter: FeatureCapability): string {
  switch (adapter.adapter) {
    case "arrayformula-wrap": {
      return formula.startsWith("=")
        ? `=ARRAYFORMULA(${formula.slice(1)})`
        : `=ARRAYFORMULA(${formula})`;
    }
    case "prepend": {
      if (!adapter.prepend) return formula;
      return adapter.prepend + formula;
    }
    default:
      return formula;
  }
}
