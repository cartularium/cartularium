// emit starter yaml tests for one or more functions

import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { computeCoverage } from "../coverage.js";
import { loadFunctionUniverse, scaffoldFunction, scaffoldMany, type FunctionSpec } from "../scaffold.js";
import { values } from "./shared.js";

export function scaffold(args: string[]): void {
  const refDir = (values["ref-dir"] as string | undefined) ?? resolveDefaultRefDir();
  const universe = loadFunctionUniverse(refDir);

  if (universe.size === 0) {
    console.error(
      `scaffold: no functions found under ${refDir}\n` +
        `hint: pass --ref-dir pointing at the directory with excel_functions.tsv / gsheets_functions.tsv`,
    );
    process.exit(1);
  }

  let specs: FunctionSpec[] = [];
  const category = values.category as string | undefined;
  const uncovered = values.uncovered as boolean;

  if (args.length > 0) {
    const missing: string[] = [];
    for (const name of args) {
      const s = universe.get(name);
      if (!s) missing.push(name);
      else specs.push(s);
    }
    if (missing.length > 0) {
      console.error(`scaffold: unknown function(s): ${missing.join(", ")}`);
      process.exit(1);
    }
  } else if (category) {
    specs = [...universe.values()].filter((s) => s.category.toLowerCase() === category.toLowerCase());
    if (specs.length === 0) {
      console.error(`scaffold: no functions in category '${category}'`);
      process.exit(1);
    }
  } else if (uncovered) {
    const covered = computeCoveredFunctions(universe);
    specs = [...universe.values()].filter((s) => !covered.has(s.name));
  } else {
    console.error(
      "Usage: assay scaffold <FUNC> [<FUNC>...]\n" +
        "       assay scaffold --category <Name>\n" +
        "       assay scaffold --uncovered\n" +
        "Options:\n" +
        "  --ref-dir <path>   Directory with excel/gsheets_functions.tsv (default: ../lattice/spec/reference)",
    );
    process.exit(1);
  }

  if (args.length === 1) {
    // single function — emit just its block, no suite header
    const r = scaffoldFunction(specs[0]);
    process.stdout.write(r.yaml);
    return;
  }

  const headerCategory = category ?? specs[0]?.category ?? "Scaffolded";
  const fileStem = headerCategory.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "scaffold";
  const { yaml, summary } = scaffoldMany(specs, fileStem);
  const summaryLine = Object.entries(summary).map(([k, v]) => `${k}=${v}`).join(", ");
  const suite =
    `schemaVersion: 2\n` +
    `name: ${headerCategory} functions (scaffolded)\n` +
    `# scaffolded by \`assay scaffold\` on ${new Date().toISOString().slice(0, 10)}\n` +
    `# ${specs.length} function(s): ${summaryLine}\n` +
    `# All tests default to status:observed — generate fixtures, then harden expected values.\n\n` +
    `tests:\n${yaml}`;
  process.stdout.write(suite);
}

// walk up from cwd looking for a sibling lattice checkout. covers:
//   ../lattice         — pre-monorepo, assay run from its own repo root
//   ../../lattice      — pre-monorepo, assay run from a subdir
//   ../../../lattice   — monorepo, assay at cartularium/packages/assay with
//                        lattice as a sibling of cartularium
export function resolveDefaultRefDir(): string {
  const candidates = [
    resolve(process.cwd(), "../lattice/spec/reference"),
    resolve(process.cwd(), "../../lattice/spec/reference"),
    resolve(process.cwd(), "../../../lattice/spec/reference"),
  ];
  for (const c of candidates) {
    if (existsSync(join(c, "excel_functions.tsv"))) return c;
  }
  return candidates[0];
}

export function computeCoveredFunctions(universe: Map<string, FunctionSpec>): Set<string> {
  const refDir = (values["ref-dir"] as string | undefined) ?? resolveDefaultRefDir();
  const testsDir = resolve(process.cwd(), "tests");
  const report = computeCoverage(refDir, testsDir);
  const covered = new Set<string>();
  for (const row of report.byCategory) {
    for (const spec of universe.values()) {
      if (spec.category === row.category && !row.uncovered.includes(spec.name)) {
        covered.add(spec.name);
      }
    }
  }
  return covered;
}
