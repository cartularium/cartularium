// Structural-divergence probe families — the areas most likely to diverge that
// the first arrays/lambdas pass skipped (and that the maintainer flagged):
//  - op:@              implicit intersection (Excel-only operator)
//  - ref:operators     intersection-space / union / INDIRECT R1C1 / OFFSET
//  - feature:sort-order text/mixed/case collation
//  - feature:lambda-array  arrays *of* lambdas (vs lambdas over arrays)
//
// All `form`/`case` axes are syntactic (the structure is in the formula text).
// Non-numeric text seeds store faithfully on both engines; numeric inputs are
// raw numbers. Each family is small — every probe is spot-checked.

import type { CellValue } from "../../format/values.js";
import type { Assignment, BuildResult, ProbeFamily } from "../family.js";

const COL3: Record<string, CellValue> = { D1: 1, D2: 2, D3: 3 };

// Implicit intersection `@` — Excel-only operator; Sheets has no equivalent.
export const implicitIntersectionFamily: ProbeFamily = {
  subject: "feature:implicit-intersection",
  axes: [
    { name: "form", locus: "syntactic", settings: [{ label: "at-col" }, { label: "at-row" }, { label: "at-fn" }] },
  ],
  build(a: Assignment): BuildResult {
    switch (a.form) {
      case "at-col": return { formula: "=@D1:D3", grid: COL3 };
      case "at-row": return { formula: "=@D1:F1", grid: { D1: 1, E1: 2, F1: 3 } };
      case "at-fn": return { formula: "=SUM(@D1:D3)", grid: COL3 };
      default: throw new Error(`bad form: ${a.form}`);
    }
  },
};

// Reference operators: range (control), intersection (space), union, INDIRECT
// (A1 vs R1C1), OFFSET.
export const refOpsFamily: ProbeFamily = {
  subject: "ref:operators",
  axes: [
    {
      name: "form",
      locus: "syntactic",
      settings: [
        { label: "range" },
        { label: "intersect-space" },
        { label: "union" },
        { label: "indirect-a1" },
        { label: "indirect-r1c1" },
        { label: "offset" },
      ],
    },
  ],
  build(a: Assignment): BuildResult {
    switch (a.form) {
      case "range": return { formula: "=SUM(D1:D3)", grid: COL3 };
      case "intersect-space": return { formula: "=SUM(D1:D3 D2:D2)", grid: COL3 }; // ∩ = D2
      case "union": return { formula: "=SUM((D1:D1,D3:D3))", grid: COL3 }; // union ref
      case "indirect-a1": return { formula: '=INDIRECT("D2")', grid: COL3 };
      case "indirect-r1c1": return { formula: '=INDIRECT("R2C4",FALSE)', grid: COL3 };
      case "offset": return { formula: "=OFFSET(D1,1,0)", grid: COL3 };
      default: throw new Error(`bad form: ${a.form}`);
    }
  },
};

// Sort collation + sort-argument semantics, over a fixed column range D1:D3.
// Two axes, cleanly separated by locus:
//  - `data`  (data-borne): WHAT is sorted — number / text-case / mixed-type —
//            tests collation. Varies the grid, not the formula.
//  - `order` (syntactic): the 3rd argument — omitted vs Excel's sort_order=-1 vs
//            a boolean FALSE. Excel reads it as sort_order (1/-1); Sheets reads
//            it as is_ascending (boolean) — a real semantics divergence.
export const sortOrderFamily: ProbeFamily = {
  subject: "feature:sort-order",
  axes: [
    {
      name: "data",
      locus: "data-borne",
      runtimeCheckable: false,
      settings: [{ label: "num" }, { label: "textcase" }, { label: "mixed" }],
    },
    {
      name: "order",
      locus: "syntactic",
      settings: [{ label: "asc" }, { label: "desc-num" }, { label: "desc-bool" }],
    },
  ],
  build(a: Assignment): BuildResult {
    const grid: Record<string, CellValue> =
      a.data === "num"
        ? { D1: 3, D2: 1, D3: 2 }
        : a.data === "textcase"
          ? { D1: "b", D2: "A", D3: "a" }
          : { D1: 2, D2: "a", D3: 1 };
    const formula =
      a.order === "asc"
        ? "=SORT(D1:D3)"
        : a.order === "desc-num"
          ? "=SORT(D1:D3,1,-1)"
          : "=SORT(D1:D3,1,FALSE)";
    return { formula, grid };
  },
};

// Arrays *of* lambdas (vs lambdas over arrays). Store lambdas as array elements
// and call them via MAP (the correct pattern — calling the result of INDEX(...)
// directly does not parse, which was an earlier probe-authoring error).
export const lambdaArrayFamily: ProbeFamily = {
  subject: "feature:lambda-array",
  axes: [
    {
      name: "form",
      locus: "syntactic",
      settings: [{ label: "map-over-lit" }, { label: "hstack-call" }, { label: "vstack-call" }],
    },
  ],
  build(a: Assignment): BuildResult {
    switch (a.form) {
      case "map-over-lit": return { formula: "=MAP({1;2;3}, LAMBDA(x, x*2))" }; // lambda over array (control)
      // array OF lambdas → MAP calls each element lambda. Expected Excel {2,3}.
      case "hstack-call":
        return { formula: "=MAP(HSTACK(LAMBDA(x, x+1), LAMBDA(x, x+2)), LAMBDA(x, x(1)))" };
      case "vstack-call":
        return { formula: "=MAP(VSTACK(LAMBDA(x, x*2), LAMBDA(x, x*3)), LAMBDA(x, x(5)))" };
      default: throw new Error(`bad form: ${a.form}`);
    }
  },
};

// Regex capability + dialect. Sheets uses RE2 via REGEXMATCH/REGEXEXTRACT/
// REGEXREPLACE; Excel's equivalents are REGEXTEST/REGEXEXTRACT/REGEXREPLACE
// (2024+). Tests function-name availability AND dialect (capture-group return).
export const regexFamily: ProbeFamily = {
  subject: "feature:regex",
  axes: [
    {
      name: "form",
      locus: "syntactic",
      settings: [
        { label: "match" },
        { label: "test" },
        { label: "extract" },
        { label: "capture" },
        { label: "replace" },
      ],
    },
  ],
  build(a: Assignment): BuildResult {
    switch (a.form) {
      case "match": return { formula: '=REGEXMATCH("abc123", "[0-9]+")' }; // Sheets name
      case "test": return { formula: '=REGEXTEST("abc123", "[0-9]+")' }; // Excel name
      case "extract": return { formula: '=REGEXEXTRACT("abc123", "[0-9]+")' };
      case "capture": return { formula: '=REGEXEXTRACT("2024-01", "([0-9]+)-([0-9]+)")' }; // capture-group return
      case "replace": return { formula: '=REGEXREPLACE("abc123", "[0-9]+", "#")' };
      default: throw new Error(`bad form: ${a.form}`);
    }
  },
};
