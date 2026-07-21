import assert from "node:assert/strict";
import test from "node:test";
import { shouldInlineNamedFunctions } from "./named-function-rollout.js";

test("keeps named-function materialization disabled by default", () => {
  assert.equal(shouldInlineNamedFunctions("sheet-a", undefined, undefined), false);
  assert.equal(shouldInlineNamedFunctions("sheet-a", "disabled", "sheet-b"), false);
});

test("enables the global inline mode", () => {
  assert.equal(shouldInlineNamedFunctions("sheet-a", "inline", undefined), true);
});

test("enables only exact canary spreadsheet ids", () => {
  const canaries = " sheet-a, sheet-b ,,";
  assert.equal(shouldInlineNamedFunctions("sheet-a", undefined, canaries), true);
  assert.equal(shouldInlineNamedFunctions("sheet-b", undefined, canaries), true);
  assert.equal(shouldInlineNamedFunctions("sheet", undefined, canaries), false);
});
