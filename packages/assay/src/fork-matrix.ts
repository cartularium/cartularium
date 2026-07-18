// divergence matrix — aggregate per-engine override structure across the corpus
// static analysis over the YAML; no runtime evaluation
//
// three views, all derived from the same scan:
//   1. per-engine cause profile (engine × cause)
//   2. pairwise agreement (engine × engine)
//   3. divergence clusters (cause + engine-set + behavior signature → tests)
//
// cluster output is the seed for the divergence catalogue (DV-####.yaml)

import { ALL_PLATFORMS } from "./format/values.js";
import type { Platform } from "./format/values.js";
import type { Category, Cause, TestCase, TestSuite } from "./format/catalogue.js";
import { loadTestSuite } from "./format/parse.js";
import { behaviorSignature, clusterKey } from "./divergences/cluster.js";

export interface MatrixReport {
  totalTests: number;
  totalOverrides: number;
  perEngine: EngineStats[];
  pairwise: PairwiseRow[];
  clusters: ForkCluster[];
}

export interface EngineStats {
  engine: Platform;
  // tests where this engine has an override
  divergentTests: number;
  // tests where this engine has fixture data and no override (agrees with canonical)
  agreementTests: number;
  byCause: Partial<Record<Cause, number>>;
  byCategory: Partial<Record<Category, number>>;
  // top-divergent subjects for drill-down
  topSubjects: Array<{ subject: string; count: number }>;
}

export interface PairwiseRow {
  engineA: Platform;
  engineB: Platform;
  // tests where both engines have a defined behaviour (override or test.expect)
  testsCompared: number;
  testsAgree: number;
  testsDiffer: number;
  agreementPct: number;
}

export interface ForkCluster {
  // stable handle: `<cause>__<engines-sorted>__<sig-hash>`
  key: string;
  cause: Cause;
  engines: Platform[];
  // canonical short string for the shared recorded behaviour
  behaviorSignature: string;
  testCount: number;
  testIds: string[];
  subjects: string[];
  // dominant category
  category: Category;
}

