// Agreement matrix — the verdict-free corpus rollup of the cross-engine
// agreement partition (CP3, reporting re-source).
//
// Re-sources the matrix's human-facing views off OBSERVED Outcomes
// (loadFixtureOutcomes → partitionByAgreement), the same partition the V5
// manifest publishes per test — so matrix and manifest cannot disagree. No
// baseline, no "agrees-with-canonical", no reference engine. Three descriptive
// views over the partition:
//   1. per-engine  — capability (produced no value) + fork-participation +
//      singleton-isolation (alone in its class — factual |class|=1, NOT "wrong").
//   2. pairwise    — co-membership: both produced a value AND landed in the same
//      agreement-class. Symmetric; capability gaps excluded from the denominator.
//   3. fork-shapes — recurring partition signatures (DV candidates). Report-only:
//      it surfaces shapes, it does NOT write DV files (cause is hand-authored now).
//
// The override-based fork-matrix.ts (+ seedCatalogue + the history
// DV-lifecycle) stays on the authoring basis — quarantined, retires when the
// authoring layer (overrides/expect/status) does and DV identity is re-founded
// on observed forks (the next checkpoint).

import { ALL_PLATFORMS } from "./format/values.js";
import type { Outcome, Platform, RichGridValue } from "./format/values.js";
import type { Category } from "./format/catalogue.js";
import { partitionByAgreement } from "./format/relations.js";
import type { TestInfo } from "./catalogue-site/load.js";

export type NoValueCapability = "unsupported" | "rejected" | "crashed" | "no-data";

export interface AgreementMatrixReport {
  // tests with at least one `value` outcome (the ones that enter a partition)
  totalTests: number;
  uniformTests: number; // exactly one agreement-class
  forkedTests: number; // more than one — plural
  perEngine: EngineAgreementStats[];
  pairwise: PairwiseCoClass[];
  forkShapes: ForkShape[];
}

export interface EngineAgreementStats {
  engine: Platform;
  valueTests: number; // produced a value (entered the partition)
  noValueTests: number; // produced a non-value outcome (capability gap)
  byCapability: Partial<Record<NoValueCapability, number>>;
  forkParticipation: number; // produced a value AND the formula forked
  singletonIsolation: number; // alone in its agreement-class within a fork (|class| === 1)
}

export interface PairwiseCoClass {
  engineA: Platform;
  engineB: Platform;
  coCovered: number; // both produced a value
  coClassed: number; // ...and in the same agreement-class
  differ: number; // coCovered - coClassed
  coClassPct: number; // coClassed / coCovered, one decimal
}

export interface ForkShape {
  // canonical render of the engine set-partition, e.g. "excel,gsheets|ironcalc"
  signature: string;
  engines: Platform[]; // every engine that produced a value in this shape
  classCount: number;
  testCount: number;
  testIds: string[];
  subjects: string[];
  category: Category; // dominant
}

function noValueCapability(o: Outcome): NoValueCapability | null {
  switch (o.kind) {
    case "value":
    case "pending":
      return null;
    case "rejected":
      return "rejected";
    case "crashed":
      return "crashed";
    case "skipped":
      return o.cause === "capability" ? "unsupported" : "no-data";
    case "infra":
    case "driver-error":
    case "unclassified":
      return "no-data";
  }
}

// resolve a test's outcomes by any of its keys (semantic-hash row is also exposed
// under the public ref by loadFixtureOutcomes) — mirrors the manifest's lookup.
function outcomesFor(
  outcomes: Map<string, Map<Platform, Outcome>>,
  test: TestInfo,
  ref: string,
): Map<Platform, Outcome> | undefined {
  return (
    (test.semanticHash ? outcomes.get(test.semanticHash) : undefined) ??
    outcomes.get(ref) ??
    outcomes.get(test.id)
  );
}

