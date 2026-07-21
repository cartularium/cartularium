import assert from "node:assert/strict";
import test from "node:test";
import { NamedFunctionInlineError } from "@cartularium/formula-syntax";
import {
  inlineSnapshotNamedFunctions,
  NAMED_FUNCTION_ACCEPTANCE_LIMITS,
} from "./named-function-materializer.js";
import type { Snapshot } from "./snapshot.js";

function fixture(): Snapshot {
  return {
    spreadsheetId: "source",
    title: "source",
    namedRanges: [],
    namedFunctions: [
      { name: "ADD_ONE", definition: "LAMBDA(x,x+1)" },
      { name: "TWICE", definition: "LAMBDA(x,ADD_ONE(x)*2)" },
    ],
    sheets: [
      {
        sheetId: 0,
        title: "Answer",
        rowCount: 10,
        columnCount: 10,
        cells: [[{ ue: { formulaValue: "=TWICE(A1)" } }]],
      },
    ],
  };
}

test("inlines a snapshot without mutating the stored program", () => {
  const original = fixture();
  const output = inlineSnapshotNamedFunctions(original);
  assert.equal(output.sheets[0].cells[0][0]?.ue?.formulaValue, "=LAMBDA(x,LAMBDA(x,x+1)(x)*2)(A1)");
  assert.deepEqual(output.namedFunctions, []);
  assert.equal(original.sheets[0].cells[0][0]?.ue?.formulaValue, "=TWICE(A1)");
  assert.equal(original.namedFunctions.length, 2);
});

test("materializes direct recursion without unrolling it", () => {
  const original = fixture();
  original.namedFunctions = [
    { name: "COUNTDOWN", definition: "LAMBDA(n,IF(n=0,0,1+COUNTDOWN(n-1)))" },
  ];
  original.sheets[0].cells = [[{ ue: { formulaValue: "=COUNTDOWN(10)" } }]];
  const formula = inlineSnapshotNamedFunctions(original).sheets[0].cells[0][0]?.ue?.formulaValue;
  assert.match(formula ?? "", /LUDUS_SELF_1\(LUDUS_SELF_1,n-1\)/);
  assert.equal(formula?.match(/IF\(/g)?.length, 1);
});

test("drops unreachable definitions without interpreting their bodies", () => {
  const original = fixture();
  original.namedFunctions.push({
    name: "UNUSED_CONTEXTUAL",
    definition: "LAMBDA(x,x+B2)",
  });
  const output = inlineSnapshotNamedFunctions(original);
  assert.equal(output.sheets[0].cells[0][0]?.ue?.formulaValue, "=LAMBDA(x,LAMBDA(x,x+1)(x)*2)(A1)");
  assert.deepEqual(output.namedFunctions, []);
});

test("pins the launch acceptance limits", () => {
  assert.deepEqual(NAMED_FUNCTION_ACCEPTANCE_LIMITS, {
    maxDefinitions: 256,
    maxDepth: 20,
    maxFormulaLength: 50_000,
    maxTotalFormulaCharacters: 1_000_000,
  });
});

test("rejects mutual recursion", () => {
  const original = fixture();
  original.namedFunctions = [
    { name: "F", definition: "LAMBDA(x,G(x))" },
    { name: "G", definition: "LAMBDA(x,F(x))" },
  ];
  original.sheets[0].cells = [[{ ue: { formulaValue: "=F(1)" } }]];
  assert.throws(
    () => inlineSnapshotNamedFunctions(original),
    (error) => error instanceof NamedFunctionInlineError && error.code === "recursive-definition",
  );
});

test("rejects named-function and named-range collisions", () => {
  const original = fixture();
  original.namedRanges.push({ name: "TWICE", range: { sheetId: 0 } });
  assert.throws(
    () => inlineSnapshotNamedFunctions(original),
    (error) => error instanceof NamedFunctionInlineError && error.code === "ambiguous-name",
  );
});

test("rejects context-dependent references inside used definitions", () => {
  const original = fixture();
  original.namedFunctions = [{ name: "OFFSET_VALUE", definition: "LAMBDA(x,x+$B2)" }];
  original.sheets[0].cells = [[{ ue: { formulaValue: "=OFFSET_VALUE(1)" } }]];
  assert.throws(
    () => inlineSnapshotNamedFunctions(original),
    (error) =>
      error instanceof NamedFunctionInlineError && error.code === "context-dependent-reference",
  );
});

test("bounds total workbook expansion", () => {
  assert.throws(
    () => inlineSnapshotNamedFunctions(fixture(), { maxTotalFormulaCharacters: 10 }),
    (error) => error instanceof NamedFunctionInlineError && error.code === "expansion-limit",
  );
});
