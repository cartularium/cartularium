// resolution detection (schema §8): scan per-override `recorded:` for drift,
// --accept rewrites them
// fixtures churn freely; `recorded:` only moves on explicit acceptance

import { readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";
import { parseDocument, isMap, isSeq, type Document, type YAMLMap, type YAMLSeq } from "yaml";
import { loadTestSuite, normalizeToGrid } from "./format/parse.js";
import { gridsEqual, unwrapScalar } from "./format/match.js";
import { toleranceFor } from "./format/tolerance.js";
import { loadFixture } from "./fixtures.js";
import { caseKey } from "./identity/index.js";
import {
  projectScalarGrid,
  type CellValue,
  type GridValue,
  type Platform,
  type RichGridValue,
} from "./format/values.js";
import { type Override } from "./format/catalogue.js";
import type { FixtureEntry } from "./fixtures.js";

export type DriftKind =
  | "drift" // recorded differs from observed
  | "still-matches" // recorded matches observed (common; not flagged)
  | "missing-fixture" // recorded: set but no fixture entry exists
  | "no-recorded"; // override has no recorded: at all (skip)

export interface DriftEntry {
  suiteFile: string;
  suiteName: string;
  testId: string;
  engine: Platform;
  cause: Override["cause"];
  recorded: CellValue | CellValue[][] | undefined;
  /** Observed fixture grid. Rich post-coalescing; gridsEqual projects to scalar
   * internally when comparing against the (scalar) `recorded:` value. */
  observed: RichGridValue | null;
  kind: DriftKind;
}

export interface ResolutionScan {
  entries: DriftEntry[];
  counts: Record<DriftKind, number>;
}

// returns one entry per (test, engine) override
// --accept then replays entries with kind === "drift" against the YAML
export function scanResolutions(suiteFiles: string[]): ResolutionScan {
  const entries: DriftEntry[] = [];
  const counts: Record<DriftKind, number> = {
    drift: 0,
    "still-matches": 0,
    "missing-fixture": 0,
    "no-recorded": 0,
  };

  for (const suiteFile of suiteFiles) {
    const suite = loadTestSuite(suiteFile);
    const fixturesByEngine = new Map<Platform, Record<string, FixtureEntry>>();

    for (const test of suite.tests) {
      if (!test.overrides) continue;
      for (const [engine, ov] of Object.entries(test.overrides) as Array<
        [Platform, Override | undefined]
      >) {
        if (!ov) continue;
        const entry: DriftEntry = {
          suiteFile,
          suiteName: suite.name ?? basename(suiteFile, ".yaml"),
          testId: test.id,
          engine,
          cause: ov.cause,
          recorded: ov.recorded,
          observed: null,
          kind: "no-recorded",
        };
        if (ov.recorded === undefined) {
          counts["no-recorded"]++;
          entries.push(entry);
          continue;
        }
        // lazy-load each engine fixture once per scan
        let fxResults = fixturesByEngine.get(engine);
        if (!fxResults) {
          const fx = loadFixture(suiteFile, engine);
          fxResults = fx?.results ?? {};
          fixturesByEngine.set(engine, fxResults);
        }
        const fxEntry = fxResults[caseKey(test)];
        if (!fxEntry || fxEntry.outcome.kind !== "value") {
          entry.kind = "missing-fixture";
          counts["missing-fixture"]++;
          entries.push(entry);
          continue;
        }
        const fxGrid = fxEntry.outcome.grid;
        entry.observed = fxGrid;
        const recordedGrid = normalizeToGrid(ov.recorded as CellValue | CellValue[][]);
        if (gridsEqual(recordedGrid, fxGrid, toleranceFor(engine))) {
          entry.kind = "still-matches";
          counts["still-matches"]++;
        } else {
          entry.kind = "drift";
          counts["drift"]++;
        }
        entries.push(entry);
      }
    }
  }

  return { entries, counts };
}

export function printDriftReport(scan: ResolutionScan, verbose = false): void {
  const drifts = scan.entries.filter((e) => e.kind === "drift");
  console.log(`\n── Resolution scan ──`);
  console.log(`  overrides examined:   ${scan.entries.length}`);
  console.log(`  recorded matches:     ${scan.counts["still-matches"]}`);
  console.log(`  drift detected:       ${scan.counts.drift}`);
  console.log(`  missing fixtures:     ${scan.counts["missing-fixture"]}`);
  console.log(`  no recorded baseline: ${scan.counts["no-recorded"]}`);

  if (drifts.length > 0) {
    console.log(`\nDrift entries (review whether override still needed):`);
    for (const e of drifts) {
      console.log(`  △ ${e.testId} [${e.engine}, cause=${e.cause}]`);
      console.log(`    recorded: ${formatVal(e.recorded)}`);
      console.log(`    observed: ${formatVal(e.observed)}`);
    }
  }

  if (verbose && scan.counts["missing-fixture"] > 0) {
    console.log(`\nMissing fixtures:`);
    for (const e of scan.entries) {
      if (e.kind === "missing-fixture") {
        console.log(`  ? ${e.testId} [${e.engine}] — no fixture entry`);
      }
    }
  }
}

function formatVal(v: unknown): string {
  if (v === undefined) return "(undefined)";
  return JSON.stringify(v);
}

// --accept: rewrite `recorded:` for drifted overrides
// edits each suite file in place, preserving surrounding formatting
export function acceptDrift(scan: ResolutionScan): {
  filesWritten: string[];
  entriesAccepted: number;
} {
  const drifts = scan.entries.filter((e) => e.kind === "drift");
  if (drifts.length === 0) return { filesWritten: [], entriesAccepted: 0 };

  const bySuite = new Map<string, DriftEntry[]>();
  for (const d of drifts) {
    const arr = bySuite.get(d.suiteFile) ?? [];
    arr.push(d);
    bySuite.set(d.suiteFile, arr);
  }

  const written: string[] = [];
  let count = 0;
  for (const [suiteFile, edits] of bySuite) {
    const text = readFileSync(suiteFile, "utf8");
    const doc = parseDocument(text);
    let mutated = 0;
    for (const e of edits) {
      if (rewriteRecorded(doc, e.testId, e.engine, e.observed!)) {
        mutated++;
      }
    }
    if (mutated > 0) {
      writeFileSync(suiteFile, doc.toString());
      written.push(suiteFile);
      count += mutated;
    }
  }
  return { filesWritten: written, entriesAccepted: count };
}

// returns true if the path was found and updated
function rewriteRecorded(
  doc: Document,
  testId: string,
  engine: Platform,
  observed: RichGridValue,
): boolean {
  const tests = doc.get("tests");
  if (!isSeq(tests)) return false;
  for (const item of (tests as YAMLSeq).items) {
    if (!isMap(item)) continue;
    const id = (item as YAMLMap).get("id");
    if (id !== testId) continue;
    const overrides = (item as YAMLMap).get("overrides");
    if (!isMap(overrides)) return false;
    const ov = (overrides as YAMLMap).get(engine);
    if (!isMap(ov))
      return false;
      // YAML `recorded:` stays scalar — author-facing surface.
    (ov as YAMLMap).set("recorded", unwrapScalar(projectScalarGrid(observed)));
    return true;
  }
  return false;
}
