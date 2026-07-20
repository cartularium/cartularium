import assert from "node:assert/strict";
import test from "node:test";
import { UnsupportedWorkbookError } from "./api.js";
import { judge } from "./judge.js";
import type { Problem } from "./problem-types.js";
import type { Snapshot } from "./snapshot.js";

const problem: Problem = {
  id: "ld-test",
  slug: "test",
  title: "Test",
  difficulty: 1,
  tags: [],
  statement: "test",
  template: { sheets: [{ title: "Sheet1" }], input: "Sheet1!A1:A1", output: "Sheet1!B1:B1" },
  reference: "=A1",
  compare: {},
  cases: [],
};

const snapshot: Snapshot = {
  spreadsheetId: "source",
  title: "source",
  namedRanges: [
    {
      name: "INPUT",
      range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 1 },
    },
    {
      name: "OUTPUT",
      range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 1, endColumnIndex: 2 },
    },
  ],
  namedFunctions: [],
  sheets: [{ sheetId: 0, title: "Sheet1", rowCount: 10, columnCount: 10, cells: [] }],
};

test("returns unsupported-feature before materialization for named functions", async () => {
  let materialized = false;
  const result = await judge(problem, "source", {
    extractSnapshot: async () => structuredClone(snapshot),
    extractNamedFunctions: async () => [{ name: "DOUBLE", definition: "LAMBDA(x,x*2)" }],
    rehydrate: async () => {
      materialized = true;
      return "scratch";
    },
  });

  assert.equal(result.verdict, "unsupported-feature");
  assert.match(result.lintErrors[0], /DOUBLE/);
  assert.equal(materialized, false);
});

test("returns unsupported-feature for an explicit workbook limit", async () => {
  const result = await judge(problem, "source", {
    extractSnapshot: async () => structuredClone(snapshot),
    extractNamedFunctions: async () => {
      throw new UnsupportedWorkbookError("XLSX export exceeds limit");
    },
  });

  assert.equal(result.verdict, "unsupported-feature");
  assert.deepEqual(result.lintErrors, ["XLSX export exceeds limit"]);
});

test("propagates inspection transport failures as judge errors", async () => {
  await assert.rejects(
    judge(problem, "source", {
      extractSnapshot: async () => structuredClone(snapshot),
      extractNamedFunctions: async () => {
        throw new Error("XLSX export: 503 unavailable");
      },
    }),
    /503 unavailable/,
  );
});
