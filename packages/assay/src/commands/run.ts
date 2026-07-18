// run tests against committed fixtures (no live engines)

import { basename } from "node:path";
import { loadTestSuite } from "../format/index.js";
import { runFromFixtures } from "../runner.js";
import { jsonReport, printReport } from "../report.js";
import { loadFixture, type FixtureFile } from "../fixtures.js";
import { toScalarGrid, type GridValue, type Platform, type RichGridValue } from "../format/values.js";
import { parsePlatforms, parseTags, resolveFiles, values } from "./shared.js";

export async function run(args: string[]): Promise<void> {
  const files = resolveFiles(args);
  if (!files.length) {
    console.error("run: no test files matched (looked in tests/*.yaml)");
    process.exit(1);
  }

  const platforms = parsePlatforms();
  const tags = parseTags();
  const verbose = values.verbose as boolean;
  const allowMissing = values["allow-missing"] as boolean;
  const wantJson = values.json as boolean;

  const allFailures: Array<{ suite: string; name: string; details: string }> = [];
  const allDivergences: Array<{ suite: string; name: string; details: string }> = [];
  const missingFixtureList: Array<{ suite: string; platform: string }> = [];
  let totalTests = 0, totalPassed = 0, totalFailed = 0, totalRecorded = 0, totalDiv = 0;

  const perSuite: Array<{ name: string; total: number; passed: number; failed: number; recorded: number; div: number }> = [];
  const jsonSuites: unknown[] = [];

  for (const file of files) {
    const suite = loadTestSuite(file);
    const suiteName = suite.name || basename(file, ".yaml");

    const fixtures: Record<string, FixtureFile> = {};
    for (const platform of platforms) {
      const fixture = loadFixture(file, platform as Platform);
      if (!fixture) {
        missingFixtureList.push({ suite: suiteName, platform });
        continue;
      }
      fixtures[platform] = fixture;
    }
    if (Object.keys(fixtures).length === 0) continue;

    const result = runFromFixtures(suite, fixtures as Record<Platform, FixtureFile>, { tags });

    totalTests += result.summary.total;
    totalPassed += result.summary.passed;
    totalFailed += result.summary.failed;
    totalRecorded += result.summary.recorded;
    totalDiv += result.divergences.length;
    perSuite.push({
      name: suiteName,
      total: result.summary.total,
      passed: result.summary.passed,
      failed: result.summary.failed,
      recorded: result.summary.recorded,
      div: result.divergences.length,
    });

    if (wantJson) jsonSuites.push(JSON.parse(jsonReport(result)));
    else if (verbose) {
      console.log(`\n── ${suiteName} ──\n`);
      printReport(result);
    }

    for (const r of result.results) {
      if (r.passed === false) {
        const actual = r.error ? `ERROR: ${r.error}` : formatGridCompact(r.actual);
        const expected = r.expected ? formatGridCompact(r.expected) : "?";
        allFailures.push({ suite: suiteName, name: r.test.id, details: `${r.platform}: got ${actual}, expected ${expected}` });
      }
    }

    for (const d of result.divergences) {
      const parts = Object.entries(d.results)
        .map(([p, g]) => `${p}=${formatGridCompact(g)}`)
        .join("  ");
      allDivergences.push({ suite: suiteName, name: d.test.id, details: parts });
    }
  }

  if (wantJson) {
    console.log(JSON.stringify({
      summary: { total: totalTests, passed: totalPassed, failed: totalFailed, recorded: totalRecorded, divergences: totalDiv },
      missingFixtures: missingFixtureList,
      suites: jsonSuites,
    }, null, 2));
    if (missingFixtureList.length > 0 && !allowMissing) process.exit(2);
    if (totalFailed > 0) process.exit(1);
    return;
  }

  if (!verbose) {
    console.log(`\n${"suite".padEnd(26)} ${"pass".padStart(6)} ${"fail".padStart(5)} ${"rec".padStart(4)} ${"div".padStart(4)}   total`);
    console.log("-".repeat(60));
    for (const s of perSuite) {
      const mark = s.failed > 0 ? "✗" : s.div > 0 ? "△" : " ";
      console.log(`${mark} ${s.name.padEnd(24)} ${String(s.passed).padStart(6)} ${String(s.failed).padStart(5)} ${String(s.recorded).padStart(4)} ${String(s.div).padStart(4)}   ${s.total}`);
    }
  }

  console.log(
    `\nTotal: ${totalTests} tests, ${totalPassed} passed, ${totalFailed} failed, ` +
      `${totalRecorded} recorded, ${totalDiv} divergences`,
  );

  if (allFailures.length > 0) {
    console.log(`\nFailures (${allFailures.length}):`);
    for (const f of allFailures.slice(0, verbose ? allFailures.length : 20)) {
      console.log(`  ✗ [${f.suite}] ${f.name}`);
      console.log(`    ${f.details}`);
    }
    if (!verbose && allFailures.length > 20) console.log(`  … ${allFailures.length - 20} more (use -v)`);
  }

  if (allDivergences.length > 0 && verbose) {
    console.log(`\nDivergences:`);
    for (const d of allDivergences) {
      console.log(`  △ [${d.suite}] ${d.name}`);
      console.log(`    ${d.details}`);
    }
  }

  if (missingFixtureList.length > 0) {
    const byPlatform = new Map<string, number>();
    for (const m of missingFixtureList) byPlatform.set(m.platform, (byPlatform.get(m.platform) ?? 0) + 1);
    const platformMsg = [...byPlatform].map(([p, n]) => `${p}=${n}`).join(", ");
    console.log(`\nMissing fixtures: ${missingFixtureList.length} suite×platform pair(s) have no fixture (${platformMsg}).`);
    if (!allowMissing) {
      console.log(`Re-run with --allow-missing to suppress, or: assay generate`);
      process.exit(2);
    }
  }

  if (totalFailed > 0) process.exit(1);
}

function formatGridCompact(grid: GridValue | RichGridValue): string {
  const scalarGrid = toScalarGrid(grid);
  const fmtCell = (v: unknown): string => {
    if (v === null || v === undefined) return "(null)";
    if (v !== null && typeof v === "object" && "error" in (v as Record<string, unknown>)) return (v as { error: string }).error;
    if (typeof v === "string") return v === "" ? '""' : v;
    return String(v);
  };
  if (scalarGrid.length === 1 && scalarGrid[0].length === 1) return fmtCell(scalarGrid[0][0]);
  return "{" + scalarGrid.map((r) => r.map(fmtCell).join(", ")).join("; ") + "}";
}
