import assert from "node:assert/strict"
import { test } from "node:test"
import { ALL_CAUSES, ASSAY_FORK_ANNOTATION_VERSION, isCause } from "./index.js"
import type { AssayForkAnnotationV1 } from "./index.js"

test("fork-annotation contract is v1", () => {
  assert.equal(ASSAY_FORK_ANNOTATION_VERSION, 1)
})

test("isCause recognizes the closed cause enum", () => {
  assert.ok(isCause("error-attribution"))
  assert.ok(ALL_CAUSES.every((c) => isCause(c)))
  assert.equal(isCause("not-a-cause"), false)
})

test("a well-formed annotation is assignable to AssayForkAnnotationV1", () => {
  const annotation: AssayForkAnnotationV1 = {
    id: "DV-0001",
    author_id: "auto-seeded (provisional)",
    content: "excel forks on error attribution",
    cause: "error-attribution",
    status: "published",
    verified_by: null, // auto-seeded / provisional default
    verified_at: null,
    scope: [
      { kind: "ref-set", refs: ["IFERROR/nested"] },
      { kind: "predicate", query: { tags: ["volatile"], valueKind: "number" } },
    ],
    created_at: "2026-06-26T00:00:00.000Z",
    updated_at: "2026-06-26T00:00:00.000Z",
  }
  assert.equal(annotation.scope.length, 2)
})

test("a verified annotation carries an attributed verifier + timestamp", () => {
  const verified: AssayForkAnnotationV1 = {
    id: "DV-0002",
    author_id: "auto-seeded (provisional)",
    content: "gsheets forks on precision",
    cause: "precision",
    status: "published",
    verified_by: "octocat",
    verified_at: "2026-06-27T00:00:00.000Z",
    scope: [{ kind: "ref-set", refs: ["GEOMEAN/geomean-perfect-square"] }],
    created_at: "2026-06-26T00:00:00.000Z",
    updated_at: "2026-06-27T00:00:00.000Z",
  }
  assert.equal(verified.verified_by, "octocat")
  assert.ok(verified.verified_at)
})
