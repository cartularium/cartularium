// report function-universe coverage of the test corpus

import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { computeCoverage, printCoverageReport } from "../coverage.js";
import { values } from "./shared.js";
import { resolveDefaultRefDir } from "./scaffold.js";

export function coverage(): void {
  const refDir = (values["ref-dir"] as string | undefined) ?? resolveDefaultRefDir();
  const testsDir = resolve(process.cwd(), "tests");

  // coverage needs the lattice function-universe TSVs as a sibling checkout.
  // CI doesn't clone lattice (separate repo), so degrade to a clear no-op
  // instead of crashing inside printCoverageReport's empty-byCategory math.
  if (!existsSync(join(refDir, "excel_functions.tsv"))) {
    console.log(
      `coverage: no lattice function-universe TSVs at ${refDir} — pass --ref-dir=<lattice/spec/reference> or clone lattice as a sibling. skipping.`,
    );
    return;
  }

  const report = computeCoverage(refDir, testsDir);

  if (values.json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  printCoverageReport(report, values.verbose as boolean);
}
