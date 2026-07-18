import { test } from "node:test"
import assert from "node:assert/strict"
import { computeForkCoverage } from "./fork-coverage.js"
import type { ManifestV5, ManifestV5TestEntry } from "./index.js"
import type { AssayForkAnnotationV1, AnnotationScope } from "./assay-fork-annotation.js"

// minimal manifest: computeForkCoverage reads only `tests[ref].partition.length`. A 2-class
// partition forks; a 1-class partition is uniform (converged). Cast the stub — the rest of the
// entry is irrelevant to the join.
function manifestWith(forked: string[], uniform: string[], aliases: Record<string, string> = {}): ManifestV5 {
  const tests: Record<string, ManifestV5TestEntry> = {}
  const entry = (classes: number) => ({ partition: new Array(classes).fill({ engines: [], values: [] }) } as unknown as ManifestV5TestEntry)
  for (const ref of forked) tests[ref] = entry(2)
  for (const ref of uniform) tests[ref] = entry(1)
  const aliasMap = Object.fromEntries(Object.entries(aliases).map(([k, target]) => [k, { target, kind: "public-ref" }]))
  return { tests, aliases: aliasMap } as unknown as ManifestV5
}

function ann(id: string, scope: AnnotationScope): AssayForkAnnotationV1 {
  return { id, author_id: "x", content: "c", scope, status: "published", created_at: "t", updated_at: "t" }
}

const refSet = (...refs: string[]): AnnotationScope => [{ kind: "ref-set", refs }]

test("classifies scoped refs as live-fork / converged / dangling (R3)", () => {
  const manifest = manifestWith(["SUM/forks"], ["SUM/uniform"])
  const report = computeForkCoverage(manifest, [ann("DV-1", refSet("SUM/forks", "SUM/uniform", "SUM/gone"))])
  const cov = report.annotations[0]
  assert.deepEqual(cov.liveFork, ["SUM/forks"])
  assert.deepEqual(cov.converged, ["SUM/uniform"])
  assert.deepEqual(cov.dangling, ["SUM/gone"])
  assert.equal(cov.coversLiveFork, true)
})

test("uncoveredForks lists forked refs with no covering annotation (contribution prompts)", () => {
  const manifest = manifestWith(["A/1", "A/2", "B/1"], [])
  const report = computeForkCoverage(manifest, [ann("DV-1", refSet("A/1"))])
  assert.equal(report.totals.forks, 3)
  assert.equal(report.totals.coveredForks, 1)
  assert.deepEqual(report.uncoveredForks, ["A/2", "B/1"])
})

test("an annotation covering only converged/dangling refs is flagged without a live fork", () => {
  const manifest = manifestWith(["A/1"], ["A/2"])
  const report = computeForkCoverage(manifest, [ann("DV-stale", refSet("A/2", "A/gone"))])
  assert.equal(report.annotations[0].coversLiveFork, false)
  assert.equal(report.totals.annotationsWithoutLiveFork, 1)
})

test("an OBSERVED-dimension predicate stays counted-unresolved; ref-set clauses still resolve", () => {
  const manifest = manifestWith(["A/1"], [])
  const scope: AnnotationScope = [
    { kind: "ref-set", refs: ["A/1"] },
    { kind: "predicate", query: { valueKind: "error" } }, // observed dim → needs the deferred matcher
  ]
  const report = computeForkCoverage(manifest, [ann("DV-1", scope)])
  const cov = report.annotations[0]
  assert.deepEqual(cov.liveFork, ["A/1"])
  assert.equal(cov.unresolvedPredicateClauses, 1)
})

// === author-declared predicate resolution (3e) ===

// forked entries carrying subject + published (gated) tags — what a tag-predicate resolves against.
function forkEntry(subject: string, tags: string[]): ManifestV5TestEntry {
  return { subject, tags, partition: [{ engines: [], values: [] }, { engines: [], values: [] }] } as unknown as ManifestV5TestEntry
}
function taggedManifest(entries: Record<string, ManifestV5TestEntry>): ManifestV5 {
  return { tests: entries, aliases: {} } as unknown as ManifestV5
}

