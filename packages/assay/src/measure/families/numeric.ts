// Numeric-edge probe families: MOD and POWER.
//
// Targets the maintainer's predicted error/numeric edges: sign-of-result and
// divide-by-zero (MOD), negative base with fractional exponent and 0^0/0^-1
// (POWER). Operand signs/values are data-borne but runtime-checkable (a guard
// can test sign/zero); POWER also carries a `form` syntactic axis (`^` vs
// POWER) to see whether the two surfaces diverge from each other.

import type { CellValue } from "../../format/values.js";
import type { Assignment, ProbeFamily } from "../family.js";

export const modFamily: ProbeFamily = {
  subject: "MOD",
  axes: [
    { name: "dividend", locus: "data-borne", runtimeCheckable: true, settings: [{ label: "p7" }, { label: "n7" }] },
    { name: "divisor", locus: "data-borne", runtimeCheckable: true, settings: [{ label: "p3" }, { label: "n3" }, { label: "z0" }] },
    { name: "encoding", locus: "syntactic", settings: [{ label: "literal" }, { label: "ref" }] },
  ],
  build(a: Assignment) {
    const d = a.dividend === "n7" ? -7 : 7;
    const v = a.divisor === "z0" ? 0 : a.divisor === "n3" ? -3 : 3;
    if (a.encoding === "ref") {
      const grid: Record<string, CellValue> = { A1: d, B1: v };
      return { formula: "=MOD(A1, B1)", grid };
    }
    return { formula: `=MOD(${d}, ${v})` };
  },
};

const BASE: Record<string, string> = { p2: "2", n2: "-2", z0: "0" };
const EXP: Record<string, string> = { i2: "2", half: "0.5", ni1: "-1", z0: "0" };

export const powerFamily: ProbeFamily = {
  subject: "POWER",
  axes: [
    { name: "base", locus: "data-borne", runtimeCheckable: true, settings: [{ label: "p2" }, { label: "n2" }, { label: "z0" }] },
    { name: "exp", locus: "data-borne", runtimeCheckable: true, settings: [{ label: "i2" }, { label: "half" }, { label: "ni1" }, { label: "z0" }] },
    { name: "form", locus: "syntactic", settings: [{ label: "caret" }, { label: "fn" }] },
  ],
  build(a: Assignment) {
    const b = BASE[a.base];
    const e = EXP[a.exp];
    const formula = a.form === "fn" ? `=POWER(${b}, ${e})` : `=(${b})^(${e})`;
    return { formula };
  },
};
