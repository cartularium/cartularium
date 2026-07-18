import { createHash } from "node:crypto";
import { canonicalJson } from "./semantic-hash.js";

/**
 * The stimulus hash records WHAT AN ENGINE IS ASKED TO DO, nothing else.
 * It is a recorded attribute on results and lockfile entries, never a key:
 * the corpus legitimately contains distinct cases with equal stimuli.
 *
 * Input schema `assay-stimulus-v1` (normative, versioned — a field-set
 * change is an explicit epoch event recorded in the ledger, never a silent
 * re-key):
 *   - formula: the resolved formula (definitions expanded), string or
 *     per-platform map exactly as submitted to drivers, PRE-adapter.
 *     Adapter wrapping and capability reconciliation are driver
 *     provenance, not stimulus.
 *   - grid: the resolved grid (shared $fixture references expanded).
 *   - environment: declared environment demands (test-space charter D-rows:
 *     merged-ness, value-coercing DV, spill obstacles). No case declares
 *     these yet; the slot is reserved so their arrival is a v1 field, not
 *     a version bump.
 *
 * Excluded by decision (approval record 2026-07-18, decision point 3):
 * expect, name, category, status, subject, supportLevel, overrides, tags,
 * links — lens, classification, or presentation, none of them what the
 * engine sees. `features` is also excluded: it drives skip/adapter
 * reconciliation, which is capability provenance recorded per run.
 */
export function stimulusHashForCase(raw: {
  formula: unknown;
  grid?: unknown;
  environment?: unknown;
}): `sha256:${string}` {
  const stimulus: Record<string, unknown> = { formula: raw.formula };
  if (raw.grid !== undefined) stimulus.grid = raw.grid;
  if (raw.environment !== undefined) stimulus.environment = raw.environment;
  const payload = { version: "assay-stimulus-v1", stimulus };
  return `sha256:${createHash("sha256").update(canonicalJson(payload)).digest("hex")}`;
}
