// Array & shape probe families.
//
// Where formula *structure* (not value) is most likely to diverge Excel↔Sheets:
//  - arrayLit : what an array literal may CONTAIN. Excel array constants are
//               literals-only; Sheets allows functions/refs/expressions inside
//               `{…}`. Syntactic (visible in the formula).
//  - spill    : inherently-array functions (SEQUENCE/TRANSPOSE/SORT/UNIQUE) —
//               do the spilled shapes/values agree? Syntactic (the function).
//  - arrayOp  : an element-wise range operation bare vs ARRAYFORMULA-wrapped —
//               the known gsheets-needs-ARRAYFORMULA spill difference, as a
//               clean per-platform syntactic axis.
//
// All inputs are numbers/literals (no numeric-string seeds → no ingestion confound).

import type { CellValue } from "../../format/values.js";
import type { Assignment, BuildResult, ProbeFamily } from "../family.js";
import type { PlatformFormula } from "../../format/catalogue.js";

// --- array literal contents -------------------------------------------------
export const arrayLitFamily: ProbeFamily = {
  subject: "lit:array",
  axes: [
    {
      name: "content",
      locus: "syntactic",
      settings: [
        { label: "const1d" },
        { label: "const2d" },
        { label: "withref" },
        { label: "withfn" },
        { label: "withop" },
      ],
    },
  ],
  build(a: Assignment): BuildResult {
    switch (a.content) {
      case "const1d": return { formula: "={1,2,3}" };
      case "const2d": return { formula: "={1,2;3,4}" };
      case "withref": return { formula: "={1,2,D1}", grid: { D1: 5 } as Record<string, CellValue> };
      case "withfn": return { formula: "={1,2,SUM(D1:D2)}", grid: { D1: 5, D2: 6 } };
      case "withop": return { formula: "={1,2,1+1}" };
      default: throw new Error(`bad content: ${a.content}`);
    }
  },
};

// --- inherently-array (spill) functions ------------------------------------
export const spillFamily: ProbeFamily = {
  subject: "feature:spill",
  axes: [
    {
      name: "fn",
      locus: "syntactic",
      settings: [{ label: "seq" }, { label: "transpose" }, { label: "sort" }, { label: "unique" }],
    },
  ],
  build(a: Assignment): BuildResult {
    switch (a.fn) {
      case "seq": return { formula: "=SEQUENCE(2,3)" };
      case "transpose": return { formula: "=TRANSPOSE(D1:F1)", grid: { D1: 1, E1: 2, F1: 3 } };
      case "sort": return { formula: "=SORT(D1:D3)", grid: { D1: 3, D2: 1, D3: 2 } };
      case "unique": return { formula: "=UNIQUE(D1:D4)", grid: { D1: 1, D2: 1, D3: 2, D4: 3 } };
      default: throw new Error(`bad fn: ${a.fn}`);
    }
  },
};

// --- element-wise range op: bare vs ARRAYFORMULA ---------------------------
export const arrayOpFamily: ProbeFamily = {
  subject: "feature:array-op",
  axes: [
    { name: "context", locus: "syntactic", settings: [{ label: "bare" }, { label: "wrap" }] },
  ],
  build(a: Assignment): BuildResult {
    const grid: Record<string, CellValue> = { D1: 1, D2: 2, D3: 3 };
    if (a.context === "wrap") {
      // ARRAYFORMULA is gsheets-only; on Excel the bare range-op already spills.
      const formula: PlatformFormula = { excel: "=D1:D3*2", gsheets: "=ARRAYFORMULA(D1:D3*2)" };
      return { formula, grid };
    }
    return { formula: "=D1:D3*2", grid };
  },
};
