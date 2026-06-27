// report fork-annotation coverage: the published manifest's forks × the annotation store
//
// A derived read (annotation-store-design-2026-06-20.md §6, 3d). Builds ManifestV5 fresh (mirrors
// `assay manifest`/`matrix`) and joins its forks against an annotations snapshot — an export of
// GET /api/edit/assay/fork-annotations (the `{annotations:[…]}` body, or a bare array). Each scoped
// case-ref is classified live-fork / converged / dangling (R3); the inverse is the uncovered-fork
// contribution work-list. The join is the shared contracts primitive `computeForkCoverage`; this is
// CLI glue + a text report. The live edit-shell endpoint (which needs the manifest delivered into
// the Worker) and the sheets-wiki render ride the website rework (#4).

import { readFileSync } from "node:fs";
import { computeForkCoverage } from "@cartularium/contracts";
import type { AssayForkAnnotationV1, ForkCoverageReport } from "@cartularium/contracts";
import { buildManifestV5 } from "../manifest/build-v5.js";
import { loadDvs, loadFixtureOutcomes, loadTests } from "../catalogue-site/load.js";
import { values } from "./shared.js";

const LIST_CAP = 40;

// accept either the GET body `{ annotations: [...] }` or a bare array
function parseAnnotations(raw: string): AssayForkAnnotationV1[] {
  const parsed = JSON.parse(raw);
  const arr = Array.isArray(parsed) ? parsed : parsed?.annotations;
  if (!Array.isArray(arr)) {
    throw new Error("expected a JSON array of annotations or a { annotations: [...] } body");
  }
  return arr as AssayForkAnnotationV1[];
}

export function annotationCoverage(): void {
  const catalogueDir = (values["catalogue-dir"] as string | undefined) ?? "divergences";
  const testsDir = (values["tests-dir"] as string | undefined) ?? "tests";
  const annotationsPath = values["annotations"] as string | undefined;

  if (!annotationsPath) {
    console.error(
      "annotation-coverage: --annotations <file.json> required (an export of GET /api/edit/assay/fork-annotations)",
    );
    process.exit(1);
  }

  try {
    const annotations = parseAnnotations(readFileSync(annotationsPath, "utf8"));
    const dvs = loadDvs(catalogueDir);
    const tests = loadTests(testsDir);
    const outcomes = loadFixtureOutcomes("fixtures", tests);
    const manifest = buildManifestV5({ dvs, tests, outcomes, generatedAt: new Date().toISOString() });
    const report = computeForkCoverage(manifest, annotations);

    if (values.json) {
      process.stdout.write(JSON.stringify(report, null, 2) + "\n");
    } else {
      printReport(report);
    }
  } catch (e) {
    console.error(`annotation-coverage: ${(e as Error).message}`);
    process.exit(1);
  }
}

function printList(label: string, items: string[]): void {
  console.log(`\n${label} (${items.length}):`);
  for (const item of items.slice(0, LIST_CAP)) console.log(`  ${item}`);
  if (items.length > LIST_CAP) console.log(`  … (+${items.length - LIST_CAP} more)`);
}

function printReport(report: ForkCoverageReport): void {
  const t = report.totals;
  const pct = t.forks ? ((t.coveredForks / t.forks) * 100).toFixed(1) : "0.0";
  console.log("fork-annotation coverage");
  console.log(`  forks: ${t.forks}   covered: ${t.coveredForks} (${pct}%)   uncovered: ${t.uncoveredForks}`);
  console.log(`  annotations: ${t.annotations}   without a live fork: ${t.annotationsWithoutLiveFork}`);

  const flagged = report.annotations.filter((a) => !a.coversLiveFork && (a.converged.length || a.dangling.length));
  if (flagged.length) {
    console.log(`\nannotations covering no live fork (${flagged.length}):`);
    for (const a of flagged.slice(0, LIST_CAP)) {
      console.log(`  ${a.id}  converged=${a.converged.length} dangling=${a.dangling.length} predicates=${a.unresolvedPredicateClauses}`);
    }
    if (flagged.length > LIST_CAP) console.log(`  … (+${flagged.length - LIST_CAP} more)`);
  }

  printList("uncovered forks (contribution prompts)", report.uncoveredForks);
}
