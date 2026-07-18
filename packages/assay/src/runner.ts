import type { Driver } from "@cartularium/drivers";
import {
  valueOutcome,
  outcomeGrid,
  outcomeErrorText,
  type DriverTask,
  type DriverTaskResult,
  type GridValue,
  type Platform,
  type CellValue,
  type RichGridValue,
} from "./format/values.js";
import {
  type TestSuite,
  type TestCase,
  type TestResult,
  type AgreementPartition,
} from "./format/catalogue.js";
import {
  resolveFormulaForPlatform,
  getFormulaForPlatform,
  featureSkipFor,
  effectiveExpect,
  evaluateMatcher,
  partitionByAgreement,
  isForked,
} from "./format/index.js";
import { toleranceFor } from "./format/tolerance.js";
import { liftScalarGrid } from "@cartularium/drivers";
import type { FixtureEntry, FixtureFile } from "./fixtures.js";
import { caseKey } from "./identity/index.js";

export interface RunOptions {
  tags?: string[];
}

export interface RunResult {
  results: TestResult[];
  forks: AgreementPartition[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    recorded: number;
    forks: number;
  };
}

function isBatchDriver(driver: Driver): driver is Driver & Required<Pick<Driver, "evaluateBatch">> {
  return typeof driver.evaluateBatch === "function";
}

/**
 * The single generation layer over the execution contract (ratified §3.2 / decision 1
 * — "one generation layer over the execution contract"). Dispatches batch-vs-single
 * ONCE, so callers (generate, evaluateSuite, …) don't each re-implement it:
 * - a batch driver gets the isolation + amortization guarantee (it also handles
 *   `skip`-tagged tasks itself, returning a `skipped` outcome);
 * - a pure engine falls back to a per-task `evaluate` loop, short-circuiting `skip`
 *   here and wrapping each result in a §6.6 Outcome — a throw is the engine *rejecting*
 *   the formula (engine-attributable), not a driver bug.
 * Output is parallel to `tasks`. Formula resolution + result stamping stay with the
 * caller (their concerns differ); only the execution dispatch is unified here.
 */
export async function evaluateTasks(
  driver: Driver,
  tasks: DriverTask[],
  onProgress?: (completed: number, total: number) => void,
): Promise<DriverTaskResult[]> {
  if (isBatchDriver(driver)) {
    onProgress?.(0, tasks.length);
    const results = await driver.evaluateBatch(tasks);
    onProgress?.(tasks.length, tasks.length);
    return results;
  }
  const results: DriverTaskResult[] = [];
  for (let i = 0; i < tasks.length; i++) {
    onProgress?.(i, tasks.length);
    const t = tasks[i];
    if (t.skip) {
      results.push({ outcome: { kind: "skipped", cause: "policy", reason: t.skip } });
      continue;
    }
    try {
      results.push({ outcome: valueOutcome(await driver.evaluate(t.formula, t.grid)) });
    } catch (e: unknown) {
      results.push({
        outcome: { kind: "rejected", reason: e instanceof Error ? e.message : String(e) },
      });
    }
  }
  onProgress?.(tasks.length, tasks.length);
  return results;
}

export interface EvalCallbacks {
  onProgress?: (completed: number, total: number, testName: string) => void;
}

