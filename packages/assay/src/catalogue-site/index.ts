// build the static catalogue site under <outDir>
// reads divergences/, tests/, fixtures/, history/ and emits flat html + assets

import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { computeAgreementHistory, type AgreementHistory } from "../history/agreement.js";
import { ALL_PLATFORMS } from "../format/values.js";
import { buildManifest } from "../manifest/build.js";
import { loadDvs, loadFixtures, loadTests, type DvEntry, type TestInfo } from "./load.js";
import { renderIndex } from "./page-index.js";
import { renderDvDetail } from "./page-dv.js";
import { renderTestDetail } from "./page-test.js";
import { renderSuiteIndex } from "./page-suite.js";
import { renderCompare } from "./page-compare.js";
import { renderAbout } from "./page-about.js";
import { renderHistory } from "./page-history.js";

export interface BuildOptions {
  catalogueDir: string;
  testsDir: string;
  fixturesDir: string;
  outDir: string;
  // optional — when present, agreement-history.json is emitted under assets/
  historyDir?: string;
}

export interface BuildResult {
  outDir: string;
  dvCount: number;
  testCount: number;
  historyRunCount: number;
  manifestFunctionCount: number;
}

const ASSETS_DIR = join(dirname(fileURLToPath(import.meta.url)), "assets");

export function buildSite(opts: BuildOptions): BuildResult {
  const dvs = loadDvs(opts.catalogueDir);
  const testIndex = loadTests(opts.testsDir);
  // only fixtures for tests we render are useful — halves parse cost
  const fixtureIndex = loadFixtures(opts.fixturesDir, testIndex);

  const testToDvs = new Map<string, DvEntry[]>();
  for (const dv of dvs) {
    for (const tid of dv.tests) {
      const arr = testToDvs.get(tid) ?? [];
      arr.push(dv);
      testToDvs.set(tid, arr);
    }
  }

  // pages live in their own directories so urls are extensionless on cloudflare pages and locally
  ensure(opts.outDir);
  ensure(join(opts.outDir, "about"));
  ensure(join(opts.outDir, "compare"));
  ensure(join(opts.outDir, "dv"));
  ensure(join(opts.outDir, "history"));
  ensure(join(opts.outDir, "test"));
  cpSync(ASSETS_DIR, join(opts.outDir, "assets"), { recursive: true });

  writeFileSync(join(opts.outDir, "index.html"), renderIndex(dvs));
  writeFileSync(join(opts.outDir, "compare", "index.html"), renderCompare(testIndex, fixtureIndex, testToDvs));
  writeFileSync(join(opts.outDir, "about", "index.html"), renderAbout(dvs, testIndex.size));
  for (const dv of dvs) {
    const dir = join(opts.outDir, "dv", dv.id);
    ensure(dir);
    writeFileSync(join(dir, "index.html"), renderDvDetail(dv, testIndex, fixtureIndex));
  }
  const testsBySuite = new Map<string, TestInfo[]>();
  for (const [tid, test] of testIndex) {
    const dir = join(opts.outDir, "test", test.ref);
    ensure(dir);
    const fixtures = fixtureIndex.get(test.semanticHash ?? test.ref) ?? fixtureIndex.get(tid) ?? new Map<string, unknown>();
    const owningDvs = testToDvs.get(tid) ?? [];
    writeFileSync(join(dir, "index.html"), renderTestDetail(test, fixtures, owningDvs));
    const arr = testsBySuite.get(test.suite) ?? [];
    arr.push(test);
    testsBySuite.set(test.suite, arr);
  }
  for (const [suite, tests] of testsBySuite) {
    const dir = join(opts.outDir, "test", "suite", suite);
    ensure(dir);
    writeFileSync(join(dir, "index.html"), renderSuiteIndex(suite, tests, testToDvs));
  }

  const ah: AgreementHistory = opts.historyDir && existsSync(opts.historyDir)
    ? computeAgreementHistory(opts.historyDir)
    : { runs: [], engines: ALL_PLATFORMS };
  const historyRunCount = ah.runs.length;
  if (historyRunCount > 0) {
    writeFileSync(join(opts.outDir, "assets", "agreement-history.json"), JSON.stringify(ah));
  }
  writeFileSync(join(opts.outDir, "history", "index.html"), renderHistory(ah));

  const manifest = buildManifest({
    dvs, tests: testIndex, fixtures: fixtureIndex,
    generatedAt: new Date().toISOString(),
  });
  writeFileSync(join(opts.outDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

  return {
    outDir: opts.outDir,
    dvCount: dvs.length,
    testCount: testIndex.size,
    historyRunCount,
    manifestFunctionCount: Object.keys(manifest.functions).length,
  };
}

function ensure(path: string): void {
  if (!existsSync(path)) mkdirSync(path, { recursive: true });
}
