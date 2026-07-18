import { isCellError, isRichGrid, toScalarGrid, type CellValue, type GridValue, type RichCellValue, type RichGridValue } from "./values.js";
import { type Matcher, type MatcherObject, type PrimitiveMatcher } from "./catalogue.js";
import { DEFAULT_NUM_TOL, richGridsEqual } from "./equality.js";

const MATCHER_KEYS = new Set([
  "error",
  "near",
  "tol",
  "ge",
  "gt",
  "le",
  "lt",
  "type",
  "matches",
  "shape",
  "not",
  "any-of",
  "all-of",
  // Rich-cell structural-subset keys (D1.A.5):
  "primitive",
  "engine",
  "formula",
  "formatted",
  "number_format",
  "hyperlink",
]);

const RICH_MATCHER_KEYS = new Set([
  "primitive",
  "engine",
  "formula",
  "formatted",
  "number_format",
  "hyperlink",
]);

function hasRichKey(m: MatcherObject): boolean {
  for (const k of Object.keys(m)) {
    if (RICH_MATCHER_KEYS.has(k)) return true;
  }
  return false;
}

/** distinguish a matcher object from a literal grid or cell */
export function isMatcherObject(m: unknown): m is MatcherObject {
  if (!m || typeof m !== "object" || Array.isArray(m)) return false;
  for (const k of Object.keys(m as object)) {
    if (MATCHER_KEYS.has(k)) return true;
  }
  return false;
}

export interface MatchResult {
  passed: boolean;
  /** failure reason for diagnostics; empty string when passed */
  detail: string;
}

// schema §6 matcher language; literals deep-compare, objects compose via not/any-of/all-of.
// Post-coalescing: actual is RichGridValue but legacy scalar matchers (number,
// CellError literals, MatcherObject with error/near/ge/...) continue to work
// against the projected primitive. New structural-subset matchers (primitive,
// engine, formula, formatted, ...) walk the rich cell directly.
export function evaluateMatcher(
  matcher: Matcher,
  actual: GridValue | RichGridValue,
  options: { numTolerance: number },
): MatchResult {
  if (isMatcherObject(matcher)) {
    return matchObject(matcher, actual, options);
  }
  if (Array.isArray(matcher)) {
    // Literal grid matcher — compare against projected scalar grid.
    return matchGrid(matcher as GridValue, toScalarGrid(actual), options);
  }
  // literal scalar — compare against single-cell grid (project rich to scalar).
  const scalarActual = toScalarGrid(actual);
  if (isScalarGrid(scalarActual)) {
    if (cellsEqual(matcher as CellValue, scalarActual[0][0], options.numTolerance)) {
      return { passed: true, detail: "" };
    }
    return {
      passed: false,
      detail: `expected ${formatCell(matcher as CellValue)}, got ${formatCell(scalarActual[0][0])}`,
    };
  }
  return {
    passed: false,
    detail: `expected scalar ${formatCell(matcher as CellValue)}, got grid ${formatGrid(scalarActual)}`,
  };
}

