// Stability substrate, implementation item 2: the identity CI validator
// (approval record 2026-07-18, decision point 1). Two checks:
//
// 1. Freshness (always): the committed identity-lock.json must equal the
//    lock regenerated from the corpus — a stale lock blinds every other
//    check, so its absence or drift is itself a failure.
//
// 2. Classification (--against <base-lock.json>): every delta between the
//    base lock and the current lock must classify against the continuity
//    ledger (history/continuity.jsonl) as renamed / revised / moved /
//    retired; anything unclassified fails. This is a total mapping between
//    the before and after case populations, not a disappearance check — it
//    is what catches id capture, silent revision, and silent relocation.
//
// Namespace rules enforced in both modes: global id uniqueness (generation
// already enforces it), alias uniqueness, alias/live-id disjointness,
// rename compaction (a renamed-from ref must live on as an alias of its
// target so annotation scopes keep resolving in one hop), and permanent
// retirement (a retired ref never returns as a live id or an alias).
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { loadTestSuite } from "../build/format/parse.js";

const pkgDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const againstIdx = args.indexOf("--against");
const basePath = againstIdx >= 0 ? args[againstIdx + 1] : undefined;
if (againstIdx >= 0 && !basePath) fail("--against requires a path to the base lockfile");

const problems = [];

// -- load corpus (real parser), current lock, continuity, aliases
const entries = new Map();
const aliasOwners = new Map();
for (const file of readdirSync(join(pkgDir, "tests")).filter((f) => f.endsWith(".yaml")).sort()) {
  const suite = basename(file, ".yaml");
  for (const test of loadTestSuite(join(pkgDir, "tests", file)).tests) {
    entries.set(test.id, { stimulus: test.stimulusHash, suite });
    for (const alias of test.aliases ?? []) {
      if (aliasOwners.has(alias)) {
        problems.push(`alias ${alias} appears on both ${aliasOwners.get(alias)} and ${test.id}`);
      }
      aliasOwners.set(alias, test.id);
    }
  }
}
for (const alias of aliasOwners.keys()) {
  if (entries.has(alias)) problems.push(`alias ${alias} collides with a live case id`);
}

const lockPath = join(pkgDir, "identity-lock.json");
if (!existsSync(lockPath)) fail("identity-lock.json missing — run pnpm identity:lock and commit it");
const committed = JSON.parse(readFileSync(lockPath, "utf8"));
const fresh = Object.fromEntries([...entries.entries()].sort(([a], [b]) => (a < b ? -1 : 1)));
const committedEntries = committed.entries ?? {};
const freshJson = JSON.stringify(fresh);
if (JSON.stringify(committedEntries) !== freshJson) {
  problems.push("identity-lock.json is stale — run pnpm identity:lock and commit the result");
}

const continuity = [];
const continuityPath = join(pkgDir, "history", "continuity.jsonl");
if (existsSync(continuityPath)) {
  for (const line of readFileSync(continuityPath, "utf8").split("\n")) {
    if (line.trim()) continuity.push(JSON.parse(line));
  }
}
const retiredEver = new Set(continuity.filter((r) => r.kind === "retired").map((r) => r.case));
for (const id of retiredEver) {
  if (entries.has(id)) problems.push(`retired ref ${id} is live again — retirement is permanent`);
  if (aliasOwners.has(id)) problems.push(`retired ref ${id} reused as an alias — retirement is permanent`);
}

// -- classification against a base lock
if (basePath) {
  const base = JSON.parse(readFileSync(basePath, "utf8")).entries ?? {};
  const renames = continuity.filter((r) => r.kind === "renamed");
  const revisions = continuity.filter((r) => r.kind === "revised");
  const moves = continuity.filter((r) => r.kind === "moved");
  const renamedFrom = new Map(renames.map((r) => [r.from, r.to]));

  for (const [id, was] of Object.entries(base)) {
    const now = entries.get(id);
    if (now) {
      if (was.stimulus !== now.stimulus) {
        const rec = revisions.find(
          (r) => r.case === id && r.from_stimulus === was.stimulus && r.to_stimulus === now.stimulus,
        );
        if (!rec) problems.push(`case ${id}: stimulus changed with no matching revised record`);
      }
      if (was.suite !== now.suite) {
        const rec = moves.find(
          (r) => r.case === id && r.from_suite === was.suite && r.to_suite === now.suite,
        );
        if (!rec) problems.push(`case ${id}: moved ${was.suite} -> ${now.suite} with no moved record`);
      }
      continue;
    }
    const target = renamedFrom.get(id);
    if (target !== undefined) {
      if (!entries.has(target)) {
        problems.push(`case ${id}: renamed to ${target}, which is not a live id`);
      } else if (aliasOwners.get(id) !== target) {
        problems.push(
          `case ${id}: renamed to ${target} but not compacted — add ${id} to ${target}'s aliases`,
        );
      }
      continue;
    }
    if (retiredEver.has(id)) continue;
    problems.push(`case ${id} disappeared with no renamed/retired record`);
  }
}

if (problems.length > 0) {
  for (const p of problems) console.error(`identity: ${p}`);
  process.exit(1);
}
console.log(
  `identity: ok — ${entries.size} cases, ${aliasOwners.size} aliases, ` +
  `${continuity.length} continuity rows${basePath ? ", base classified" : ""}`,
);

function fail(msg) {
  console.error(`identity: ${msg}`);
  process.exit(1);
}
