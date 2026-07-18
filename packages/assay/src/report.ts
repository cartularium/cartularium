import type { TestResult } from "./format/catalogue.js";
import { formatGrid } from "./format/match.js";
import type { RunResult } from "./runner.js";

export function printReport(result: RunResult): void {
  const { results, forks, summary } = result;

  const byTest = new Map<string, TestResult[]>();
  for (const r of results) {
    const key = r.test.id;
    if (!byTest.has(key)) byTest.set(key, []);
    byTest.get(key)!.push(r);
  }

  const failures: Array<{ name: string; details: string }> = [];
  const forkRows: Array<{ name: string; details: string }> = [];

  for (const [name, testResults] of byTest) {
    const isForked = forks.some((p) => p.test.id === name);
    const anyFailed = testResults.some((r) => r.passed === false);
    const allRecorded = testResults.every((r) => r.passed === null);

    let icon: string;
    if (isForked) icon = " △";
    else if (anyFailed) icon = " ✗";
    else if (allRecorded) icon = " ○";
    else icon = " ✓";

    const platformResults = testResults
      .map((r) => {
        const val = r.error ? `ERROR: ${r.error}` : formatGrid(r.actual);
        return `${r.platform}=${val}`;
      })
      .join("  ");

    const suffix = isForked ? "  FORKED" : "";

    console.log(
      `${icon} ${name.padEnd(40)} ${platformResults}${suffix}`,
    );

    if (anyFailed) {
      for (const r of testResults) {
        if (r.passed === false) {
          const actual = r.error ? `ERROR: ${r.error}` : formatGrid(r.actual);
          const expected = r.expected ? formatGrid(r.expected) : "?";
          failures.push({
            name,
            details: `${r.platform}: got ${actual}, expected ${expected}`,
          });
        }
      }
    }

    if (isForked) {
      const parts = testResults.map((r) => {
        const val = r.error ? `ERROR` : formatGrid(r.actual);
        return `${r.platform}=${val}`;
      });
      forkRows.push({ name, details: parts.join("  ") });
    }
  }

  console.log("");
  console.log(
    `${summary.total} tests, ` +
      `${summary.passed} passed, ` +
      `${summary.failed} failed, ` +
      `${summary.recorded} recorded, ` +
      `${summary.forks} forked`,
  );

  if (failures.length > 0) {
    console.log(`\nFailures:`);
    for (const f of failures) {
      console.log(`  ✗ ${f.name}`);
      console.log(`    ${f.details}`);
    }
  }

  if (forkRows.length > 0) {
    console.log(`\nForks:`);
    for (const d of forkRows) {
      console.log(`  △ ${d.name}`);
      console.log(`    ${d.details}`);
    }
  }
}

export function jsonReport(result: RunResult): string {
  return JSON.stringify(
    {
      summary: result.summary,
      forks: result.forks.map((p) => ({
        name: p.test.id,
        formula: p.test.formula,
        results: p.results,
      })),
      results: result.results.map((r) => ({
        name: r.test.id,
        platform: r.platform,
        actual: r.actual,
        expected: r.expected,
        passed: r.passed,
        error: r.error,
        timeMs: r.timeMs,
      })),
    },
    null,
    2,
  );
}
