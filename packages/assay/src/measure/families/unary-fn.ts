// Unary-function probe family factory.
//
// Sweeps a single-argument function across argument TYPES via a cell ref
// (=FN(A1)) — the data-borne, runtime-checkable coercion case. Used for the
// coercion-heavy text/type functions (LEN, N, T, ISNUMBER) to test whether
// string↔number/blank/error coercion is the cross-cutting divergence surface.

import type { CellValue } from "../../format/values.js";
import type { Assignment, ProbeFamily } from "../family.js";

const ARG_TYPES = ["number", "numstr", "text", "bool", "blank", "error"] as const;

function argValue(type: string): CellValue | undefined {
  switch (type) {
    case "number": return 3;
    case "numstr": return '="3"'; // formula-seed → genuine text on both engines (see binary-op note)
    case "text": return "x";
    case "bool": return true;
    case "blank": return undefined; // untouched cell
    case "error": return "=NA()"; // formula → #N/A (error propagation)
    default: throw new Error(`bad arg type: ${type}`);
  }
}

export function unaryFnFamily(subject: string, fn: string): ProbeFamily {
  return {
    subject,
    axes: [
      { name: "arg_type", locus: "data-borne", runtimeCheckable: true, settings: ARG_TYPES.map((t) => ({ label: t })) },
    ],
    build(a: Assignment) {
      const grid: Record<string, CellValue> = {};
      const v = argValue(a.arg_type);
      if (v !== undefined) grid.A1 = v;
      return { formula: `=${fn}(A1)`, grid };
    },
  };
}
