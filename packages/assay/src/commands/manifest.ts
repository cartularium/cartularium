// emit the function manifest published at assay.sheets.wiki/manifest.json

import { writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { mkdirSync } from "node:fs";
import { buildManifest } from "../manifest/build.js";
import { loadDvs, loadFixtures, loadTests } from "../catalogue-site/load.js";
import { values } from "./shared.js";

export function manifest(): void {
  const catalogueDir = (values["catalogue-dir"] as string | undefined) ?? "divergences";
  const testsDir = (values["tests-dir"] as string | undefined) ?? "tests";
  const fixturesDir = "fixtures";
  const output = values["output"] as string | undefined;

  try {
    const dvs = loadDvs(catalogueDir);
    const tests = loadTests(testsDir);
    const fixtures = loadFixtures(fixturesDir, new Set(tests.keys()));
    const m = buildManifest({ dvs, tests, fixtures, generatedAt: new Date().toISOString() });
    const json = JSON.stringify(m, null, 2);

    if (output) {
      mkdirSync(dirname(output), { recursive: true });
      writeFileSync(output, json + "\n");
      console.error(`manifest: wrote ${Object.keys(m.functions).length} functions to ${output}`);
    } else {
      process.stdout.write(json + "\n");
    }
  } catch (e) {
    console.error(`manifest: ${(e as Error).message}`);
    process.exit(1);
  }
}