function matchObject(
  m: MatcherObject,
  actualAny: GridValue | RichGridValue,
  options: { numTolerance: number },
): MatchResult {
  // logical combinators first
  if (m.not !== undefined) {
    const inner = evaluateMatcher(m.not, actualAny, options);
    return { passed: !inner.passed, detail: inner.passed ? `expected NOT to match` : "" };
  }
  if (m["any-of"]) {
    for (const sub of m["any-of"]) {
      const r = evaluateMatcher(sub, actualAny, options);
      if (r.passed) return r;
    }
    return { passed: false, detail: `none of any-of branches matched` };
  }
  if (m["all-of"]) {
    for (const sub of m["all-of"]) {
      const r = evaluateMatcher(sub, actualAny, options);
      if (!r.passed) return r;
    }
    return { passed: true, detail: "" };
  }

  // shape-only check works for grids of any size
  if (m.shape) {
    const [rows, cols] = m.shape;
    if (actualAny.length !== rows || (actualAny[0]?.length ?? 0) !== cols) {
      return {
        passed: false,
        detail: `shape ${rows}x${cols} expected, got ${actualAny.length}x${actualAny[0]?.length ?? 0}`,
      };
    }
    return { passed: true, detail: "" };
  }

  // Rich-mode structural-subset matcher: any of primitive/engine/formula/
  // formatted/number_format/hyperlink present. Walks the rich cell directly.
  if (hasRichKey(m)) {
    if (!isRichGrid(actualAny)) {
      return {
        passed: false,
        detail: `rich matcher requires rich grid; got scalar`,
      };
    }
    if (actualAny.length !== 1 || actualAny[0].length !== 1) {
      return {
        passed: false,
        detail: `rich matcher expects scalar, got ${actualAny.length}x${actualAny[0]?.length ?? 0} grid`,
      };
    }
    const rc = actualAny[0][0];
    if (rc === null) {
      return { passed: false, detail: `rich matcher expects cell, got null` };
    }
    return matchRichCell(m, rc);
  }

  // Legacy scalar single-cell predicates — extract scalar via projection.
  const actual = toScalarGrid(actualAny);
  if (actual.length !== 1 || actual[0].length !== 1) {
    return {
      passed: false,
      detail: `matcher expects scalar, got ${actual.length}x${actual[0]?.length ?? 0} grid`,
    };
  }
  const v = actual[0][0];

  if (m.error !== undefined) {
    if (!isCellError(v)) {
      return { passed: false, detail: `expected error, got ${formatCell(v)}` };
    }
    if (m.error === "any") return { passed: true, detail: "" };
    if (v.error === m.error) return { passed: true, detail: "" };
    return { passed: false, detail: `expected error ${m.error}, got ${v.error}` };
  }
  if (m.type !== undefined) {
    const t = typeOf(v);
    if (t === m.type) return { passed: true, detail: "" };
    return { passed: false, detail: `expected type ${m.type}, got ${t}` };
  }
  if (m.matches !== undefined) {
    if (typeof v !== "string") return { passed: false, detail: `matches: expects string, got ${typeOf(v)}` };
    if (new RegExp(m.matches).test(v)) return { passed: true, detail: "" };
    return { passed: false, detail: `${JSON.stringify(v)} did not match ${m.matches}` };
  }
  if (m.near !== undefined) {
    if (typeof v !== "number") return { passed: false, detail: `near: expects number, got ${typeOf(v)}` };
    const tol = m.tol ?? options.numTolerance;
    if (Math.abs(v - m.near) <= tol) return { passed: true, detail: "" };
    return { passed: false, detail: `${v} not within ±${tol} of ${m.near}` };
  }
  if (m.ge !== undefined || m.gt !== undefined || m.le !== undefined || m.lt !== undefined) {
    if (typeof v !== "number") return { passed: false, detail: `range: expects number, got ${typeOf(v)}` };
    if (m.ge !== undefined && !(v >= m.ge)) return { passed: false, detail: `${v} not >= ${m.ge}` };
    if (m.gt !== undefined && !(v > m.gt)) return { passed: false, detail: `${v} not > ${m.gt}` };
    if (m.le !== undefined && !(v <= m.le)) return { passed: false, detail: `${v} not <= ${m.le}` };
    if (m.lt !== undefined && !(v < m.lt)) return { passed: false, detail: `${v} not < ${m.lt}` };
    return { passed: true, detail: "" };
  }
  return { passed: false, detail: "matcher object had no recognised key" };
}

