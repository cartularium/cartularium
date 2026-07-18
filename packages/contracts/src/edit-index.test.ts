import { test } from "node:test"
import { strict as assert } from "node:assert"
import {
  EDIT_INDEX_VERSION,
  CLOSED_KINDS,
  isEditIndexKind,
  assertSupportedEditIndexVersion,
} from "./edit-index.js"

test("EDIT_INDEX_VERSION is a positive integer", () => {
  assert.equal(typeof EDIT_INDEX_VERSION, "number")
  assert.ok(EDIT_INDEX_VERSION >= 1)
  assert.equal(Math.floor(EDIT_INDEX_VERSION), EDIT_INDEX_VERSION)
})

test("CLOSED_KINDS contains 'function' and only 'function'", () => {
  assert.ok(CLOSED_KINDS.has("function"))
  assert.equal(CLOSED_KINDS.size, 1)
})

test("isEditIndexKind accepts each known kind and rejects unknowns", () => {
  for (const k of ["function", "concept", "blog", "guide", "people", "about", "project", "other"]) {
    assert.ok(isEditIndexKind(k), `expected ${k} to be a kind`)
  }
  assert.equal(isEditIndexKind("garbage"), false)
  assert.equal(isEditIndexKind(""), false)
  assert.equal(isEditIndexKind("Function"), false)
})

test("assertSupportedEditIndexVersion accepts the current version", () => {
  assert.doesNotThrow(() =>
    assertSupportedEditIndexVersion({ version: EDIT_INDEX_VERSION }, "test-source"),
  )
})

test("assertSupportedEditIndexVersion throws on mismatched version", () => {
  assert.throws(
    () => assertSupportedEditIndexVersion({ version: EDIT_INDEX_VERSION + 99 }, "test-source"),
    /unsupported edit index version/,
  )
})

test("assertSupportedEditIndexVersion throws on missing version", () => {
  assert.throws(
    () => assertSupportedEditIndexVersion({ version: undefined }, "test-source"),
    /unsupported edit index version/,
  )
})

test("assertSupportedEditIndexVersion includes source in error message", () => {
  try {
    assertSupportedEditIndexVersion({ version: 999 }, "https://example.com/edit-index.json")
    assert.fail("expected throw")
  } catch (e) {
    assert.match(
      (e as Error).message,
      /from https:\/\/example\.com\/edit-index\.json/,
      "error should include source",
    )
  }
})
