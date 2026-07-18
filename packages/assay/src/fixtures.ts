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
}

export interface FixtureFile {
  platform: Platform;
  generatedAt: string;
  results: Record<string, FixtureEntry>;
}

// the legacy persisted shape (pre-§6.6), lifted on read
interface LegacyEntry {
  outcome?: Outcome;
  result?: RichGridValue;
  error?: string;
  driverIssue?: boolean;
  skipped?: string;
  "formula-as-evaluated"?: string;
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
    platform: Platform;
    generatedAt: string;
    results: Record<string, LegacyEntry>;
  };
  // Back-compat lift-on-read (§6.6): old fixtures carry {result, error,
  // driverIssue, skipped} and/or a legacy scalar grid. Lift the grid to rich,
  // then the whole entry to an Outcome. New fixtures already carry `.outcome`.
  const results: Record<string, FixtureEntry> = {};
  for (const [name, entry] of Object.entries(raw.results)) {
    if (entry.outcome) {
      results[name] = { outcome: entry.outcome };
      if (entry["formula-as-evaluated"])
        results[name]["formula-as-evaluated"] = entry["formula-as-evaluated"];
      continue;
    }
    let grid = entry.result;
    if (grid && !isRichGrid(grid)) {
      grid = liftScalarGrid(grid as unknown as GridValue, platform);
    }
    results[name] = {
      outcome: legacyToOutcome({
        result: grid,
        error: entry.error,
        driverIssue: entry.driverIssue,
        skipped: entry.skipped,
      }),
    };
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
    platform,
    generatedAt: new Date().toISOString(),
    results: merged,
  };
  writeFileSync(path, JSON.stringify(fixture, null, 2) + "\n");
  return { path, ok, driverIssue, skipped };
}

// true when an entry should be re-queried by `--missing`: our-bug (driver-error)
// and transient (infra) outcomes are retry candidates; engine-attributable
// results (value/rejected/crashed) are real catalogue data, not retried.
export function isRetryable(entry: FixtureEntry | undefined): boolean {
  if (!entry) return true;
  return entry.outcome.kind === "driver-error" || entry.outcome.kind === "infra";
}