// Structural-subset check against a single RichCellValue. Only the keys
// present on the matcher are compared; everything else is wildcard.
function matchRichCell(m: MatcherObject, rc: RichCellValue): MatchResult {
  if (m.primitive !== undefined) {
    const r = matchPrimitive(m.primitive, rc.primitive);
    if (!r.passed) return r;
  }
  if (m.engine !== undefined) {
    const r = matchStructuralSubset(
      m.engine,
      rc.engine as unknown as Record<string, unknown>,
      "engine",
    );
    if (!r.passed) return r;
  }
  if (m.formula !== undefined) {
    const r = matchExact("formula", m.formula, rc.formula);
    if (!r.passed) return r;
  }
  if (m.formatted !== undefined) {
    const r = matchExact("formatted", m.formatted, rc.formatted);
    if (!r.passed) return r;
  }
  if (m.number_format !== undefined) {
    const r = matchStructuralSubset(
      m.number_format,
      rc.number_format ?? {},
      "number_format",
    );
    if (!r.passed) return r;
  }
  if (m.hyperlink !== undefined) {
    const r = matchExact("hyperlink", m.hyperlink, rc.hyperlink);
    if (!r.passed) return r;
  }
  return { passed: true, detail: "" };
}

function matchPrimitive(m: PrimitiveMatcher, p: RichCellValue["primitive"]): MatchResult {
  if (m.kind !== p.kind) {
    return { passed: false, detail: `primitive.kind: expected ${m.kind}, got ${p.kind}` };
  }
  for (const key of ["value", "sentinel", "error_type", "reason", "collapsed"]) {
    const r = matchOptionalField(
      `primitive.${key}`,
      m as Record<string, unknown>,
      p as unknown as Record<string, unknown>,
      key,
    );
    if (!r.passed) return r;
  }
  return { passed: true, detail: "" };
}

