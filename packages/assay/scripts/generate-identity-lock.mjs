// Stability substrate: emit the committed identity lockfile — the CI
// baseline that turns corpus identity changes into classified, loud events
// (approval record 2026-07-18, decision point 1). Maps every declared case
// id to its stimulus hash and suite. CI diffs this file against the corpus:
// every delta must classify as renamed / revised / moved / new / retired
// with the matching continuity record.
//
// Also enforces, at generation time:
// - global id uniqueness across all suites (the namespace is one namespace);
// - the equal-stimulus diagnostic: distinct ids sharing a stimulus are
//   reported so accidental copies surface; intentional duplicates will be
//   declarable when the CI validator (implementation item 2) lands.
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { loadTestSuite } from "../build/format/parse.js";

const pkgDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const testsDir = join(pkgDir, "tests");

const entries = new Map();
for (const file of readdirSync(testsDir).filter((f) => f.endsWith(".yaml")).sort()) {
  const suite = basename(file, ".yaml");
  for (const test of loadTestSuite(join(testsDir, file)).tests) {
    const prior = entries.get(test.id);
    if (prior) {
      throw new Error(
        `duplicate case id ${test.id} in suites ${prior.suite} and ${suite} — the id namespace is global`,
      );
    }
    entries.set(test.id, { stimulus: test.stimulusHash, suite });
  }
}

const byStimulus = new Map();
for (const [id, e] of entries) {
  const ids = byStimulus.get(e.stimulus) ?? [];
  ids.push(id);
  byStimulus.set(e.stimulus, ids);
}
const shared = [...byStimulus.values()].filter((ids) => ids.length > 1);
for (const ids of shared) {
  console.warn(`equal stimulus: ${ids.join(" = ")}`);
}

const lock = {
  schemaVersion: "assay-identity-lock-v1",
  entries: Object.fromEntries([...entries.entries()].sort(([a], [b]) => (a < b ? -1 : 1))),
};
const path = join(pkgDir, "identity-lock.json");
const next = JSON.stringify(lock, null, 2) + "\n";
let prev = null;
try { prev = readFileSync(path, "utf8"); } catch { /* first generation */ }
writeFileSync(path, next);
console.log(
  `identity-lock: ${entries.size} cases, ${shared.length} equal-stimulus groups, ` +
  (prev === null ? "created" : prev === next ? "unchanged" : "updated"),
);
