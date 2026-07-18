// Lambda / higher-order probe family.
//
// Immediately-invoked LAMBDA plus the helper functions (MAP/REDUCE/SCAN/BYROW/
// MAKEARRAY) applied over arrays — the first place we expect helper-function
// availability to differ Excel↔Sheets (a function-identity, syntactic
// discriminator). All structure is in the formula text → syntactic.

import type { CellValue } from "../../format/values.js";
import type { Assignment, BuildResult, ProbeFamily } from "../family.js";

const ROW3: Record<string, CellValue> = { D1: 1, D2: 2, D3: 3 };
const GRID2x2: Record<string, CellValue> = { D1: 1, E1: 2, D2: 3, E2: 4 };

export const lambdaFamily: ProbeFamily = {
  subject: "LAMBDA",
  axes: [
    {
      name: "form",
      locus: "syntactic",
      settings: [
        { label: "iife" },
        { label: "map" },
        { label: "reduce" },
        { label: "scan" },
        { label: "byrow" },
        { label: "makearray" },
      ],
    },
  ],
  build(a: Assignment): BuildResult {
    switch (a.form) {
      case "iife": return { formula: "=LAMBDA(x, x+1)(5)" };
      case "map": return { formula: "=MAP(D1:D3, LAMBDA(x, x*2))", grid: ROW3 };
      case "reduce": return { formula: "=REDUCE(0, D1:D3, LAMBDA(acc, v, acc+v))", grid: ROW3 };
      case "scan": return { formula: "=SCAN(0, D1:D3, LAMBDA(acc, v, acc+v))", grid: ROW3 };
      case "byrow": return { formula: "=BYROW(D1:E2, LAMBDA(r, SUM(r)))", grid: GRID2x2 };
      case "makearray": return { formula: "=MAKEARRAY(2, 2, LAMBDA(r, c, r*c))" };
      default: throw new Error(`bad form: ${a.form}`);
    }
  },
};
