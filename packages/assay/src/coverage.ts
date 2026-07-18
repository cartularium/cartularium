// function-coverage of the corpus against the Lattice function universe
// schema v2 §2: a function is "covered" iff some test sets `subject: <FUNCNAME>`
// non-function subjects (op:*, feature:*, lit:*) don't count
// formula-call scanning is a secondary signal — surfaces incidental refs

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import * as YAML from "yaml";
import { loadFunctionUniverse } from "./scaffold.js";

export interface CoverageReport {
  universe: number;
  covered: number;
  byCategory: Array<{
    category: string;
    covered: number;
    total: number;
    uncovered: string[];
  }>;
  // funcs in formulas with no dedicated test
  referencedButNotSubject: string[];
  // bare `subject:` values that don't match any known function (typos / removed)
  unknownSubjects: string[];
}

const FORMULA_CALL_RE = /[=,(\s]([A-Z][A-Z0-9_.]*)\(/g;
const BARE_SUBJECT_RE = /^[A-Z][A-Z0-9_.]*$/;

function walkYaml(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walkYaml(p));
    else if (e.isFile() && e.name.endsWith(".yaml")) out.push(p);
  }
  return out;
}

export function computeCoverage(
  refDir: string,
  testsDir: string,
): CoverageReport {
  const universe = loadFunctionUniverse(refDir);

  const subjects = new Set<string>();
  const referencedInFormulas = new Set<string>();

  for (const f of walkYaml(testsDir)) {
    const text = readFileSync(f, "utf8");

    let doc: { tests?: Array<{ subject?: unknown }> } | undefined;
    try {
      doc = YAML.parse(text);
    } catch {
      continue;
    }
    for (const t of (doc?.tests ?? [])) {
      if (typeof t?.subject === "string" && BARE_SUBJECT_RE.test(t.subject)) {
        subjects.add(t.subject);
      }
    }

    for (const m of text.matchAll(FORMULA_CALL_RE)) {
      if (universe.has(m[1])) referencedInFormulas.add(m[1]);
    }
  }

  const covered = new Set([...subjects].filter((s) => universe.has(s)));
  const unknownSubjects = [...subjects].filter((s) => !universe.has(s)).sort();
  const referencedButNotSubject = [...referencedInFormulas]
    .filter((n) => !covered.has(n))
    .sort();

  const byCat = new Map<string, { covered: string[]; uncovered: string[] }>();
  for (const spec of universe.values()) {
    const bucket = byCat.get(spec.category) ?? { covered: [], uncovered: [] };
    (covered.has(spec.name) ? bucket.covered : bucket.uncovered).push(spec.name);
    byCat.set(spec.category, bucket);
  }

  const byCategory = [...byCat.entries()]
    .map(([category, { covered: c, uncovered: u }]) => ({
      category,
      covered: c.length,
      total: c.length + u.length,
      uncovered: u.sort(),
    }))
    .sort((a, b) => b.total - a.total);

  return {
    universe: universe.size,
    covered: covered.size,
    byCategory,
    referencedButNotSubject,
    unknownSubjects,
  };
}

export function printCoverageReport(report: CoverageReport, verbose = false): void {
  const pct = ((report.covered / report.universe) * 100).toFixed(1);
  console.log(`\nFunction coverage: ${report.covered} / ${report.universe}  (${pct}%)\n`);

  const maxCatWidth = Math.max(...report.byCategory.map((r) => r.category.length));
  console.log(
    `${"category".padEnd(maxCatWidth)}  ${"covered".padStart(7)}  ${"total".padStart(5)}  ${"%".padStart(5)}`,
  );
  console.log("-".repeat(maxCatWidth + 26));
  for (const r of report.byCategory) {
    const p = ((r.covered / r.total) * 100).toFixed(1);
    console.log(
      `${r.category.padEnd(maxCatWidth)}  ${String(r.covered).padStart(7)}  ${String(r.total).padStart(5)}  ${p.padStart(5)}`,
    );
  }

  if (verbose) {
    for (const r of report.byCategory) {
      if (r.uncovered.length === 0) continue;
      console.log(`\n${r.category} — ${r.uncovered.length} uncovered:`);
      const line = r.uncovered.join(", ");
      for (let i = 0; i < line.length; i += 80) {
        console.log(`  ${line.slice(i, i + 80)}`);
      }
    }
  }

  if (report.referencedButNotSubject.length > 0) {
    console.log(
      `\n${report.referencedButNotSubject.length} function(s) appear in formulas but no test sets them as \`subject:\`:`,
    );
    if (verbose) {
      console.log(`  ${report.referencedButNotSubject.join(", ")}`);
    }
  }

  if (report.unknownSubjects.length > 0) {
    console.log(`\n${report.unknownSubjects.length} bare \`subject:\` value(s) don't match any function in the universe:`);
    console.log(`  ${report.unknownSubjects.join(", ")}`);
  }
}
