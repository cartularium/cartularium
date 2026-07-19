import test from "node:test"
import assert from "node:assert/strict"
import { ASSAY_FEATURES, isKnownAssayFeature } from "./index.js"

test("every registry name is known; unknown and near-miss names are not", () => {
  for (const name of ASSAY_FEATURES) {
    assert.equal(isKnownAssayFeature(name), true)
  }
  assert.equal(isKnownAssayFeature("broadcasing"), false)
  assert.equal(isKnownAssayFeature("spill"), false)
  assert.equal(isKnownAssayFeature(""), false)
})

test("the registry is the seven authored-intent names", () => {
  assert.deepEqual(
    [...ASSAY_FEATURES].sort(),
    [
      "broadcasting",
      "dynamic-arrays",
      "external-io",
      "higher-order-lambda",
      "lambda",
      "let-bindings",
      "regex",
    ],
  )
})
