// Binary-operator probe family factory.
//
// Sweeps a binary operator across the cartesian of left/right operand TYPES,
// always via cell refs (=A1<op>B1) — the realistic case where the transpiler
// cannot see the operand types statically. So operand type is a DATA-BORNE axis,
// but `runtimeCheckable: true` (ISNUMBER/ISTEXT/ISBLANK can guard it) — which is
// what separates a coercion divergence (→ runtime-guard) from VLOOKUP's
// not-runtime-checkable found-ness (→ author-flag).
//
// Covers the maintainer's predicted #1 edge: string↔number + blank coercion.
// Deferred (bound): literal-operand encoding, error operands, mixed >2 arity.

import type { CellValue } from "../../format/values.js";
import type { Assignment, ProbeFamily } from "../family.js";

const TYPES = ["number", "numstr", "text", "bool", "blank"] as const;

// the grid value for an operand type; undefined ⇒ leave the cell untouched (blank)
function operandValue(type: string): CellValue | undefined {
  switch (type) {
    case "number": return 3;
    // Numeric-looking string seeded via a formula so BOTH engines store genuine
    // text (a raw "3" is coerced to a number by gsheets' USER_ENTERED write but
    // kept as text by Excel/openpyxl — an input-seeding asymmetry that would
    // confound the measurement). See docs/archive/divergence-measurement-breadth.
    case "numstr": return '="3"';
    case "text": return "x";
    case "bool": return true;
    case "blank": return undefined;
    default: throw new Error(`bad operand type: ${type}`);
  }
}

export function binaryOpFamily(subject: string, op: string): ProbeFamily {
  const typeAxis = (name: string): ProbeFamily["axes"][number] => ({
    name,
    locus: "data-borne",
    runtimeCheckable: true,
    settings: TYPES.map((t) => ({ label: t })),
  });
  return {
    subject,
    axes: [typeAxis("left_type"), typeAxis("right_type")],
    build(a: Assignment) {
      const grid: Record<string, CellValue> = {};
      const lv = operandValue(a.left_type);
      const rv = operandValue(a.right_type);
      if (lv !== undefined) grid.A1 = lv;
      if (rv !== undefined) grid.B1 = rv;
      return { formula: `=A1${op}B1`, grid };
    },
  };
}