test("a tag-predicate auto-covers every forked ref carrying the tag", () => {
  const manifest = taggedManifest({
    "A/1": forkEntry("A", ["volatile"]),
    "A/2": forkEntry("A", ["volatile", "spill"]),
    "B/1": forkEntry("B", ["financial"]),
  })
  const report = computeForkCoverage(manifest, [ann("DV-1", [{ kind: "predicate", query: { tags: ["volatile"] } }])])
  const cov = report.annotations[0]
  assert.deepEqual(cov.liveFork.sort(), ["A/1", "A/2"])
  assert.equal(cov.unresolvedPredicateClauses, 0)
  assert.equal(report.totals.coveredForks, 2)
  assert.deepEqual(report.uncoveredForks, ["B/1"])
})

test("tags within a clause are a conjunction (every listed tag must be present)", () => {
  const manifest = taggedManifest({
    "A/1": forkEntry("A", ["volatile", "spill"]),
    "A/2": forkEntry("A", ["volatile"]),
  })
  const report = computeForkCoverage(manifest, [ann("DV-1", [{ kind: "predicate", query: { tags: ["volatile", "spill"] } }])])
  assert.deepEqual(report.annotations[0].liveFork, ["A/1"])
})

test("subjectIn resolves on the published subject (membership)", () => {
  const manifest = taggedManifest({
    "SUM/1": forkEntry("SUM", []),
    "AVG/1": forkEntry("AVG", []),
    "MAX/1": forkEntry("MAX", []),
  })
  const report = computeForkCoverage(manifest, [ann("DV-1", [{ kind: "predicate", query: { subjectIn: ["SUM", "AVG"] } }])])
  assert.deepEqual(report.annotations[0].liveFork.sort(), ["AVG/1", "SUM/1"])
})

test("a predicate auto-cover dedupes against a ref-set naming the same fork (authored ref wins)", () => {
  const manifest = taggedManifest({ "A/1": forkEntry("A", ["volatile"]) })
  const scope: AnnotationScope = [
    { kind: "predicate", query: { tags: ["volatile"] } },
    { kind: "ref-set", refs: ["A/1"] },
  ]
  const report = computeForkCoverage(manifest, [ann("DV-1", scope)])
  assert.deepEqual(report.annotations[0].liveFork, ["A/1"]) // recorded once, not twice
  assert.equal(report.totals.coveredForks, 1)
})

test("a tag-predicate matching no fork covers nothing and is resolved (not unresolved)", () => {
  const manifest = taggedManifest({ "A/1": forkEntry("A", ["financial"]) })
  const report = computeForkCoverage(manifest, [ann("DV-1", [{ kind: "predicate", query: { tags: ["volatile"] } }])])
  const cov = report.annotations[0]
  assert.deepEqual(cov.liveFork, [])
  assert.equal(cov.unresolvedPredicateClauses, 0) // resolved (author-declared), just matched nothing
  assert.equal(report.totals.annotationsWithoutLiveFork, 0) // no resolved refs to judge
})

test("repeated refs within a scope are de-duplicated and a fork is covered once", () => {
  const manifest = manifestWith(["A/1"], [])
  const report = computeForkCoverage(manifest, [ann("DV-1", refSet("A/1", "A/1"))])
  assert.deepEqual(report.annotations[0].liveFork, ["A/1"])
  assert.equal(report.totals.coveredForks, 1)
})

test("a ref that is an alias to a live forked test resolves (covers the fork, does not dangle)", () => {
  const manifest = manifestWith(["DIVIDE/divide-by-zero"], [], { "op:divide/division": "DIVIDE/divide-by-zero" })
  const report = computeForkCoverage(manifest, [ann("DV-old", refSet("op:divide/division"))])
  const cov = report.annotations[0]
  assert.deepEqual(cov.liveFork, ["op:divide/division"]) // records the authored ref
  assert.deepEqual(cov.dangling, [])
  assert.equal(report.totals.coveredForks, 1) // keyed by the canonical target
  assert.equal(report.totals.uncoveredForks, 0)
})

test("a ref aliased to a missing target still dangles", () => {
  const manifest = manifestWith(["A/1"], [], { "old/ref": "A/deleted" })
  const report = computeForkCoverage(manifest, [ann("DV-1", refSet("old/ref"))])
  assert.deepEqual(report.annotations[0].dangling, ["old/ref"])
})

test("two annotations can cover the same fork; coveredForks counts it once", () => {
  const manifest = manifestWith(["A/1"], [])
  const report = computeForkCoverage(manifest, [ann("DV-1", refSet("A/1")), ann("DV-2", refSet("A/1"))])
  assert.equal(report.totals.annotations, 2)
  assert.equal(report.totals.coveredForks, 1)
  assert.equal(report.totals.uncoveredForks, 0)
})