// raw results — no matcher comparison
// `formula-as-evaluated` is stamped so authors can see post-adapter text
export async function evaluateSuite(
  suite: TestSuite,
  driver: Driver,
  options?: RunOptions,
  callbacks?: EvalCallbacks,
): Promise<Record<string, FixtureEntry>> {
  const allTests = filterTests(suite, options);
  const results: Record<string, FixtureEntry> = {};

  const platform = driver.platform as Platform;

  // resolve features → adapter wrap; a null resolution means no formula for this
  // platform (drop the test); `skip` rides on the task so the generation layer
  // (evaluateTasks) handles it uniformly batch-or-single.
  const tests: Array<{ test: TestCase; task: DriverTask; asEvaluated: string }> = [];
  for (const test of allTests) {
    const resolved = resolveFormulaForPlatform(test, platform);
    if (resolved === null) continue; // no formula for this platform
    tests.push({
      test,
      task: {
        formula: resolved.formula,
        grid: test.grid,
        ...(resolved.skip ? { skip: resolved.skipReason ?? "feature absent" } : {}),
      },
      asEvaluated: resolved.asEvaluated,
    });
  }

  const outcomes = await evaluateTasks(
    driver,
    tests.map((t) => t.task),
    (completed) => callbacks?.onProgress?.(completed, tests.length, tests[completed]?.test.id ?? "…"),
  );
  for (let i = 0; i < tests.length; i++) {
    results[caseKey(tests[i].test)] = {
      outcome: outcomes[i].outcome,
      "formula-as-evaluated": tests[i].asEvaluated,
    };
  }

  return results;
}

// run against fixture files — no live drivers
// compares matcher (or override matcher) against the fixture entry per engine
export function runFromFixtures(
  suite: TestSuite,
  fixtures: Record<Platform, FixtureFile>,
  options?: RunOptions,
): RunResult {
  const tests = filterTests(suite, options);
  const platforms = Object.keys(fixtures) as Platform[];
  const allResults: TestResult[] = [];
  const forks: AgreementPartition[] = [];

  for (const test of tests) {
    const testResults: Record<string, RichGridValue> = {};
    const key = caseKey(test);

    for (const platform of platforms) {
      if (getFormulaForPlatform(test.formula, platform) === null) continue;
      // feature absent: surface as recorded-only so fork tallies stay
      // honest without flagging it as a failure
      if (featureSkipFor(test, platform) !== null) {
        allResults.push({
          test,
          platform,
          actual: liftScalarGrid([[{ error: "#N/A" }]], platform),
          passed: null,
          timeMs: 0,
        });
        continue;
      }

      const fixture = fixtures[platform];
      // v2 files key by declared id; v1 fossils (hibernated engines) by
      // semanticHash — transitional fallback until the hibernation item.
      // The stale rule: a v2 entry recorded under a different stimulus than
      // the live case cannot satisfy the lookup.
      let entry: FixtureEntry | undefined =
        fixture.results[key] ?? (test.semanticHash ? fixture.results[test.semanticHash] : undefined);
      if (entry?.stimulus !== undefined && test.stimulusHash !== undefined && entry.stimulus !== test.stimulusHash) {
        entry = undefined;
      }

      if (!entry) {
        allResults.push({
          test,
          platform,
          actual: [[null]],
          passed: false,
          error: "No fixture for this test. Run: assay generate",
          timeMs: 0,
        });
        continue;
      }

      if (entry.outcome.kind !== "value" && entry.outcome.kind !== "skipped") {
        allResults.push({
          test,
          platform,
          actual: [[null]],
          passed: false,
          error: outcomeErrorText(entry.outcome),
          timeMs: 0,
        });
        continue;
      }

      const { passed, expected } = evaluatePass(test, entry, platform);

      allResults.push({
        test,
        platform,
        actual: outcomeGrid(entry.outcome) ?? [[null]],
        expected,
        passed,
        timeMs: 0,
      });

      if (entry.outcome.kind === "value") testResults[platform] = entry.outcome.grid;
    }

    if (platforms.length > 1) {
      const p = partitionCase(test, testResults);
      if (p && isForked(p.classes)) forks.push(p);
    }
  }

  return buildResult(allResults, tests.length, forks);
}

/** The single partition path, shared by the fixture and live runners. Computes the
 * symmetric agreement partition (no pivot engine) at the circulating rung — the
 * relation only. Whether it counts as a fork is the caller's call (`isForked`); the
 * judgment is never baked in here. Returns null only when fewer than two engines
 * produced a value (nothing to partition). */
