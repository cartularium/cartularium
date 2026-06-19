// per-engine capability + fork profile, pairwise co-classing, fork-shapes
//
// Default reporting is the verdict-free agreement matrix over OBSERVED Outcomes
// (agreement-matrix.ts). `--seed-catalogue` stays on the quarantined,
// override-based divergence-matrix (it feeds DV identity, re-founded on observed
// forks in the next checkpoint).

import { basename } from "node:path";
import {
  computeAgreementMatrix,
  jsonAgreementMatrix,
  printAgreementMatrix,
  AGREEMENT_VIEWS,
  type AgreementView,
} from "../agreement-matrix.js";
import { computeMatrix, seedCatalogue } from "../divergence-matrix.js";
import { loadFixtureOutcomes, loadTests, type TestInfo } from "../catalogue-site/load.js";
import { resolveFiles, values } from "./shared.js";

export function matrix(args: string[]): void {
  const files = resolveFiles(args);
  if (!files.length) {
    console.error("matrix: no test files matched (looked in tests/*.yaml)");
    process.exit(1);
  }

  // --seed-catalogue: the quarantined override-based path (DV-identity, retires
  // with the authoring layer). Unchanged.
  const seedDir = values["seed-catalogue"] as string | undefined;
  if (seedDir) {
    try {
      const result = seedCatalogue(computeMatrix(files), seedDir, { force: values.force as boolean });
      console.log(`Seeded ${result.filesWritten} divergence file(s) into ${result.dir}/`);
      console.log(`  range: ${result.firstId} … ${result.lastId}`);
    } catch (e) {
      console.error(`seed-catalogue: ${(e as Error).message}`);
      process.exit(1);
    }
    return;
  }

  const view = (values.view as string | undefined) ?? "headline";
  if (!(AGREEMENT_VIEWS as readonly string[]).includes(view)) {
    console.error(`matrix: --view must be one of ${AGREEMENT_VIEWS.join("|")} (got ${view})`);
    process.exit(2);
  }

  const limitStr = values.limit as string | undefined;
  const limit = limitStr ? parseInt(limitStr, 10) : undefined;
  if (limitStr && (Number.isNaN(limit!) || limit! <= 0)) {
    console.error(`matrix: --limit must be a positive integer (got ${limitStr})`);
    process.exit(2);
  }

  const testsDir = (values["tests-dir"] as string | undefined) ?? "tests";
  const suites = new Set(files.map((f) => basename(f).replace(/\.yaml$/, "")));
  const tests = scopeToSuites(loadTests(testsDir), suites);
  const outcomes = loadFixtureOutcomes("fixtures", tests);
  const report = computeAgreementMatrix(tests, outcomes);

  if (values.json) {
    console.log(jsonAgreementMatrix(report));
    return;
  }
  printAgreementMatrix(report, { view: view as AgreementView, limit, verbose: values.verbose as boolean });
}

// keep only tests whose suite was named by the resolved file list (the no-arg
// case globs every suite, so this is a no-op there)
function scopeToSuites(tests: Map<string, TestInfo>, suites: Set<string>): Map<string, TestInfo> {
  const out = new Map<string, TestInfo>();
  for (const [k, t] of tests) if (suites.has(t.suite)) out.set(k, t);
  return out;
}
