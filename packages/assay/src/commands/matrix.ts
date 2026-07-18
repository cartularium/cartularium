// per-engine cause profile, pairwise agreement, divergence clusters

import { computeMatrix, jsonMatrix, printMatrix, seedCatalogue, VIEWS, type View } from "../divergence-matrix.js";
import { resolveFiles, values } from "./shared.js";

export function matrix(args: string[]): void {
  const files = resolveFiles(args);
  if (!files.length) {
    console.error("matrix: no test files matched (looked in tests/*.yaml)");
    process.exit(1);
  }

  const view = (values.view as string | undefined) ?? "headline";
  if (!(VIEWS as readonly string[]).includes(view)) {
    console.error(`matrix: --view must be one of ${VIEWS.join("|")} (got ${view})`);
    process.exit(2);
  }

  const limitStr = values.limit as string | undefined;
  const limit = limitStr ? parseInt(limitStr, 10) : undefined;
  if (limitStr && (Number.isNaN(limit!) || limit! <= 0)) {
    console.error(`matrix: --limit must be a positive integer (got ${limitStr})`);
    process.exit(2);
  }

  const report = computeMatrix(files);

  const seedDir = values["seed-catalogue"] as string | undefined;
  if (seedDir) {
    try {
      const result = seedCatalogue(report, seedDir, { force: values.force as boolean });
      console.log(`Seeded ${result.filesWritten} divergence file(s) into ${result.dir}/`);
      console.log(`  range: ${result.firstId} … ${result.lastId}`);
    } catch (e) {
      console.error(`seed-catalogue: ${(e as Error).message}`);
      process.exit(1);
    }
    return;
  }

  if (values.json) {
    console.log(jsonMatrix(report));
    return;
  }
  printMatrix(report, { view: view as View, limit, verbose: values.verbose as boolean });
}
