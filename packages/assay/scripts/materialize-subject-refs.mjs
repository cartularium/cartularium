// One-time identity migration (stability substrate, approval record
// 2026-07-18): materialize the derived `subjectRef` as an explicit field on
// every case, so the id is fully declared and the derivation map can be
// frozen out of the live parser. Identity-preserving by construction and by
// assertion: ids, semanticHashes, and stimulusHashes must be byte-identical
// before and after, or the run aborts without writing.
//
// Runs through the real parser (build/), never a reimplementation — a
// hand-rolled replica mismatched half the corpus during the adversarial
// review. Requires `pnpm build` first. Idempotent: a second run is a no-op.
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadTestSuite } from "../build/format/parse.js";

const testsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "tests");
const CASE_OPEN = /^  - subject: /;
const FIELD_SUBJECT_REF = /^    subjectRef: /;

let filesChanged = 0;
let inserted = 0;

for (const file of readdirSync(testsDir).filter((f) => f.endsWith(".yaml")).sort()) {
  const path = join(testsDir, file);
  const before = loadTestSuite(path);
  const lines = readFileSync(path, "utf8").split("\n");

  // nth `  - subject:` line pairs with before.tests[n]; insert the derived
  // ref (already computed by the parser) unless the block declares one.
  const out = [];
  let caseIndex = -1;
  let pendingRef = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (CASE_OPEN.test(line)) {
      caseIndex += 1;
      const test = before.tests[caseIndex];
      if (!test) throw new Error(`${file}: more case blocks than parsed cases`);
      // look ahead within this block for an explicit subjectRef
      let hasExplicit = false;
      for (let j = i + 1; j < lines.length && !CASE_OPEN.test(lines[j]); j++) {
        if (FIELD_SUBJECT_REF.test(lines[j])) { hasExplicit = true; break; }
      }
      pendingRef = hasExplicit ? null : test.subjectRef;
      out.push(line);
      if (pendingRef) {
        out.push(`    subjectRef: ${pendingRef}`);
        inserted += 1;
        pendingRef = null;
      }
      continue;
    }
    out.push(line);
  }
  if (caseIndex + 1 !== before.tests.length) {
    throw new Error(`${file}: matched ${caseIndex + 1} case blocks, parsed ${before.tests.length}`);
  }

  const next = out.join("\n");
  if (next === lines.join("\n")) continue;

  writeFileSync(path, next);
  const after = loadTestSuite(path);
  if (after.tests.length !== before.tests.length) {
    throw new Error(`${file}: case count changed after migration`);
  }
  for (let n = 0; n < before.tests.length; n++) {
    const [b, a] = [before.tests[n], after.tests[n]];
    for (const k of ["id", "semanticHash", "stimulusHash"]) {
      if (b[k] !== a[k]) {
        throw new Error(`${file} case ${b.id}: ${k} changed (${b[k]} -> ${a[k]}) — identity not preserved, aborting`);
      }
    }
    if (a.subjectRef === undefined) throw new Error(`${file} case ${a.id}: no subjectRef after migration`);
  }
  filesChanged += 1;
}

console.log(`materialize-subject-refs: ${inserted} refs inserted across ${filesChanged} files`);

// Frozen here as one-time migration input, removed from the live parser
// (src/identity/subject-ref.ts) in the same change. Never edit: the live
// corpus carries explicit refs, and a map edit must not be able to re-key
// anything ever again.
export const FROZEN_SUBJECT_REF_MAP = {
  "op:+": "op:add", "op:-": "op:subtract", "op:*": "op:multiply",
  "op:/": "op:divide", "op:^": "op:power", "op:&": "op:concat",
  "op:=": "op:eq", "op:<>": "op:ne", "op:<": "op:lt", "op:<=": "op:lte",
  "op:>": "op:gt", "op:>=": "op:gte", TRUE: "lit:boolean", FALSE: "lit:boolean",
};
