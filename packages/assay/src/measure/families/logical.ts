// IF condition-coercion probe family.
//
// `=IF(A1, "Y", "N")` swept across the runtime type of the condition cell —
// how each engine coerces a non-boolean condition (number, numeric string,
// text, blank, error) to truthiness. Data-borne, runtime-checkable.

import type { CellValue } from "../../format/values.js";
import type { Assignment, ProbeFamily } from "../family.js";

const COND: Record<string, CellValue | undefined> = {
  nonzero: 1,
  zero: 0,
  numstr: '="1"', // numeric-looking string, formula-seeded → genuine text on both engines
  text: "x", // non-numeric string
  blank: undefined, // untouched cell
  error: "=NA()", // #N/A
};

export const ifFamily: ProbeFamily = {
  subject: "IF",
  axes: [
    {
      name: "cond_type",
      locus: "data-borne",
      runtimeCheckable: true,
      settings: Object.keys(COND).map((label) => ({ label })),
    },
  ],
  build(a: Assignment) {
    const grid: Record<string, CellValue> = {};
    const v = COND[a.cond_type];
    if (v !== undefined) grid.A1 = v;
    return { formula: '=IF(A1, "Y", "N")', grid };
  },
};
