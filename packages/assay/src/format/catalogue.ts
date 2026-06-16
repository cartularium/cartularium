// Catalogue vocabulary — test cases, suites, matchers, overrides, results, and
// divergences: everything the divergence catalogue speaks *above* the raw value
// layer.
//
// Depends on `./values.ts` (the value vocabulary a driver speaks) and on the
// `Cause` / `Category` enums from `@cartularium/contracts`. Nothing in
// `./values.ts` may import from here — the dependency is strictly
// catalogue → values, which keeps the driver surface independently extractable.

import type { CellValue, GridValue, RichGridValue, Platform } from "./values.js";
import type { Cause, Category } from "@cartularium/contracts";

// re-exported from @cartularium/contracts (canonical manifest enum surface)
export type { Cause, Category } from "@cartularium/contracts";
export { ALL_CATEGORIES, isCategory } from "@cartularium/contracts";

// bare uppercase identifier — matches function-name subjects, excludes
// op:*, feature:*, lit:*, ref:*, and the boolean literals "TRUE"/"FALSE"
const FN_NAME_RE = /^[A-Z][A-Z0-9_.]*$/;

export function isFunctionName(subject: string): boolean {
  return FN_NAME_RE.test(subject);
}

/** per-platform formula map */
export interface PlatformFormula {
  [platform: string]: string | undefined;
}

/** v2 test status */
export type Status = "verified" | "volatile" | "observed";

/** declared maturity of the covered surface, not an engine result */
export type SupportLevel =
  | "full"
  | "subset"
  | "stub"
  | "unsupported"
  | "design-pending";

// matcher language (schema §6); a Matcher is a CellValue literal, a 2D grid, or a MatcherObject (distinguished by these keys)
export interface MatcherObject {
  /** specific error code, or "any" */
  error?: string;
  /** numeric value within ±tol of `near` */
  near?: number;
  tol?: number;
  /** inclusive lower bound */
  ge?: number;
  /** strict lower bound */
  gt?: number;
  /** inclusive upper bound */
  le?: number;
  /** strict upper bound */
  lt?: number;
  type?: "number" | "string" | "boolean" | "error" | "grid" | "null";
  /** regex on string values */
  matches?: string;
  /** grid dimensions [rows, cols] only — values not compared */
  shape?: [number, number];
  not?: Matcher;
  "any-of"?: Matcher[];
  "all-of"?: Matcher[];

  // === Rich-cell structural-subset keys (D1.A.5 / coalescing 2026-05-23) ===
  // Presence of any of these switches the matcher into rich mode against
  // RichCellValue (single-cell). All keys are structural-subset checks: only
  // listed sub-fields are compared, others are wildcards.

  /** Match against the primitive variant (kind + value/sentinel/reason). */
  primitive?: PrimitiveMatcher;
  /** Match against engine-specific extras. Discriminated on `platform`. */
  engine?: Record<string, unknown>;
  /** Match shared formula text (no leading "="). */
  formula?: string;
  /** Match shared display string. */
  formatted?: string;
  /** Match shared number-format inference. */
  number_format?: { type?: string; pattern?: string };
  /** Match shared hyperlink target. */
  hyperlink?: string;
}

/** Structural-subset matcher for PrimitiveValue. Only listed fields compared. */
export type PrimitiveMatcher =
  | { kind: "number"; value?: number }
  | { kind: "string"; value?: string }
  | { kind: "boolean"; value?: boolean }
  | { kind: "error"; sentinel?: string }
  | { kind: "extended-error"; sentinel?: string; error_type?: number }
  | { kind: "blank"; reason?: "untouched" | "spill-recipient" | "formula-no-effective" }
  | { kind: "null"; reason?: "formula-returned-null" | "spill-null" }
  | { kind: "rich-text"; collapsed?: string };

export type Matcher = CellValue | CellValue[][] | MatcherObject;

/** per-engine override (schema §1) */
export interface Override {
  /** alternate matcher for this engine */
  expect?: Matcher;
  /** why the engine deviates */
  cause: Cause;
  /** engine's observed value at authoring time; runner flags drift */
  recorded?: CellValue | CellValue[][];
  note?: string;
}

/** cross-references (schema §9) */
export interface Links {
  divergence?: string; // DV-####
  issue?: number | string;
  "regression-of"?: string; // test id
}

/** a single assay test case */
export interface TestCase {
  /** v2 stable id `<file-stem>/<6-char hex>`; v3 public ref `subjectRef/name` */
  id: string;
  /** function name, op:..., lit:..., ref:..., or feature:... (schema §2) */
  subject: string;
  /** v3 public, URL-safe subject segment */
  subjectRef?: string;
  /** v3 slug describing the case within the subject */
  name?: string;
  /** v3 canonical hash of semantic fields */
  semanticHash?: `sha256:${string}`;
  /** v3 retired public refs that still resolve to this case */
  aliases?: string[];
  /** drives report grouping (schema §3) */
  category: Category;
  /** capability dependencies (schema §4) */
  features?: string[];
  /** surface maturity for this test/function slice */
  supportLevel?: SupportLevel;
  status?: Status;
  /** formula string or per-platform map */
  formula: string | PlatformFormula;
  grid?: Record<string, CellValue>;
  /** expected value or matcher; required unless status: observed */
  expect?: Matcher;
  /** per-engine overrides keyed by platform */
  overrides?: Partial<Record<Platform, Override>>;
  links?: Links;
  /** free-form descriptive tags */
  tags?: string[];
}

/** a test suite loaded from a YAML file */
export interface TestSuite {
  schemaVersion: 2 | 3;
  name?: string;
  /** named formula fragments for ${NAME} expansion */
  definitions?: Record<string, string>;
  /** named shared grids referenced via `grid: $name` */
  fixtures?: Record<string, Record<string, CellValue>>;
  /** @deprecated v1 passthrough; kept so excel-workbook bootstrap keeps compiling */
  requires?: Record<string, string>;
  tests: TestCase[];
}

/** result of running one test on one platform */
export interface TestResult {
  test: TestCase;
  platform: Platform;
  /** RichGridValue post-coalescing; consumers project to scalar via projectScalarGrid when needed */
  actual: RichGridValue;
  /** matcher resolved to a value when scalar — still scalar since matchers
   * are authored as scalar literals or matcher objects */
  expected?: GridValue;
  passed: boolean | null; // null = no expectation (status: observed, or no expect)
  error?: string;
  timeMs: number;
}

/** divergence between platforms on the same test */
export interface Divergence {
  test: TestCase;
  results: Record<string, RichGridValue>;
}