export function computeAgreementMatrix(
  tests: Map<string, TestInfo>,
  outcomes: Map<string, Map<Platform, Outcome>>,
): AgreementMatrixReport {
  const eng = new Map<
    Platform,
    {
      valueTests: number;
      noValueTests: number;
      byCapability: Map<NoValueCapability, number>;
      forkParticipation: number;
      singletonIsolation: number;
    }
  >();
  for (const e of ALL_PLATFORMS) {
    eng.set(e, { valueTests: 0, noValueTests: 0, byCapability: new Map(), forkParticipation: 0, singletonIsolation: 0 });
  }

  // pairwise accumulators, keyed "A|B" with A before B in ALL_PLATFORMS order
  const pair = new Map<string, { coCovered: number; coClassed: number }>();
  // fork-shape accumulators, keyed by partition signature
  const shapes = new Map<
    string,
    { engines: Set<Platform>; classCount: number; testIds: string[]; subjects: Set<string>; categories: Map<Category, number> }
  >();

  let totalTests = 0;
  let uniformTests = 0;
  let forkedTests = 0;

  for (const [tid, t] of tests) {
    const byEngine = outcomesFor(outcomes, t, t.ref ?? tid);
    if (!byEngine) continue;

    // value grids feed the partition; non-value outcomes are capability-only.
    const valueGrids: Record<string, RichGridValue> = {};
    for (const [engine, o] of byEngine) {
      if (o.kind === "value") {
        valueGrids[engine] = o.grid;
      } else {
        const cap = noValueCapability(o);
        if (cap) {
          const s = eng.get(engine)!;
          s.noValueTests++;
          s.byCapability.set(cap, (s.byCapability.get(cap) ?? 0) + 1);
        }
      }
    }

    const valueEngines = Object.keys(valueGrids) as Platform[];
    if (valueEngines.length === 0) continue; // no observation enters a partition

    const classes = partitionByAgreement(valueGrids);
    const forked = classes.length > 1;
    totalTests++;
    if (forked) forkedTests++;
    else uniformTests++;

    const classOf = new Map<Platform, number>();
    const classSize: number[] = classes.map((c) => c.engines.length);
    classes.forEach((c, i) => c.engines.forEach((e) => classOf.set(e, i)));

    // per-engine tallies
    for (const e of valueEngines) {
      const s = eng.get(e)!;
      s.valueTests++;
      if (forked) {
        s.forkParticipation++;
        if (classSize[classOf.get(e)!] === 1) s.singletonIsolation++;
      }
    }

    // pairwise co-membership over value-producing engines
    for (let i = 0; i < ALL_PLATFORMS.length; i++) {
      for (let j = i + 1; j < ALL_PLATFORMS.length; j++) {
        const a = ALL_PLATFORMS[i];
        const b = ALL_PLATFORMS[j];
        if (!(a in valueGrids) || !(b in valueGrids)) continue;
        const key = `${a}|${b}`;
        const acc = pair.get(key) ?? { coCovered: 0, coClassed: 0 };
        acc.coCovered++;
        if (classOf.get(a) === classOf.get(b)) acc.coClassed++;
        pair.set(key, acc);
      }
    }

    // fork-shape clustering (forked tests only)
    if (forked) {
      const signature = classes.map((c) => c.engines.join(",")).join("|");
      const shape =
        shapes.get(signature) ??
        { engines: new Set<Platform>(), classCount: classes.length, testIds: [], subjects: new Set<string>(), categories: new Map<Category, number>() };
      for (const e of valueEngines) shape.engines.add(e);
      shape.testIds.push(t.ref ?? tid);
      if (t.subject) shape.subjects.add(t.subject);
      const cat = (t.category || "value") as Category;
      shape.categories.set(cat, (shape.categories.get(cat) ?? 0) + 1);
      shapes.set(signature, shape);
    }
  }

  const perEngine: EngineAgreementStats[] = ALL_PLATFORMS.map((engine) => {
    const s = eng.get(engine)!;
    return {
      engine,
      valueTests: s.valueTests,
      noValueTests: s.noValueTests,
      byCapability: Object.fromEntries(s.byCapability) as Partial<Record<NoValueCapability, number>>,
      forkParticipation: s.forkParticipation,
      singletonIsolation: s.singletonIsolation,
    };
  });

  const pairwise: PairwiseCoClass[] = [];
  for (let i = 0; i < ALL_PLATFORMS.length; i++) {
    for (let j = i + 1; j < ALL_PLATFORMS.length; j++) {
      const a = ALL_PLATFORMS[i];
      const b = ALL_PLATFORMS[j];
      const acc = pair.get(`${a}|${b}`) ?? { coCovered: 0, coClassed: 0 };
      pairwise.push({
        engineA: a,
        engineB: b,
        coCovered: acc.coCovered,
        coClassed: acc.coClassed,
        differ: acc.coCovered - acc.coClassed,
        coClassPct: acc.coCovered === 0 ? 0 : Math.round((acc.coClassed / acc.coCovered) * 1000) / 10,
      });
    }
  }

  const forkShapes: ForkShape[] = [...shapes.entries()]
    .map(([signature, s]) => {
      const category = [...s.categories.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? ("value" as Category);
      return {
        signature,
        engines: [...s.engines].sort() as Platform[],
        classCount: s.classCount,
        testCount: s.testIds.length,
        testIds: [...s.testIds],
        subjects: [...s.subjects].sort(),
        category,
      };
    })
    .sort((a, b) => b.testCount - a.testCount);

  return { totalTests, uniformTests, forkedTests, perEngine, pairwise, forkShapes };
}

export const AGREEMENT_VIEWS = ["headline", "pairwise", "engines", "forks"] as const;
export type AgreementView = (typeof AGREEMENT_VIEWS)[number];

export interface PrintOptions {
  view?: AgreementView;
  limit?: number; // cap fork-shape rows (default 25)
  verbose?: boolean; // show sample test ids under fork shapes
}

export function printAgreementMatrix(report: AgreementMatrixReport, opts: PrintOptions = {}): void {
  const view = opts.view ?? "headline";
  const limit = opts.limit ?? 25;

  if (view === "headline" || view === "engines") {
    printHeader(report);
    printPerEngine(report, view === "engines");
  }
  if (view === "headline" || view === "pairwise") {
    if (view === "headline") console.log("");
    printPairwise(report);
  }
  if (view === "forks") {
    printHeader(report);
    printForkShapes(report, limit, opts.verbose ?? false);
  }
}

function printHeader(report: AgreementMatrixReport): void {
  console.log(`── Agreement matrix (observed) ──`);
  console.log(`  tests with values:  ${report.totalTests}`);
  console.log(`  uniform:            ${report.uniformTests}   (one agreement-class)`);
  console.log(`  forked:             ${report.forkedTests}   (plural)`);
  console.log(`  fork-shapes:        ${report.forkShapes.length}`);
  console.log("");
}

function printPerEngine(report: AgreementMatrixReport, full: boolean): void {
  const engCol = 14;
  const numCol = 11;
  const header =
    `${"engine".padEnd(engCol)}` +
    `${"value".padStart(numCol)}${"no-value".padStart(numCol)}${"forks".padStart(numCol)}${"singleton".padStart(numCol)}`;
  console.log(header);
  console.log("─".repeat(header.length));
  for (const e of report.perEngine) {
    console.log(
      `${e.engine.padEnd(engCol)}` +
        `${String(e.valueTests).padStart(numCol)}${String(e.noValueTests).padStart(numCol)}` +
        `${String(e.forkParticipation).padStart(numCol)}${String(e.singletonIsolation).padStart(numCol)}`,
    );
  }
  if (full) {
    console.log("");
    console.log("capability breakdown (no-value outcomes):");
    const caps: NoValueCapability[] = ["unsupported", "rejected", "crashed", "no-data"];
    const capCol = 14;
    const ch = `${"engine".padEnd(engCol)}` + caps.map((c) => c.padStart(capCol)).join("");
    console.log(ch);
    console.log("─".repeat(ch.length));
    for (const e of report.perEngine) {
      console.log(
        `${e.engine.padEnd(engCol)}` + caps.map((c) => String(e.byCapability[c] ?? 0).padStart(capCol)).join(""),
      );
    }
  }
}

function printPairwise(report: AgreementMatrixReport): void {
  console.log(`Pairwise co-classing (% of co-covered tests where both engines share an agreement-class):`);
  console.log("");
  const cells = new Map<string, PairwiseCoClass>();
  for (const r of report.pairwise) {
    cells.set(`${r.engineA}|${r.engineB}`, r);
    cells.set(`${r.engineB}|${r.engineA}`, r);
  }
  const colWidth = 8;
  const labelCol = 14;
  const header = " ".repeat(labelCol) + ALL_PLATFORMS.map((e) => e.slice(0, colWidth - 1).padStart(colWidth)).join("");
  console.log(header);
  for (const ra of ALL_PLATFORMS) {
    const row = ALL_PLATFORMS.map((rb) => {
      if (ra === rb) return "—".padStart(colWidth);
      const r = cells.get(`${ra}|${rb}`);
      if (!r || r.coCovered === 0) return "·".padStart(colWidth);
      return `${r.coClassPct.toFixed(1)}%`.padStart(colWidth);
    }).join("");
    console.log(`${ra.padEnd(labelCol)}${row}`);
  }
}

function printForkShapes(report: AgreementMatrixReport, limit: number, verbose: boolean): void {
  console.log(`Top fork-shapes (by test count) — recurring partition signatures, DV candidates:`);
  console.log("");
  for (const s of report.forkShapes.slice(0, limit)) {
    console.log(`  ${String(s.testCount).padStart(4)} tests  ${s.classCount} classes  ${s.signature}`);
    console.log(
      `       category=${s.category}  subjects=${s.subjects.slice(0, 5).join(",")}${s.subjects.length > 5 ? `,+${s.subjects.length - 5} more` : ""}`,
    );
    if (verbose) console.log(`       sample:   ${s.testIds.slice(0, 5).join(", ")}`);
    console.log("");
  }
  if (report.forkShapes.length > limit) {
    console.log(`  (${report.forkShapes.length - limit} more shape(s) — increase --limit to see)`);
  }
}

export function jsonAgreementMatrix(report: AgreementMatrixReport): string {
  return JSON.stringify(report, null, 2);
}
