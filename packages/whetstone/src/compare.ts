// Grid comparison under a problem's declared policy. Shapes are compared after
// trimming trailing blanks; row order canonicalizes when the policy allows it.
import type { ComparePolicy } from "./problem.js";
import type { Scalar } from "./rect.js";

export interface GridMismatch {
  note: string;
  row?: number;
  expected?: Scalar;
  actual?: Scalar;
}

export interface GridComparison {
  pass: boolean;
  /** coarse category, safe to show for hidden cases */
  category: "match" | "wrong-shape" | "error-in-output" | "wrong-value";
  mismatches: GridMismatch[];
}

export function compareGrids(
  expected: Scalar[][],
  actual: Scalar[][],
  policy: ComparePolicy,
): GridComparison {
  const exp = trim(expected);
  const act = trim(actual);
  const epsilon = policy.numbers?.epsilon ?? 0;

  const actualErrors = act.flat().filter(isErrorSentinel);
  if (actualErrors.length > 0 && !exp.flat().some(isErrorSentinel)) {
    return {
      pass: false,
      category: "error-in-output",
      mismatches: [{ note: `output contains ${actualErrors[0]}` }],
    };
  }

  if (exp.length !== act.length || width(exp) !== width(act)) {
    return {
      pass: false,
      category: "wrong-shape",
      mismatches: [
        { note: `expected ${exp.length}x${width(exp)}, got ${act.length}x${width(act)}` },
      ],
    };
  }

  const expRows = policy.rowOrder === "any" ? sortRows(exp, epsilon) : exp;
  const actRows = policy.rowOrder === "any" ? sortRows(act, epsilon) : act;

  const mismatches: GridMismatch[] = [];
  for (let r = 0; r < expRows.length; r++) {
    for (let c = 0; c < width(exp); c++) {
      const e = expRows[r][c] ?? null;
      const a = actRows[r][c] ?? null;
      if (!cellEquals(e, a, epsilon)) {
        mismatches.push({ note: "cell differs", row: r, expected: e, actual: a });
      }
    }
  }
  return mismatches.length === 0
    ? { pass: true, category: "match", mismatches: [] }
    : { pass: false, category: "wrong-value", mismatches };
}

function cellEquals(e: Scalar, a: Scalar, epsilon: number): boolean {
  // blank-eq-empty default: null and "" are interchangeable
  const en = e === "" ? null : e;
  const an = a === "" ? null : a;
  if (en === null || an === null) return en === an;
  if (typeof en === "number" && typeof an === "number") {
    if (Object.is(en, an)) return true;
    const scale = Math.max(Math.abs(en), Math.abs(an), 1);
    return Math.abs(en - an) / scale <= epsilon;
  }
  return en === an;
}

// values.get renders errors as "#N/A" or "#N/A (message…)" — match the prefix
function isErrorSentinel(v: Scalar): boolean {
  return typeof v === "string" && /^#(N\/A|REF!|VALUE!|DIV\/0!|NAME\?|NUM!|NULL!|ERROR!)/.test(v);
}

function trim(rows: Scalar[][]): Scalar[][] {
  const blank = (v: Scalar) => v === null || v === "";
  let lastRow = -1;
  let lastCol = -1;
  rows.forEach((row, r) =>
    row.forEach((v, c) => {
      if (!blank(v)) {
        lastRow = Math.max(lastRow, r);
        lastCol = Math.max(lastCol, c);
      }
    }),
  );
  return rows.slice(0, lastRow + 1).map((row) => row.slice(0, lastCol + 1));
}

function width(rows: Scalar[][]): number {
  return Math.max(0, ...rows.map((r) => r.length));
}

// canonical row order for rowOrder:any — numbers keyed at just-beyond-epsilon
// precision so float noise can't reorder rows
function sortRows(rows: Scalar[][], epsilon: number): Scalar[][] {
  const digits = epsilon > 0 ? Math.min(12, Math.ceil(-Math.log10(epsilon)) - 1) : 12;
  const key = (row: Scalar[]) =>
    JSON.stringify(row.map((v) => (typeof v === "number" ? v.toPrecision(digits) : v)));
  return [...rows].sort((a, b) => key(a).localeCompare(key(b)));
}