export function computeMatrix(suiteFiles: string[]): MatrixReport {
  const tests: Array<{ test: TestCase; suite: TestSuite }> = [];
  for (const f of suiteFiles) {
    const suite = loadTestSuite(f);
    for (const t of suite.tests) tests.push({ test: t, suite });
  }

  // per-engine accumulators
  const engineStats = new Map<Platform, {
    divergentTests: Set<string>;
    agreementTests: Set<string>;
    byCause: Map<Cause, number>;
    byCategory: Map<Category, number>;
    subjectCounts: Map<string, number>;
  }>();
  for (const eng of ALL_PLATFORMS) {
    engineStats.set(eng, {
      divergentTests: new Set(),
      agreementTests: new Set(),
      byCause: new Map(),
      byCategory: new Map(),
      subjectCounts: new Map(),
    });
  }

  // cluster accumulator: key → cluster data
  const clusters = new Map<string, {
    cause: Cause;
    engines: Set<Platform>;
    behaviorSignature: string;
    testIds: string[];
    subjects: Set<string>;
    categories: Map<Category, number>;
  }>();

  // pairwise: per (engine, testId) → behaviour signature
  const behaviorByEngineTest = new Map<Platform, Map<string, string>>();
  for (const eng of ALL_PLATFORMS) behaviorByEngineTest.set(eng, new Map());

  let totalOverrides = 0;

  for (const { test } of tests) {
    if (!test.id) continue;

    // track per-engine behaviours for pairwise comparison
    const canonicalBehavior = behaviorSignature(test.expect);
    for (const eng of ALL_PLATFORMS) {
      const ov = test.overrides?.[eng];
      let behavior: string | null;
      if (ov) {
        // override.expect wins, then recorded, then "no-assertion"
        if (ov.expect !== undefined) behavior = behaviorSignature(ov.expect);
        else if (ov.recorded !== undefined) behavior = behaviorSignature(ov.recorded);
        else behavior = "no-assertion";
      } else if (test.expect !== undefined && test.status !== "observed") {
        behavior = canonicalBehavior;
      } else {
        behavior = null; // no defined behaviour on this engine for this test
      }
      if (behavior !== null) behaviorByEngineTest.get(eng)!.set(test.id, behavior);
    }

    // tally overrides per engine + accumulate clusters
    if (test.overrides) {
      // group overrides by (cause + behaviour signature) → set of engines sharing it
      const buckets = new Map<string, { cause: Cause; sig: string; engines: Platform[] }>();
      for (const [engStr, ov] of Object.entries(test.overrides)) {
        if (!ov) continue;
        const eng = engStr as Platform;
        totalOverrides++;
        const stats = engineStats.get(eng)!;
        stats.divergentTests.add(test.id);
        stats.byCause.set(ov.cause, (stats.byCause.get(ov.cause) ?? 0) + 1);
        stats.byCategory.set(test.category, (stats.byCategory.get(test.category) ?? 0) + 1);
        if (test.subject) stats.subjectCounts.set(test.subject, (stats.subjectCounts.get(test.subject) ?? 0) + 1);

        const sig = behaviorSignature(ov.recorded ?? ov.expect ?? null);
        const bucketKey = `${ov.cause}__${sig}`;
        const bucket = buckets.get(bucketKey) ?? { cause: ov.cause, sig, engines: [] };
        bucket.engines.push(eng);
        buckets.set(bucketKey, bucket);
      }
      // record clusters — one per (cause, engine-set, sig) tuple in this test
      for (const bucket of buckets.values()) {
        const key = clusterKey({ cause: bucket.cause, engines: bucket.engines, signature: bucket.sig });
        let c = clusters.get(key);
        if (!c) {
          c = {
            cause: bucket.cause,
            engines: new Set([...bucket.engines].sort()),
            behaviorSignature: bucket.sig,
            testIds: [],
            subjects: new Set(),
            categories: new Map(),
          };
          clusters.set(key, c);
        }
        c.testIds.push(test.id);
        if (test.subject) c.subjects.add(test.subject);
        c.categories.set(test.category, (c.categories.get(test.category) ?? 0) + 1);
      }
    }

    // tally agreements — engines with no override and a canonical to agree with
    if (test.expect !== undefined && test.status !== "observed") {
      for (const eng of ALL_PLATFORMS) {
        if (test.overrides?.[eng]) continue;
        engineStats.get(eng)!.agreementTests.add(test.id);
      }
    }
  }

  const perEngine: EngineStats[] = ALL_PLATFORMS.map((eng) => {
    const s = engineStats.get(eng)!;
    const topSubjects = [...s.subjectCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([subject, count]) => ({ subject, count }));
    return {
      engine: eng,
      divergentTests: s.divergentTests.size,
      agreementTests: s.agreementTests.size,
      byCause: Object.fromEntries(s.byCause) as Partial<Record<Cause, number>>,
      byCategory: Object.fromEntries(s.byCategory) as Partial<Record<Category, number>>,
      topSubjects,
    };
  });

  const pairwise: PairwiseRow[] = [];
  for (let i = 0; i < ALL_PLATFORMS.length; i++) {
    for (let j = i + 1; j < ALL_PLATFORMS.length; j++) {
      const a = ALL_PLATFORMS[i], b = ALL_PLATFORMS[j];
      const ba = behaviorByEngineTest.get(a)!;
      const bb = behaviorByEngineTest.get(b)!;
      let compared = 0, agree = 0;
      for (const [tid, va] of ba) {
        const vb = bb.get(tid);
        if (vb === undefined) continue;
        compared++;
        if (va === vb) agree++;
      }
      pairwise.push({
        engineA: a,
        engineB: b,
        testsCompared: compared,
        testsAgree: agree,
        testsDiffer: compared - agree,
        agreementPct: compared === 0 ? 0 : Math.round((agree / compared) * 1000) / 10,
      });
    }
  }

  // sort clusters by testCount desc
  const clusterList: ForkCluster[] = [...clusters.entries()]
    .map(([key, c]) => {
      const dominantCategory = [...c.categories.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? ("value" as Category);
      return {
        key,
        cause: c.cause,
        engines: [...c.engines].sort(),
        behaviorSignature: c.behaviorSignature,
        testCount: c.testIds.length,
        testIds: [...c.testIds],
        subjects: [...c.subjects].sort(),
        category: dominantCategory,
      };
    })
    .sort((a, b) => b.testCount - a.testCount);

  return {
    totalTests: tests.length,
    totalOverrides,
    perEngine,
    pairwise,
    clusters: clusterList,
  };
}

export const VIEWS = ["headline", "pairwise", "by-cause", "by-category", "clusters"] as const;
export type View = typeof VIEWS[number];

export interface PrintOptions {
  view?: View;
  // cap cluster output (default 25)
  limit?: number;
  // show full test-id samples + behaviour signatures in cluster view
  verbose?: boolean;
}

export function printMatrix(report: MatrixReport, opts: PrintOptions = {}): void {
  const view = opts.view ?? "headline";
  const limit = opts.limit ?? 25;

  if (view === "headline" || view === "by-cause") {
    printHeader(report);
    printPerEngineCauses(report, view === "by-cause");
  }
  if (view === "headline" || view === "pairwise") {
    if (view === "headline") console.log("");
    printPairwise(report);
  }
  if (view === "by-category") {
    printHeader(report);
    printPerEngineCategories(report);
  }
  if (view === "clusters") {
    printHeader(report);
    printClusters(report, limit, opts.verbose ?? false);
  }
}

function printHeader(report: MatrixReport): void {
  console.log(`── Fork matrix ──`);
  console.log(`  tests scanned:    ${report.totalTests}`);
  console.log(`  total overrides:  ${report.totalOverrides}`);
  console.log(`  cluster groups:   ${report.clusters.length}`);
  console.log("");
}

function printPerEngineCauses(report: MatrixReport, full: boolean): void {
  // top causes by total volume — capped at 6 unless --view=by-cause
  const causeTotals = new Map<Cause, number>();
  for (const e of report.perEngine) {
    for (const [c, n] of Object.entries(e.byCause) as Array<[Cause, number]>) {
      causeTotals.set(c, (causeTotals.get(c) ?? 0) + n);
    }
  }
  const allCauses = [...causeTotals.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
  const causes = full ? allCauses : allCauses.slice(0, 6);

  const engCol = 14;
  const numCol = 8;
  const causeCols = causes.map((c) => Math.max(c.length + 1, numCol));

  const header = `${"engine".padEnd(engCol)}${"divergent".padStart(numCol)}` +
    causes.map((c, i) => c.padStart(causeCols[i])).join("");
  console.log(header);
  console.log("─".repeat(header.length));
  for (const e of report.perEngine) {
    const cells = causes.map((c, i) => String(e.byCause[c] ?? 0).padStart(causeCols[i])).join("");
    console.log(`${e.engine.padEnd(engCol)}${String(e.divergentTests).padStart(numCol)}${cells}`);
  }
  if (!full && allCauses.length > causes.length) {
    console.log(`  (${allCauses.length - causes.length} additional cause(s) hidden — re-run with --view=by-cause)`);
  }
}

function printPerEngineCategories(report: MatrixReport): void {
  const catTotals = new Map<Category, number>();
  for (const e of report.perEngine) {
    for (const [c, n] of Object.entries(e.byCategory) as Array<[Category, number]>) {
      catTotals.set(c, (catTotals.get(c) ?? 0) + n);
    }
  }
  const cats = [...catTotals.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);

  const engCol = 14;
  const numCol = 8;
  const catCols = cats.map((c) => Math.max(c.length + 1, numCol));

  const header = `${"engine".padEnd(engCol)}${"divergent".padStart(numCol)}` +
    cats.map((c, i) => c.padStart(catCols[i])).join("");
  console.log(header);
  console.log("─".repeat(header.length));
  for (const e of report.perEngine) {
    const cells = cats.map((c, i) => String(e.byCategory[c] ?? 0).padStart(catCols[i])).join("");
    console.log(`${e.engine.padEnd(engCol)}${String(e.divergentTests).padStart(numCol)}${cells}`);
  }
}

function printPairwise(report: MatrixReport): void {
  console.log(`Pairwise agreement (% of shared-coverage tests where both engines behave identically):`);
  console.log("");

  // build an N×N cell map for symmetric display
  const cells = new Map<string, PairwiseRow>();
  for (const r of report.pairwise) {
    cells.set(`${r.engineA}|${r.engineB}`, r);
    cells.set(`${r.engineB}|${r.engineA}`, r);
  }

  // truncate engine names for column headers
  const colWidth = 8;
  const labelCol = 14;
  const header = " ".repeat(labelCol) + ALL_PLATFORMS.map((e) => e.slice(0, colWidth - 1).padStart(colWidth)).join("");
  console.log(header);
  for (const ra of ALL_PLATFORMS) {
    const cellsRow = ALL_PLATFORMS.map((rb) => {
      if (ra === rb) return "—".padStart(colWidth);
      const r = cells.get(`${ra}|${rb}`);
      if (!r || r.testsCompared === 0) return "·".padStart(colWidth);
      return `${r.agreementPct.toFixed(1)}%`.padStart(colWidth);
    }).join("");
    console.log(`${ra.padEnd(labelCol)}${cellsRow}`);
  }
}

function printClusters(report: MatrixReport, limit: number, verbose: boolean): void {
  console.log(`Top divergence clusters (by test count) — DV-#### catalogue candidates:`);
  console.log("");
  const shown = report.clusters.slice(0, limit);
  for (const c of shown) {
    const engineStr = c.engines.join(",");
    console.log(
      `  ${String(c.testCount).padStart(4)} tests  cause=${c.cause.padEnd(20)} engines=[${engineStr}]`,
    );
    console.log(
      `       category=${c.category}  subjects=${c.subjects.slice(0, 5).join(",")}${c.subjects.length > 5 ? `,+${c.subjects.length - 5} more` : ""}`,
    );
    if (verbose) {
      console.log(`       behavior: ${c.behaviorSignature.slice(0, 100)}`);
      console.log(`       sample:   ${c.testIds.slice(0, 5).join(", ")}`);
    }
    console.log("");
  }
  if (report.clusters.length > limit) {
    console.log(`  (${report.clusters.length - limit} more cluster(s) — increase --limit to see)`);
  }
}

export function jsonMatrix(report: MatrixReport): string {
  return JSON.stringify(report, null, 2);
}

import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import * as YAML from "yaml";

export interface SeedOptions {
  force?: boolean;
}

export interface SeedResult {
  dir: string;
  filesWritten: number;
  firstId: string;
  lastId: string;
}

// writes one DV-NNNN.yaml per cluster, sorted by test count desc
// IDs are assigned at seed time and become sticky thereafter
// refuses to overwrite an existing DV-#### dir without --force — IDs are
// load-bearing once tests link via `links.divergence`, re-seeding would shuffle
export function seedCatalogue(report: MatrixReport, dir: string, opts: SeedOptions = {}): SeedResult {
  const force = opts.force ?? false;

  if (existsSync(dir)) {
    const existing = readdirSync(dir).filter((f) => /^DV-\d+\.yaml$/.test(f));
    if (existing.length > 0 && !force) {
      throw new Error(
        `${dir} already contains ${existing.length} DV-#### file(s). ` +
        `Re-seeding would shuffle IDs and orphan any \`links.divergence\` references. ` +
        `Pass --force to overwrite anyway.`,
      );
    }
    // with --force, delete existing DV files so old IDs above the new range don't linger
    if (force) {
      for (const f of existing) {
        try { rmSync(join(dir, f)); } catch {}
      }
    }
  } else {
    mkdirSync(dir, { recursive: true });
  }

  const today = new Date().toISOString().slice(0, 10);
  const total = report.clusters.length;
  const idWidth = Math.max(4, String(total).length);

  let written = 0;
  let firstId = "", lastId = "";

  for (let i = 0; i < total; i++) {
    const c = report.clusters[i];
    const idNum = String(i + 1).padStart(idWidth, "0");
    const id = `DV-${idNum}`;
    if (i === 0) firstId = id;
    if (i === total - 1) lastId = id;

    const entry = {
      id,
      summary: clusterSummary(c),
      cause: c.cause,
      category: c.category,
      engines: c.engines,
      behavior: {
        signature: c.behaviorSignature,
      },
      "test-count": c.testCount,
      subjects: c.subjects,
      tests: c.testIds,
      seeded: today,
      "last-confirmed": today,
    };

    writeFileSync(join(dir, `${id}.yaml`), YAML.stringify(entry));
    written++;
  }

  return { dir, filesWritten: written, firstId, lastId };
}

// one-line human summary derived from the cluster's structure
function clusterSummary(c: ForkCluster): string {
  const enginesStr = c.engines.join(", ");
  const subjectsStr = c.subjects.length <= 3
    ? c.subjects.join(", ")
    : `${c.subjects.slice(0, 3).join(", ")} (+${c.subjects.length - 3} more)`;
  return `${enginesStr}: ${causePhrases[c.cause]} — ${subjectsStr}`;
}

// non-partial — TS flags missing entries when the Cause union grows
const causePhrases: Record<Cause, string> = {
  "missing-function": "function not implemented",
  "missing-arg-form": "argument form rejected",
  "argument-arity": "different optional-arg default",
  "arg-semantics": "different argument interpretation",
  "precision": "numeric precision differs",
  "format-rendering": "rendered with different format",
  "locale": "locale-sensitive output",
  "shape": "return shape differs",
  "array-orientation": "transposed return shape",
  "error-code": "different error code",
  "error-attribution": "error in different cell",
  "null-vs-zero": "blank/null/zero coercion differs",
  "recalc-semantics": "recalc behavior differs",
  "array-handling": "broadcasting / array rules differ",
  "unimplemented-edge": "fails on this specific input",
  "version-skew": "depends on engine release",
  "intentional-spec": "documented engine divergence",
  "TODO": "cause not yet classified",
};
