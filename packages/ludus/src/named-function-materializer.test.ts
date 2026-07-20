import assert from "node:assert/strict";
import test from "node:test";
import { NamedFunctionInlineError } from "@cartularium/formula-syntax";
import { inlineSnapshotNamedFunctions } from "./named-function-materializer.js";
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

test("rejects named-function and named-range collisions", () => {
  const original = fixture();
  original.namedRanges.push({ name: "TWICE", range: { sheetId: 0 } });
  assert.throws(
    () => inlineSnapshotNamedFunctions(original),
    (error) => error instanceof NamedFunctionInlineError && error.code === "ambiguous-name",
  );
});

test("bounds total workbook expansion", () => {
  assert.throws(
    () => inlineSnapshotNamedFunctions(fixture(), { maxTotalFormulaCharacters: 10 }),
    (error) => error instanceof NamedFunctionInlineError && error.code === "expansion-limit",
  );
});
