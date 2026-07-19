// emit the function manifest published at assay.sheets.wiki/manifest.json
//
// Publishes ManifestV5 — the verdict-free comparison output (CP3). The relation
// layer (agreement partition + per-engine capability), no TestVerdict. Consumers
// on the V4 shape (sheets-wiki) are reworked onto V5, not back-compat-bridged.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { ManifestV5 } from "@cartularium/contracts";
import { loadDvs, loadFixtureEntries, loadTests, type TestInfo } from "../catalogue-site/load.js";
import type { FixtureEntry } from "../fixtures.js";
import type { Outcome, Platform } from "../format/values.js";
import { loadLedgerIndex, type LedgerRunStatus } from "../ledger/index-read.js";
import { buildManifestV5 } from "../manifest/build-v5.js";
import { values } from "./shared.js";

const FAILURE_CLASSES = [
  "preledger",
  "unjoined",
  "incomplete-run",
  "no-evidence-row",
  "unknown-run",
] as const;

export type PublicationFailureClass = (typeof FAILURE_CLASSES)[number];

export class PublicationGuardError extends Error {
  constructor(readonly failures: Map<PublicationFailureClass, string[]>) {
    super("fixture publication guard failed");
    this.name = "PublicationGuardError";
  }

  lines(): string[] {
    return FAILURE_CLASSES.flatMap((kind) => {
      const pairs = this.failures.get(kind) ?? [];
      if (pairs.length === 0) return [];
      const shown = [...pairs].sort().slice(0, 10).join(", ");
      const remainder = pairs.length > 10 ? ` (+${pairs.length - 10} more)` : "";
      return [`${kind}: ${pairs.length}; ${shown}${remainder}`];
    });
  }
}

export interface BuildPublicationManifestInput {
  catalogueDir: string;
  testsDir: string;
  fixturesDir: string;
  ledgerPath: string;
  generatedAt: string;
}

function consumedEntries(
  entries: Map<string, Map<Platform, FixtureEntry>>,
  test: TestInfo,
  ref: string,
): Map<Platform, FixtureEntry> | undefined {
  return (
    (test.semanticHash ? entries.get(test.semanticHash) : undefined) ??
    entries.get(ref) ??
    entries.get(test.id)
  );
}

function failureClass(
  entry: FixtureEntry,
  ledger: Map<string, LedgerRunStatus>,
): PublicationFailureClass | undefined {
  if (entry.preLedger !== undefined) return "preledger";
  if (typeof entry.run_id !== "string") return "unjoined";
  const status = ledger.get(entry.run_id);
  if (!status?.run) return "unknown-run";
  if (!status.complete) return "incomplete-run";
  if (!status.evidence) return "no-evidence-row";
  return undefined;
}

export function buildPublicationManifest(input: BuildPublicationManifestInput): ManifestV5 {
  const dvs = loadDvs(input.catalogueDir);
  const tests = loadTests(input.testsDir);
  const entries = loadFixtureEntries(input.fixturesDir, tests);
  const ledger = loadLedgerIndex(input.ledgerPath);
  const failures = new Map<PublicationFailureClass, string[]>();
  const outcomes = new Map<string, Map<Platform, Outcome>>();
  const referencedRunIds = new Set<string>();

  for (const [testKey, test] of tests) {
    const ref = test.ref ?? testKey;
    const byEngine = consumedEntries(entries, test, ref);
    const graded = new Map<Platform, Outcome>();
    for (const [platform, entry] of byEngine ?? []) {
      const failure = failureClass(entry, ledger);
      if (failure) {
        const pairs = failures.get(failure) ?? [];
        pairs.push(`${ref}/${platform}`);
        failures.set(failure, pairs);
        continue;
      }
      referencedRunIds.add(entry.run_id as string);
      graded.set(platform, entry.outcome);
    }
    outcomes.set(ref, graded);
  }

  if (failures.size > 0) throw new PublicationGuardError(failures);

  const provenance: ManifestV5["provenance"] = {
    runs: [...referencedRunIds].sort().map((run_id) => {
      const status = ledger.get(run_id)!;
      const engines: ManifestV5["provenance"]["runs"][number]["engines"] = {};
      for (const [engine, info] of Object.entries(status.run!.engines)) {
        if (!info) continue;
        engines[engine] = {
          driver: info.driver,
          engine_version: info.engine_version,
          conditions: info.conditions,
        };
      }
      return {
        run_id,
        evidence_commit: status.evidence!.commit,
        engines,
      };
    }),
  };

  return buildManifestV5({
    dvs,
    tests,
    outcomes,
    generatedAt: input.generatedAt,
    provenance,
  });
}

export function manifest(): void {
  const catalogueDir = (values["catalogue-dir"] as string | undefined) ?? "divergences";
  const testsDir = (values["tests-dir"] as string | undefined) ?? "tests";
  const output = values.output as string | undefined;

  try {
    const m = buildPublicationManifest({
      catalogueDir,
      testsDir,
      fixturesDir: "fixtures",
      ledgerPath: "history/runs.jsonl",
      generatedAt: new Date().toISOString(),
    });
    const json = JSON.stringify(m, null, 2);

    if (output) {
      mkdirSync(dirname(output), { recursive: true });
      writeFileSync(output, json + "\n");
      console.error(`manifest: wrote ${Object.keys(m.functions).length} functions to ${output}`);
    } else {
      process.stdout.write(json + "\n");
    }
  } catch (e) {
    if (e instanceof PublicationGuardError) {
      for (const line of e.lines()) console.error(`manifest: ${line}`);
    } else {
      console.error(`manifest: ${(e as Error).message}`);
    }
    process.exit(1);
  }
}