function partitionCase(
  test: TestCase,
  results: Record<string, RichGridValue>,
): AgreementPartition | null {
  if (Object.keys(results).length < 2) return null;
  const classes = partitionByAgreement(results);
  return { test, results, rung: "circulating", classes };
}

// run live against drivers
export async function runSuite(
  suite: TestSuite,
  drivers: Driver[],
  options?: RunOptions,
): Promise<RunResult> {
  const tests = filterTests(suite, options);
  const allResults: TestResult[] = [];
  const forks: AgreementPartition[] = [];
  const driverResults: Map<string, Map<string, RichGridValue>> = new Map();

  for (const driver of drivers) {
    driverResults.set(driver.platform, new Map());
    const entries = await evaluateSuite(suite, driver, options);

    for (const test of tests) {
      const key = caseKey(test);
      const entry = entries[key];
      if (!entry) continue;

      if (entry.outcome.kind !== "value" && entry.outcome.kind !== "skipped") {
        allResults.push({
          test,
          platform: driver.platform,
          actual: [[null]],
          passed: false,
          error: outcomeErrorText(entry.outcome),
          timeMs: 0,
        });
        continue;
      }

      const { passed, expected } = evaluatePass(test, entry, driver.platform);
      allResults.push({
        test,
        platform: driver.platform,
        actual: outcomeGrid(entry.outcome) ?? [[null]],
        expected,
        passed,
        timeMs: 0,
      });

      if (entry.outcome.kind === "value")
        driverResults.get(driver.platform)!.set(key, entry.outcome.grid);
    }
  }

  if (drivers.length > 1) {
    for (const test of tests) {
      const testResults: Record<string, RichGridValue> = {};
      const key = caseKey(test);
      for (const driver of drivers) {
        const val = driverResults.get(driver.platform)?.get(key);
        if (val) testResults[driver.platform] = val;
      }
      const p = partitionCase(test, testResults);
      if (p && isForked(p.classes)) forks.push(p);
    }
  }

  return buildResult(allResults, tests.length, forks);
}

function filterTests(suite: TestSuite, options?: RunOptions): TestCase[] {
  if (!options?.tags?.length) return suite.tests;
  const tagSet = new Set(options.tags);
  return suite.tests.filter((t) => t.tags?.some((tag) => tagSet.has(tag)) ?? false);
}

interface PassResult {
  passed: boolean | null;
  expected: GridValue | undefined;
}

// returns passed and (when applicable) the matcher rendered as a grid
// for diagnostic display
function evaluatePass(test: TestCase, entry: FixtureEntry, platform: Platform): PassResult {
  // Only a `value` outcome can be matched; skipped/rejected/crashed/… can't.
  if (entry.outcome.kind !== "value") return { passed: null, expected: undefined };
  if (test.status === "observed") return { passed: null, expected: undefined };
  const matcher = effectiveExpect(test, platform);
  if (matcher === null || matcher === undefined) return { passed: null, expected: undefined };
  const result = evaluateMatcher(matcher, entry.outcome.grid, {
    numTolerance: toleranceFor(platform),
  });
  return { passed: result.passed, expected: matcherForDisplay(matcher) };
}

// renders a matcher as a grid when possible — used for diagnostic display
function matcherForDisplay(matcher: unknown): GridValue | undefined {
  if (matcher === null) return [[null]];
  if (Array.isArray(matcher)) {
    if (matcher.length > 0 && Array.isArray(matcher[0])) return matcher as GridValue;
    return [matcher as CellValue[]];
  }
  if (typeof matcher === "object") return undefined; // compound matcher — skip render
  return [[matcher as CellValue]];
}

function buildResult(
  allResults: TestResult[],
  total: number,
  forks: AgreementPartition[],
): RunResult {
  return {
    results: allResults,
    forks,
    summary: {
      total,
      passed: allResults.filter((r) => r.passed === true).length,
      failed: allResults.filter((r) => r.passed === false).length,
      recorded: allResults.filter((r) => r.passed === null).length,
      forks: forks.length,
    },
  };
}
