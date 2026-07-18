// re-evaluate live and report drift from existing fixtures

import { dirname, resolve } from "node:path";
import { gridsEqual, loadTestSuite } from "../format/index.js";
import { evaluateSuite } from "../runner.js";
import { loadFixture, saveFixture, type FixtureEntry, type FixtureFile } from "../fixtures.js";
import { caseKey } from "../identity/index.js";
import type { Platform } from "../format/values.js";
import type { TestSuite } from "../format/catalogue.js";
import { cleanupWorkbook, createWorkbook, type WorkbookResult } from "../workbook.js";
import {
  buildDrivers,
  mergeRequires,
  parsePlatforms,
  parseTags,
  resolveFiles,
  values,
} from "./shared.js";

export function reconcileValidatedFixture(options: {
  testFile: string;
  platform: Platform;
  existing: FixtureFile | null;
  fresh: Record<string, FixtureEntry>;
  displayNames: Map<string, string>;
  dryRun?: boolean;
  log?: (message: string) => void;
}): number {
  const log = options.log ?? console.log;
  let drifts = 0;

  if (!options.existing) {
    log(
      `  no existing fixture for ${options.platform}, ${options.dryRun ? "would generate" : "generating"}...`,
    );
    if (!options.dryRun) saveFixture(options.testFile, options.platform, options.fresh);
    return Object.keys(options.fresh).length > 0 ? 1 : 0;
  }

  for (const [name, entry] of Object.entries(options.fresh)) {
    const displayName = options.displayNames.get(name) ?? name;
    const old = options.existing.results[name];
    if (!old) {
      log(`    + ${displayName}: new test (not in fixture)`);
      drifts++;
      continue;
    }
    const curVal = entry.outcome.kind === "value" ? entry.outcome.grid : undefined;
    const oldVal = old.outcome.kind === "value" ? old.outcome.grid : undefined;
    if (curVal && oldVal ? !gridsEqual(curVal, oldVal) : entry.outcome.kind !== old.outcome.kind) {
      log(`    △ ${displayName}: drift detected`);
      drifts++;
    }
  }

  if (!options.dryRun) saveFixture(options.testFile, options.platform, options.fresh);
  return drifts;
}

export async function validate(args: string[]): Promise<void> {
  const files = resolveFiles(args);
  if (!files.length) {
    console.error("validate: no test files matched (looked in tests/*.yaml)");
    process.exit(1);
  }

  const platforms = parsePlatforms();
  const tags = parseTags();
  const dryRun = values["dry-run"] as boolean;

  const suites: Array<{ file: string; suite: TestSuite }> = [];
  for (const file of files) suites.push({ file, suite: loadTestSuite(file) });

  let workbook: WorkbookResult | null = null;
  const allRequires = mergeRequires(
    suites.map((s) => ({ dir: dirname(resolve(s.file)), requires: s.suite.requires })),
  );
  if (allRequires && platforms.includes("excel")) {
    console.log("Installing packages into temp workbook...");
    workbook = await createWorkbook(allRequires.requires, allRequires.baseDir);
    console.log(`  → ${workbook.path}`);
  }

  const drivers = await buildDrivers(platforms, workbook?.path);
  let drifts = 0;

  try {
    for (const { file, suite } of suites) {
      const suiteName = suite.name || file;
      const displayNames = new Map(suite.tests.map((test) => [caseKey(test), test.id]));

      for (const driver of drivers) {
        const existing = loadFixture(file, driver.platform);
        if (!existing) {
          const results = await evaluateSuite(suite, driver, { tags });
          drifts += reconcileValidatedFixture({
            testFile: file,
            platform: driver.platform,
            existing,
            fresh: results,
            displayNames,
            dryRun,
          });
          continue;
        }

        console.log(`  validating ${driver.platform} fixtures for ${suiteName}...`);
        const fresh = await evaluateSuite(suite, driver, { tags });

        drifts += reconcileValidatedFixture({
          testFile: file,
          platform: driver.platform,
          existing,
          fresh,
          displayNames,
          dryRun,
        });
      }
    }
  } finally {
    for (const driver of drivers) await driver.destroy();
    if (workbook) cleanupWorkbook(workbook);
  }

  if (drifts > 0 && dryRun)
    console.log(`\n${drifts} drift(s) detected. Fixtures not updated (--dry-run).`);
  else if (drifts > 0) console.log(`\n${drifts} drift(s) detected. Fixtures updated.`);
  else console.log("\nNo drift detected.");
}
