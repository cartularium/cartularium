// One-time fixture lift to v2 for the EVIDENCE-GRADE engines only (gsheets,
// excel), per the approved design §5 and decision point 8. Hibernated
// engines' files stay v1 fossils behind the retained legacy reader.
//
// Per suite-file, never global: the corpus-wide semanticHash→id relation is
// one-to-many (23 collision groups), but within one suite file it is a
// function. Runs through the REAL parser (a re-implementation mismatched
// half the corpus during the adversarial review).
//
// Honesty rules:
// - lifted entries carry the CURRENT stimulus hash, which is sound exactly
//   because their semanticHash matched: the hash covers formula and grid,
//   so a match proves the stimulus is unchanged since recording;
// - run provenance is NOT fabricated: run_id/at are null and preLedger
//   marks the entry as recorded outside the ledger (the whole pre-run-#1
//   corpus is suspect; run #1 overwrites all of this);
// - nothing is silently dropped: each original v1 file is archived to
//   history/archive-pre-refounding/fixtures-v1/<suite>/<engine>.json
//   before its v2 replacement is written, so orphan entries (hash matches
//   no live case) keep their record in the fossil.
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadTestSuite } from "../build/format/parse.js";
import { liftEntryToOutcome } from "../build/fixtures.js";
import { fingerprintOutcome, FPV } from "../build/fingerprint/index.js";

const EVIDENCE_GRADE = ["gsheets", "excel"];
const pkgDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const archiveRoot = join(pkgDir, "history", "archive-pre-refounding", "fixtures-v1");

let lifted = 0, orphaned = 0, files = 0, skippedV2 = 0;

for (const file of readdirSync(join(pkgDir, "tests")).filter((f) => f.endsWith(".yaml")).sort()) {
  const suiteName = file.replace(/\.yaml$/, "");
  const suite = loadTestSuite(join(pkgDir, "tests", file));
  const byHash = new Map(suite.tests.map((t) => [t.semanticHash, t]));

  for (const engine of EVIDENCE_GRADE) {
    const path = join(pkgDir, "fixtures", suiteName, `${engine}.json`);
    if (!existsSync(path)) continue;
    const raw = JSON.parse(readFileSync(path, "utf8"));
    if (raw.schemaVersion === 2) { skippedV2++; continue; }

    const archivePath = join(archiveRoot, suiteName, `${engine}.json`);
    mkdirSync(dirname(archivePath), { recursive: true });
    copyFileSync(path, archivePath);

    const results = {};
    for (const [hash, entry] of Object.entries(raw.results ?? {})) {
      const test = byHash.get(hash);
      if (!test) { orphaned++; continue; } // stays in the archived v1 fossil
      const outcome = liftEntryToOutcome(entry, engine);
      const v2 = {
        outcome,
        stimulus: test.stimulusHash,
        fingerprint: fingerprintOutcome(outcome),
        fpv: FPV,
        run_id: null,
        at: null,
        preLedger: true,
      };
      if (entry["formula-as-evaluated"]) v2["formula-as-evaluated"] = entry["formula-as-evaluated"];
      results[test.id] = v2;
      lifted++;
    }
    writeFileSync(
      path,
      JSON.stringify({ schemaVersion: 2, platform: engine, generatedAt: raw.generatedAt, results }, null, 2) + "\n",
    );
    files++;
  }
}

console.log(
  `lift-fixtures-v2: ${lifted} entries lifted across ${files} files, ` +
  `${orphaned} orphan entries left in the fossil archive` +
  (skippedV2 ? `, ${skippedV2} already v2` : ""),
);
