// fixture layout: fixtures/<suite>/<platform>.json
// per-suite subdirs keep all engines side-by-side for divergence chasing
//
// every outcome is persisted (incl. non-value ones) — the §6.6 attribution
// (value/rejected/crashed/skipped/driver-error/infra/…) is what lets `--missing`
// retry the right ones and `benchmark` exclude the non-attributable.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import {
  isRichGrid,
  legacyToOutcome,
  type GridValue,
  type Outcome,
  type Platform,
  type RichGridValue,
} from "./format/values.js";
import { liftScalarGrid } from "@cartularium/drivers";

export interface FixtureEntry {
  // §6.6 outcome union (FINALIZED 2026-06-15) — replaces {result, error,
  // driverIssue, skipped}, the attributional conflation that drove the benchmark
  // regex. Legacy on-disk fixtures (scalar grids and/or the old shape) are lifted
  // on read by loadFixture so they stay loadable until regenerated.
  outcome: Outcome;
  // exact formula text the engine evaluated (post-adapter wrap)
  // schema §10: makes adapter behaviour debuggable from fixtures alone
  "formula-as-evaluated"?: string;
  // === stability-substrate provenance (fixture v2, approved 2026-07-18) ===
  /** stimulus hash the entry was observed under; a mismatch with the live
   * case is the STALE rule — the entry cannot satisfy a live lookup */
  stimulus?: `sha256:${string}`;
  fingerprint?: `sha256:${string}`;
  fpv?: number;
  /** ledger run that produced this entry; null with preLedger marks data
   * recorded outside the ledger (pre-run-#1 lift, ad-hoc generate) */
  run_id?: string | null;
  /** observation instant, when the ledger recorded one */
  at?: string | null;
  preLedger?: true;
}

export interface FixtureFile {
  /** 2 = stability-substrate format, results keyed by DECLARED id with
   * per-entry provenance; absent = v1, keyed by semanticHash, read through
   * the retained legacy lift until the hibernation item lands */
  schemaVersion?: 2;
  platform: Platform;
  generatedAt: string;
  results: Record<string, FixtureEntry>;
}

// the legacy persisted shape (pre-§6.6), lifted on read
export interface LegacyEntry {
  outcome?: Outcome;
  result?: RichGridValue;
  error?: string;
  driverIssue?: boolean;
  skipped?: string;
  "formula-as-evaluated"?: string;
}

// Lift one persisted fixture entry to its §6.6 Outcome. New fixtures already
// carry `.outcome`; old ones carry {result, error, driverIssue, skipped} and/or
// a legacy scalar grid (lifted to rich first). The single source for the
// back-compat lift — shared by loadFixture and the manifest's outcome loader.
export function liftEntryToOutcome(entry: LegacyEntry, platform: Platform): Outcome {
  if (entry.outcome) return entry.outcome;
  let grid = entry.result;
  if (grid && !isRichGrid(grid)) {
    grid = liftScalarGrid(grid as unknown as GridValue, platform);
  }
  return legacyToOutcome({
    result: grid,
    error: entry.error,
    driverIssue: entry.driverIssue,
    skipped: entry.skipped,
  });
}

export function fixturePath(testFilePath: string, platform: Platform): string {
  const root = join(dirname(testFilePath), "..", "fixtures");
  const suite = basename(testFilePath, ".yaml");
  return join(root, suite, `${platform}.json`);
}

export function loadFixture(testFilePath: string, platform: Platform): FixtureFile | null {
  const path = fixturePath(testFilePath, platform);
  if (!existsSync(path)) return null;
  const raw = JSON.parse(readFileSync(path, "utf8")) as {
    schemaVersion?: number;
    platform: Platform;
    generatedAt: string;
    results: Record<string, LegacyEntry>;
  };
  if (raw.schemaVersion === 2) {
    // v2 is strict: entries carry `.outcome` and provenance; no lifting.
    for (const [id, entry] of Object.entries(raw.results)) {
      if (!entry.outcome) {
        throw new Error(`${path}: v2 fixture entry ${id} has no outcome — refusing to lift a v2 file`);
      }
    }
    return {
      schemaVersion: 2,
      platform: raw.platform,
      generatedAt: raw.generatedAt,
      results: raw.results as Record<string, FixtureEntry>,
    };
  }
  if (raw.schemaVersion !== undefined) {
    throw new Error(`${path}: unknown fixture schemaVersion ${raw.schemaVersion}`);
  }
  // v1 legacy path — the RETAINED read-only lift (stability substrate,
  // decision point 8): hibernated engines' files stay v1 fossils, keyed by
  // semanticHash, until the hibernation item lands. {result, error,
  // driverIssue, skipped} and/or legacy scalar grids lift to §6.6 Outcomes.
  const results: Record<string, FixtureEntry> = {};
  for (const [name, entry] of Object.entries(raw.results)) {
    results[name] = { outcome: liftEntryToOutcome(entry, platform) };
    if (entry["formula-as-evaluated"])
      results[name]["formula-as-evaluated"] = entry["formula-as-evaluated"];
  }
  return { platform: raw.platform, generatedAt: raw.generatedAt, results };
}

// persists every outcome so downstream tooling sees the full attribution.
// tally: ok = clean values; driverIssue = non-value, non-skipped outcomes
// (rejected/crashed/driver-error/infra/…); skipped = skip-tag entries.
export function saveFixture(
  testFilePath: string,
  platform: Platform,
  results: Record<string, FixtureEntry>,
  opts: { prune?: boolean } = {},
): { path: string; ok: number; driverIssue: number; skipped: number } {
  const path = fixturePath(testFilePath, platform);
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  let ok = 0;
  let driverIssue = 0;
  let skipped = 0;

  const clean: Record<string, FixtureEntry> = {};
  for (const [name, entry] of Object.entries(results)) {
    if (entry.outcome.kind === "skipped") skipped++;
    else if (entry.outcome.kind === "value") ok++;
    else driverIssue++;
    clean[name] = entry;
  }

  // Full regeneration prunes stale entries. Partial regeneration, such as
  // `--missing`, merges so retrying driver failures does not erase good data.
  // Read existing through loadFixture so merged entries are uniformly §6.6-shaped.
  let existing: Record<string, FixtureEntry> = {};
  if (!opts.prune && existsSync(path)) {
    try {
      existing = loadFixture(testFilePath, platform)?.results ?? {};
    } catch {
      // corrupt file — overwrite
    }
  }
  const merged = { ...existing, ...clean };

  const fixture: FixtureFile = {
    schemaVersion: 2,
    platform,
    generatedAt: new Date().toISOString(),
    results: merged,
  };
  writeFileSync(path, JSON.stringify(fixture, null, 2) + "\n");
  return { path, ok, driverIssue, skipped };
}

// true when an entry should be re-queried by `--missing`: our-bug (driver-error)
// and transient (infra) outcomes are retry candidates, and — the STALE rule
// (fixture v2) — so is any entry observed under a different stimulus than the
// live case declares: a revised case's old answer must never satisfy a live
// lookup or silently survive a partial regen. Engine-attributable results
// (value/rejected/crashed) at the live stimulus are real catalogue data.
export function isRetryable(
  entry: FixtureEntry | undefined,
  liveStimulus?: `sha256:${string}`,
): boolean {
  if (!entry) return true;
  if (entry.outcome.kind === "driver-error" || entry.outcome.kind === "infra") return true;
  if (liveStimulus !== undefined && entry.stimulus !== undefined && entry.stimulus !== liveStimulus) {
    return true;
  }
  return false;
}
