import { test } from "node:test"
import { strict as assert } from "node:assert"
import { LOCKED_FIELDS_BY_KIND, lockedFieldsFor } from "./locked-fields.js"
import type { EditIndexKind } from "./edit-index.js"

test("LOCKED_FIELDS_BY_KIND locks the function-page governance fields", () => {
  assert.deepEqual(LOCKED_FIELDS_BY_KIND.function, [
    "title",
    "category",
    "engines",
    "aliases",
    "status",
  ])
})

test("LOCKED_FIELDS_BY_KIND has an entry for every EditIndexKind", () => {
  const kinds: EditIndexKind[] = [
    "function",
    "concept",
    "blog",
    "guide",
    "people",
    "about",
    "project",
    "other",
  ]
  for (const k of kinds) {
    assert.ok(LOCKED_FIELDS_BY_KIND[k] !== undefined, `expected entry for kind '${k}'`)
  }
})

test("LOCKED_FIELDS_BY_KIND non-function kinds lock no fields in P1", () => {
  assert.deepEqual(LOCKED_FIELDS_BY_KIND.concept, [])
  assert.deepEqual(LOCKED_FIELDS_BY_KIND.guide, [])
  assert.deepEqual(LOCKED_FIELDS_BY_KIND.blog, [])
})

test("lockedFieldsFor returns the kind's list", () => {
  assert.deepEqual(lockedFieldsFor("function"), LOCKED_FIELDS_BY_KIND.function)
  assert.deepEqual(lockedFieldsFor("concept"), [])
})
