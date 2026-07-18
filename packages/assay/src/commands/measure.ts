// `assay measure` — divergence-measurement driver.
//
//   assay measure gen <family>       expand a probe family → a sweep suite
//   assay measure analyze <family>   read the swept fixtures → portability verdict
//
// The run step in between is the *unchanged* generate pipeline:
//   assay generate measure/suites/<family>.yaml -p excel,gsheets
// (locally, or on the runner box per docs/runner-ops.md). The sweep is just
// more test cases; only the analysis is new.

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import * as YAML from "yaml";
import { loadTestSuite } from "../format/index.js";
import { caseKey } from "../identity/index.js";
import { loadFixture, type FixtureFile } from "../fixtures.js";
import type { Platform } from "../format/values.js";
import { expandToSuite, validateBuilders, type ProbeFamily } from "../measure/family.js";
import { analyzeOutcomes } from "../measure/analyze.js";
import { decideVerdict } from "../measure/verdict.js";
import { buildRows, type ForeignPair, type LoadedProbe } from "../measure/partition.js";
import { buildReport, printReport, type EngineMeta } from "../measure/report.js";
import { vlookupFamily } from "../measure/families/vlookup.js";
import { matchFamily } from "../measure/families/match.js";
import { modFamily, powerFamily } from "../measure/families/numeric.js";
import { binaryOpFamily } from "../measure/families/binary-op.js";
import { unaryFnFamily } from "../measure/families/unary-fn.js";
import { ifFamily } from "../measure/families/logical.js";
import { dateFamily } from "../measure/families/date.js";
import { arrayLitFamily, spillFamily, arrayOpFamily } from "../measure/families/array.js";
import { lambdaFamily } from "../measure/families/lambda.js";
import {
  implicitIntersectionFamily,
  refOpsFamily,
  sortOrderFamily,
  lambdaArrayFamily,
  regexFamily,
} from "../measure/families/structural.js";

const FAMILIES: Record<string, ProbeFamily> = {
  vlookup: vlookupFamily,
  match: matchFamily,
  mod: modFamily,
  power: powerFamily,
  // binary-operator coercion sweeps (slug-safe family keys)
  concat: binaryOpFamily("op:&", "&"),
  add: binaryOpFamily("op:+", "+"),
  eq: binaryOpFamily("op:=", "="),
  // text / type coercion (unary)
  len: unaryFnFamily("LEN", "LEN"),
  n: unaryFnFamily("N", "N"),
  t: unaryFnFamily("T", "T"),
  isnumber: unaryFnFamily("ISNUMBER", "ISNUMBER"),
  // logical / date
  if: ifFamily,
  date: dateFamily,
  // arrays & shapes
  arraylit: arrayLitFamily,
  spill: spillFamily,
  arrayop: arrayOpFamily,
  // lambdas / higher-order
  lambda: lambdaFamily,
  // structural divergence (operators, references, sort collation, arrays-of-lambdas)
  impint: implicitIntersectionFamily,
  refops: refOpsFamily,
  sortorder: sortOrderFamily,
  lambdaarray: lambdaArrayFamily,
  regex: regexFamily,
};

// The foreign pair under measurement (Excel ↔ Sheets — the genuinely-foreign
// portability question). Tolerance matches assay's default divergence semantics.
const PAIR: ForeignPair = { a: "excel", b: "gsheets" };
const NUM_TOL = 1e-10;

const suitePath = (name: string) => `measure/suites/${name}.yaml`;
const reportPath = (name: string) => `measure/${name}.report.json`;

function resolveFamily(name: string | undefined): ProbeFamily {
  if (!name || !FAMILIES[name]) {
    const known = Object.keys(FAMILIES).join(", ");
    throw new Error(`unknown family "${name ?? ""}". Known families: ${known}`);
  }
  return FAMILIES[name];
}

function gen(name: string | undefined): void {
  const family = resolveFamily(name);
  const { unvalidated } = validateBuilders(family); // throws if a syntactic axis is mislabeled
  const { suite, stats } = expandToSuite(family);

  const path = suitePath(name!);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, YAML.stringify(suite));

  console.log(`measure gen ${name}: wrote ${stats.kept} probes → ${path}`);
  console.log(
    `  cartesian ${stats.combos}  ·  pruned ${stats.pruned}  ·  collisions ${stats.collisions}  ·  kept ${stats.kept}`,
  );
  if (unvalidated.length) {
    console.log(`  note: could not builder-validate syntactic axes (cardinality<2 under constraints): ${unvalidated.join(", ")}`);
  }
  console.log(`\nNext: run the engines (unchanged generate pipeline), then analyze:`);
  console.log(`  assay generate ${path} -p ${PAIR.a},${PAIR.b}`);
  console.log(`  assay measure analyze ${name}`);
}

function analyze(name: string | undefined): void {
  const family = resolveFamily(name);
  const path = suitePath(name!);
  if (!existsSync(path)) {
    throw new Error(`no sweep suite at ${path}. Run: assay measure gen ${name}`);
  }

  const suite = loadTestSuite(path);
  const probes: LoadedProbe[] = suite.tests.map((t) => ({
    caseKey: caseKey(t),
    name: t.name ?? t.id,
    tags: t.tags ?? [],
  }));

  const fixtures: Record<string, FixtureFile | null> = {
    [PAIR.a]: loadFixture(path, PAIR.a as Platform),
    [PAIR.b]: loadFixture(path, PAIR.b as Platform),
  };
  for (const eng of [PAIR.a, PAIR.b]) {
    if (!fixtures[eng]) {
      console.warn(`  warning: no ${eng} fixtures — every probe is incomplete on that engine. Run generate first.`);
    }
  }

  const { rows, outcomeRows } = buildRows(probes, fixtures, PAIR, NUM_TOL);
  const analysis = analyzeOutcomes(outcomeRows, family.axes.map((a) => a.name));
  const okRows = outcomeRows.filter((r) => !r.incomplete);
  const verdict = decideVerdict(family.subject, analysis, family.axes, okRows);

  const engines: EngineMeta[] = [PAIR.a, PAIR.b].map((p) => ({
    platform: p,
    generatedAt: fixtures[p]?.generatedAt,
  }));
  const report = buildReport(family.subject, PAIR, NUM_TOL, engines, family.axes, analysis, verdict, rows);

  printReport(report);
  const rp = reportPath(name!);
  writeFileSync(rp, JSON.stringify(report, null, 2) + "\n");
  console.log(`  report → ${rp}`);
}

function usage(): void {
  console.log("usage:");
  console.log("  assay measure gen <family>       expand a probe family into a sweep suite");
  console.log("  assay measure analyze <family>   analyze the swept fixtures → portability verdict");
  console.log(`  families: ${Object.keys(FAMILIES).join(", ")}`);
}

export function measure(args: string[]): void {
  const [sub, name] = args;
  switch (sub) {
    case "gen": return gen(name);
    case "analyze": return analyze(name);
    default: return usage();
  }
}
