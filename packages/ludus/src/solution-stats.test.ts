import assert from "node:assert/strict";
import test from "node:test";
import { buildPostSolveStats, measureSolution, type SolutionMetrics } from "./solution-stats.js";
import type { Snapshot } from "./snapshot.js";

function snapshot(formulas: Array<{ sheet: string; formula: string }>): Snapshot {
  return {
    spreadsheetId: "source",
    title: "source",
    namedRanges: [],
    namedFunctions: [],
    sheets: formulas.map(({ sheet, formula }, sheetId) => ({
      sheetId,
      title: sheet,
      rowCount: 1,
      columnCount: 1,
      cells: [[{ ue: { formulaValue: formula } }]],
    })),
  };
}

test("measures solver formulas and unique function use", () => {
  const metrics = measureSolution(
    snapshot([
      { sheet: "About", formula: '=HYPERLINK("https://ludus.sheets.wiki/problems/example/", "example")' },
      { sheet: "Answer", formula: '=LET(note,"QUERY(fake)",QUERY(A1:B,"select *"))' },
      { sheet: "Helper", formula: "=_xlfn.FILTER(A:A,A:A<>\"\")" },
      { sheet: "Helper 2", formula: "=QUERY(C:C,\"select C\")" },
    ]),
  );

  const counted = [
    '=LET(note,"QUERY(fake)",QUERY(A1:B,"select *"))',
    "=_xlfn.FILTER(A:A,A:A<>\"\")",
    "=QUERY(C:C,\"select C\")",
  ];
  assert.deepEqual(metrics, {
    formulaCharacters: counted.reduce((sum, formula) => sum + formula.length, 0),
    formulaCells: 3,
    functions: ["FILTER", "LET", "QUERY"],
  });
});

test("withholds a cohort below the anonymous aggregate floor", () => {
  const current: SolutionMetrics = { formulaCharacters: 80, formulaCells: 1, functions: ["LET"] };
  assert.deepEqual(buildPostSolveStats(current, [current, current]), {
    sampleSize: 2,
    minimumSampleSize: 3,
    current,
    cohort: null,
  });
});

test("builds distributions and a per-solution function census", () => {
  const current: SolutionMetrics = { formulaCharacters: 100, formulaCells: 1, functions: ["LET", "QUERY"] };
  const stats = buildPostSolveStats(current, [
    current,
    { formulaCharacters: 50, formulaCells: 2, functions: ["QUERY", "QUERY"] },
    { formulaCharacters: 200, formulaCells: 4, functions: ["FILTER"] },
    { formulaCharacters: 150, formulaCells: 3, functions: ["LET"] },
  ]);

  assert.deepEqual(stats.cohort?.formulaCharacters, { min: 50, p25: 87.5, median: 125, p75: 162.5, max: 200 });
  assert.deepEqual(stats.cohort?.formulaCells, { min: 1, p25: 1.8, median: 2.5, p75: 3.3, max: 4 });
  assert.deepEqual(stats.cohort?.functions, [
    { name: "LET", solutions: 2, percent: 50 },
    { name: "QUERY", solutions: 2, percent: 50 },
    { name: "FILTER", solutions: 1, percent: 25 },
  ]);
});
