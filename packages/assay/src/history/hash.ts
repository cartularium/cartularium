import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { behaviorSignature } from "../divergences/cluster.js";
import type { FixtureEntry } from "../fixtures.js";

const PREFIX = "sha256:";

// canonical-json sha256, so {a,b} and {b,a} hash identically
export function valueHash(v: unknown): string {
  return PREFIX + sha256(behaviorSignature(v));
}

// Hash only the observable spreadsheet value. Fixture entries may carry
// adapter provenance such as `formula-as-evaluated`; that is useful in diffs
// but must not split equality between engines on the history/compare views.
export function fixtureBehaviorHash(entry: FixtureEntry): string {
  return valueHash(entry.outcome.kind === "value" ? entry.outcome.grid : entry.outcome);
}

// stable key for capabilities snapshots; lets re-derivation skip git
export function capabilitiesHash(dir: string): string {
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort();
  const h = createHash("sha256");
  for (const f of files) {
    h.update(f);
    h.update("\0");
    h.update(readFileSync(join(dir, f)));
    h.update("\0");
  }
  return PREFIX + h.digest("hex");
}

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}
