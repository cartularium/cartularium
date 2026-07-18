// emit the function manifest published at assay.sheets.wiki/manifest.json
//
// Publishes ManifestV5 — the verdict-free comparison output (CP3). The relation
// layer (agreement partition + per-engine capability), no TestVerdict. Consumers
// on the V4 shape (sheets-wiki) are reworked onto V5, not back-compat-bridged.

import { writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { mkdirSync } from "node:fs";
import { buildManifestV5 } from "../manifest/build-v5.js";
import { loadDvs, loadFixtureOutcomes, loadTests } from "../catalogue-site/load.js";
import { values } from "./shared.js";

export function manifest(): void {
  const catalogueDir = (values["catalogue-dir"] as string | undefined) ?? "divergences";
  const testsDir = (values["tests-dir"] as string | undefined) ?? "tests";
  const fixturesDir = "fixtures";
  const output = values["output"] as string | undefined;

  try {
    const dvs = loadDvs(catalogueDir);
    const tests = loadTests(testsDir);
    const outcomes = loadFixtureOutcomes(fixturesDir, tests);
    const m = buildManifestV5({ dvs, tests, outcomes, generatedAt: new Date().toISOString() });
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
