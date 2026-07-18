// generate fixtures by evaluating tests on real engines

import { basename, dirname, resolve } from "node:path";
import { loadTestSuite, resolveFormulaForPlatform } from "../format/index.js";
import { outcomeErrorText, type CellValue, type Platform } from "../format/values.js";
import { evaluateTasks } from "../runner.js";
import type { TestSuite } from "../format/catalogue.js";
import { isRetryable, loadFixture, saveFixture, type FixtureEntry } from "../fixtures.js";
import { caseKey } from "../identity/index.js";
import { cleanupWorkbook, createWorkbook, type WorkbookResult } from "../workbook.js";
import {
  buildDrivers,
  clearProgress,
  mergeRequires,
  parsePlatforms,
  parseTags,
  printPlatformSummary,
  progress,
  resolveFiles,
  values,
  type SuiteTally,
} from "./shared.js";

export async function generate(args: string[]): Promise<void> {
  const files = resolveFiles(args);
  if (!files.length) {
    console.error("generate: no test files matched (looked in tests/*.yaml)");
    process.exit(1);
  }

  const platforms = parsePlatforms();
  const tags = parseTags();
  const onlyMissing = values.missing as boolean;
  const verbose = values.verbose as boolean;
  const quiet = values.quiet as boolean;

  const suites: Array<{ file: string; suite: TestSuite }> = [];
  for (const file of files) suites.push({ file, suite: loadTestSuite(file) });

  let workbook: WorkbookResult | null = null;
  const allRequires = mergeRequires(
    suites.map((s) => ({ dir: dirname(resolve(s.file)), requires: s.suite.requires })),
  );
  if (allRequires && platforms.includes("excel")) {
    if (!quiet) console.log("Installing packages into temp workbook...");
    workbook = await createWorkbook(allRequires.requires, allRequires.baseDir);
    if (!quiet) console.log(`  → ${workbook.path}`);
  }

  const drivers = await buildDrivers(platforms, workbook?.path);

  const tallies: Record<string, Record<string, SuiteTally>> = {};
  const driverIssuesLog: Array<{ platform: string; suite: string; test: string; error: string }> =
    [];

  try {
    for (const driver of drivers) {
      const platform = driver.platform as Platform;

      const fileTasks: Array<{
        file: string;
        suiteName: string;
        tests: Array<{
          id: string;
          key: string;
          formula: string;
          asEvaluated: string;
          grid?: Record<string, CellValue>;
          skip?: string;
        }>;
      }> = [];

      for (const { file, suite } of suites) {
        let tests = tags
          ? suite.tests.filter((t) => t.tags?.some((tag) => tags.includes(tag)))
          : suite.tests;

        if (onlyMissing) {
          const existing = loadFixture(file, platform);
          if (existing) {
            const retry = new Set<string>();
            for (const [id, entry] of Object.entries(existing.results)) {
              if (isRetryable(entry)) retry.add(id);
            }
            tests = tests.filter((t) => {
              const key = caseKey(t);
              return !(key in existing.results) || retry.has(key);
            });
          }
        }

        const resolved: (typeof fileTasks)[number]["tests"] = [];
        for (const t of tests) {
          const r = resolveFormulaForPlatform(t, platform);
          if (r === null) continue;
          resolved.push({
            id: t.id,
            key: caseKey(t),
            formula: r.formula,
            asEvaluated: r.asEvaluated,
            grid: t.grid,
            skip: r.skip ? (r.skipReason ?? "feature absent") : undefined,
          });
        }
        if (resolved.length > 0) {
          fileTasks.push({
            file,
            suiteName: suite.name || basename(file, ".yaml"),
            tests: resolved,
          });
        }
      }

      if (fileTasks.length === 0) {
        if (!quiet) console.log(`  ${platform}: nothing to do`);
        continue;
      }

      const allTasks = fileTasks.flatMap((ft) => ft.tests);
      const started = Date.now();

      // One generation layer over the execution contract (decision 1): batch-vs-single
      // is dispatched inside evaluateTasks, not branched here.
      if (!quiet) progress(`${platform}  running ${allTasks.length} task(s)...`);
      const allOutcomes = await evaluateTasks(
        driver,
        allTasks.map((t) => ({ formula: t.formula, grid: t.grid, ...(t.skip ? { skip: t.skip } : {}) })),
      );
      if (!quiet) clearProgress();

      let offset = 0;
      for (const ft of fileTasks) {
        const entries: Record<string, FixtureEntry> = {};
        for (let i = 0; i < ft.tests.length; i++) {
          const r = allOutcomes[offset + i];
          const { id, key, asEvaluated } = ft.tests[i];
          entries[key] = { outcome: r.outcome, "formula-as-evaluated": asEvaluated };
          // Surface non-value/non-skipped outcomes (rejected/crashed/infra/…) to the log.
          if (r.outcome.kind !== "value" && r.outcome.kind !== "skipped") {
            driverIssuesLog.push({
              platform,
              suite: ft.suiteName,
              test: id,
              error: outcomeErrorText(r.outcome) ?? r.outcome.kind,
            });
          }
        }
        const { ok, driverIssue, skipped } = saveFixture(ft.file, platform, entries, {
          prune: !onlyMissing,
        });
        (tallies[platform] ??= {})[ft.suiteName] = {
          ok,
          driverIssue,
          skipped,
          total: ft.tests.length,
          ms: 0,
        };
        offset += ft.tests.length;
      }
      const msTotal = Date.now() - started;
      const perSuite = msTotal / Math.max(fileTasks.length, 1);
      for (const ft of fileTasks) tallies[platform][ft.suiteName].ms = Math.round(perSuite);

      if (!quiet) printPlatformSummary(platform, tallies[platform]);
    }
  } finally {
    for (const driver of drivers) await driver.destroy();
    if (workbook) cleanupWorkbook(workbook);
  }

  if (driverIssuesLog.length > 0) {
    if (verbose) {
      console.log(`\nDriver issues (${driverIssuesLog.length}):`);
      for (const d of driverIssuesLog) {
        console.log(`  ${d.platform.padEnd(10)} ${d.suite.padEnd(20)} ${d.test}`);
        console.log(`    ${d.error}`);
      }
    } else if (!quiet) {
      console.log(
        `\n${driverIssuesLog.length} driver issue(s) persisted in fixtures (driverIssue: true). Use -v to list.`,
      );
    }
  }
}