function matchExact(path: string, expected: unknown, actual: unknown): MatchResult {
  if (actual === expected) return { passed: true, detail: "" };
  return {
    passed: false,
    detail: `${path}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
  };
}

function matchOptionalField(
  path: string,
  expected: Record<string, unknown>,
  actual: Record<string, unknown>,
  key: string,
): MatchResult {
  if (!(key in expected) || expected[key] === undefined) {
    return { passed: true, detail: "" };
  }
  return matchExact(path, expected[key], actual[key]);
}

// Recursive structural-subset check: every key in `expected` must equal the
// corresponding key in `actual`. Nested objects recurse; arrays/primitives
// compare deep-equally.
function matchStructuralSubset(
  expected: Record<string, unknown>,
  actual: Record<string, unknown> | undefined,
  path: string,
): MatchResult {
  if (actual === undefined) {
    return { passed: false, detail: `${path}: expected object, got undefined` };
  }
  for (const [k, v] of Object.entries(expected)) {
    if (v === undefined) continue;
    const av = actual[k];
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      const r = matchStructuralSubset(
        v as Record<string, unknown>,
        av as Record<string, unknown> | undefined,
        `${path}.${k}`,
      );
      if (!r.passed) return r;
    } else if (JSON.stringify(av) !== JSON.stringify(v)) {
      return {
        passed: false,
        detail: `${path}.${k}: expected ${JSON.stringify(v)}, got ${JSON.stringify(av)}`,
      };
    }
  }
  return { passed: true, detail: "" };
}

function matchGrid(
  expected: GridValue,
  actual: GridValue,
  options: { numTolerance: number },
): MatchResult {
  if (expected.length !== actual.length) {
    return {
      passed: false,
      detail: `row count: expected ${expected.length}, got ${actual.length}`,
    };
  }
  for (let r = 0; r < expected.length; r++) {
    if (expected[r].length !== actual[r].length) {
      return {
        passed: false,
        detail: `row ${r} col count: expected ${expected[r].length}, got ${actual[r].length}`,
      };
    }
    for (let c = 0; c < expected[r].length; c++) {
      if (!cellsEqual(expected[r][c], actual[r][c], options.numTolerance)) {
        return {
          passed: false,
          detail: `cell [${r}][${c}]: expected ${formatCell(expected[r][c])}, got ${formatCell(actual[r][c])}`,
        };
      }
    }
  }
  return { passed: true, detail: "" };
}

export function cellsEqual(a: CellValue, b: CellValue, tol: number): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  const aErr = isCellError(a);
  const bErr = isCellError(b);
  if (aErr && bErr) return a.error === b.error;
  if (aErr || bErr) return false;
  if (typeof a === "number" && typeof b === "number") {
    if (a === b) return true;
    if (Number.isNaN(a) && Number.isNaN(b)) return true;
    const diff = Math.abs(a - b);
    const mag = Math.max(Math.abs(a), Math.abs(b), 1);
    return diff / mag < tol;
  }
  if (typeof a === "boolean" && typeof b === "boolean") return a === b;
  if (typeof a !== typeof b) return false;
  return String(a) === String(b);
}

function typeOf(v: CellValue): string {
  if (v === null) return "null";
  if (isCellError(v)) return "error";
  return typeof v;
}

/** deep equality for 2D grids; reuses cellsEqual with a numeric tolerance.
 * Post-coalescing: accepts scalar (GridValue) or rich (RichGridValue) on
 * either side; rich grids are projected to scalar primitive before
 * comparison. Default divergence semantics = primitive axis only per the
 * coalescing-session locks; engine extras do not trigger divergence. */
export function gridsEqual(
  a: GridValue | RichGridValue,
  b: GridValue | RichGridValue,
  tol: number = DEFAULT_NUM_TOL,
): boolean {
  // B1 fix (2026-06-15): when BOTH sides are rich, compare over the rich primitive
  // KIND so the blank-vs-null (D8.β) and opaque distinctions survive — the scalar
  // projection collapses them (`blank`/`null` → `null`), manufacturing agreement on
  // a ratified divergence. A scalar side (recorded YAML, legacy fixture) can't carry
  // those distinctions, so it necessarily falls back to the lossy scalar compare.
  //
  // KNOWN EDGE (narrow): `isRichGrid` returns false for a grid whose cells are ALL
  // `null` (a bare `[[null]]` hole-grid, e.g. an empty driver read), so such a grid
  // degrades to the scalar path and loses the blank-vs-null distinction against a
  // populated rich grid. This does NOT affect the common case: a blank/null RESULT is
  // a rich cell (primitive kind `blank`/`null`) and IS detected as rich on both sides.
  // The gap only bites empty-read-hole vs null-primitive — rare, and arguably a
  // different relation (nothing-read vs runtime-null). Left as a documented assumption.
  if (isRichGrid(a) && isRichGrid(b)) {
    return richGridsEqual(a, b, tol);
  }
  const sa = toScalarGrid(a);
  const sb = toScalarGrid(b);
  if (sa.length !== sb.length) return false;
  for (let r = 0; r < sa.length; r++) {
    if (sa[r].length !== sb[r].length) return false;
    for (let c = 0; c < sa[r].length; c++) {
      if (!cellsEqual(sa[r][c], sb[r][c], tol)) return false;
    }
  }
  return true;
}

/** true for a 1×1 grid; lets callers unwrap [[v]] → v safely */
export function isScalarGrid(g: GridValue): boolean {
  return g.length === 1 && g[0].length === 1;
}

/** [[v]] → v; pass-through otherwise — for compact YAML emit and display */
export function unwrapScalar(g: GridValue): CellValue | GridValue {
  return isScalarGrid(g) ? g[0][0] : g;
}

export function formatCell(v: CellValue): string {
  if (v === null) return "(null)";
  if (isCellError(v)) return v.error;
  if (typeof v === "string") return v === "" ? '""' : JSON.stringify(v);
  return String(v);
}

export function formatGrid(g: GridValue | RichGridValue): string {
  const s = toScalarGrid(g);
  if (isScalarGrid(s)) return formatCell(s[0][0]);
  return "{" + s.map((r) => r.map(formatCell).join(", ")).join("; ") + "}";
}
