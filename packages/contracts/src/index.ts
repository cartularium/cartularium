// canonical manifest schema published by assay at assay.sheets.wiki/manifest.json
// and consumed by sheets-wiki at build time. see ASSAY-INTEGRATION.md for prose.

import type { Platform } from "./platform.js"
import type { CirculatingGrid } from "./cell-value.js"

export { ALL_PLATFORMS, isPlatform } from "./platform.js"
export type { Platform } from "./platform.js"

// closed enum of override causes (assay schema §7)
export const ALL_CAUSES = [
  "missing-function",
  "missing-arg-form",
  "argument-arity",
  "arg-semantics",
  "precision",
  "format-rendering",
  "locale",
  "shape",
  "array-orientation",
  "error-code",
  "error-attribution",
  "null-vs-zero",
  "recalc-semantics",
  "array-handling",
  "unimplemented-edge",
  "version-skew",
  "intentional-spec",
  "TODO",
] as const

export type Cause = (typeof ALL_CAUSES)[number]

export function isCause(value: string): value is Cause {
  return (ALL_CAUSES as readonly string[]).includes(value)
}

// test category (assay schema §3)
export const ALL_CATEGORIES = [
  "value",
  "shape",
  "error-code",
  "format",
  "locale",
  "interaction",
  "volatile",
] as const

export type Category = (typeof ALL_CATEGORIES)[number]

export function isCategory(value: string): value is Category {
  return (ALL_CATEGORIES as readonly string[]).includes(value)
}

export type EngineStatus = "available" | "missing" | "partial"

export type TestVerdict = "match" | "diverge"

export interface ManifestEngineEntry {
  status: EngineStatus
  via?: string
}

export interface ManifestFunctionEntry {
  engines: Record<Platform, ManifestEngineEntry>
  divergences: string[]
  tests: string[]
}

export interface ManifestDvEntry {
  summary: string
  cause: Cause
  category: Category
  engines: Platform[]
}

// engines with no fixture are absent (treat as no-data)
export interface ManifestTestEntry {
  subject: string
  engines: Partial<Record<Platform, TestVerdict>>
}

export interface ManifestV3 {
  version: 3
  generatedAt: string
  engines: readonly Platform[]
  dvs: Record<string, ManifestDvEntry>
  tests: Record<string, ManifestTestEntry>
  functions: Record<string, ManifestFunctionEntry>
}

export interface ManifestV4TestEntry {
  ref: string
  subject: string
  subjectRef: string
  name: string
  suite: string
  hash: `sha256:${string}`
  url: string
  aliases?: string[]
  engines: Partial<Record<Platform, TestVerdict>>
}

export interface ManifestV4AliasEntry {
  target: string
  kind: "public-ref"
}

export interface ManifestV4TombstoneEntry {
  reason: string
}

export interface ManifestV4FunctionEntry {
  engines: Record<Platform, ManifestEngineEntry>
  divergences: string[]
  tests: string[]
}

export interface ManifestV4 {
  version: 4
  generatedAt: string
  engines: readonly Platform[]
  dvs: Record<string, ManifestDvEntry>
  tests: Record<string, ManifestV4TestEntry>
  aliases: Record<string, ManifestV4AliasEntry>
  tombstones: Record<string, ManifestV4TombstoneEntry>
  hashes: Record<`sha256:${string}`, string>
  functions: Record<string, ManifestV4FunctionEntry>
}

export type Manifest = ManifestV3 | ManifestV4

// === ManifestV5 — the verdict-free comparison-output contract (CP2, 2026-06-17) ===
// Replaces the V4 `engines: Record<Platform, TestVerdict>` smush with two relation-layer
// axes — the agreement PARTITION (which engines agree: uniform vs forked) and per-engine
// CAPABILITY (did the engine produce a value). No canonical value, no reference engine, no
// verdict. The manifest is OBSERVATION ONLY: every interpretive layer is out of band, joined
// by case-ref — authored normative assertions ("oracles") in a self-check lens, and authored
// descriptive annotations (cause/summary/clustering) in the contributed annotation layer
// (the no-authority-over-meaning refinement, 2026-06-19). Neither is ever a field here.
// Added alongside V4; buildManifest re-seats onto it + the version bumps in the CP3 output step.

/** Per-engine capability + the join into the agreement partition. Only `value` engines carry
 * a `class` and appear in a `ManifestClass`; the rest produced no value (capture ≠ circulation,
 * so they are never folded into an agreement-class as if they agreed). `unsupported` is the one
 * capability-relevant skip ("engine lacks this") — the absent/partial signal; the no-data causes
 * are genuinely unknown, not a capability claim. (channel is the open CrashChannel vocabulary,
 * typed `string` here to avoid a back-edge to @cartularium/drivers.) */
export type EngineObservation =
  | { capability: "value"; class: number }
  | { capability: "rejected"; reason?: string; code?: string }
  | { capability: "crashed"; channel: string }
  | { capability: "unsupported" }
  | {
      capability: "no-data"
      cause: "policy" | "seed-infidelity" | "environment-incompatible" | "infra" | "driver-error" | "unclassified"
    }

/** One agreement-class. `engines` is an unordered set (no privileged member). `values` is the
 * SET of distinct circulating values in the class: length 1 for exact agreement, >1 when relative
 * tolerance merged near-but-not-identical values (the spread is then visible — a class is a
 * connected component under cohort tolerance, NOT a pairwise-equal set). No field encodes
 * correctness or a reference — the no-verdict principle made structural. */
export interface ManifestClass {
  engines: Platform[]
  values: CirculatingGrid[]
}

export interface ManifestV5TestEntry {
  ref: string
  subject: string
  subjectRef: string
  name: string
  suite: string
  hash: `sha256:${string}`
  url: string
  aliases?: string[]
  category: Category
  /** Author-declared case-property tags, published so tag-predicate annotation scopes can resolve
   * against them (3e). Passed through the R1 publish-time HYGIENE GATE: only descriptive
   * case-property tags reach the manifest — OUTCOME-CLAIM tags (e.g. `divergence`, `excel-only`,
   * `coercion-divergence`) are dropped at this relation-layer boundary, so the observation manifest
   * never carries a verdict-flavored claim. Omitted when the gated set is empty. */
  tags?: string[]
  engines: Partial<Record<Platform, EngineObservation>>
  partition: ManifestClass[]
}

export interface ManifestV5FunctionEntry {
  engines: Record<Platform, ManifestEngineEntry>
  /** Observed forked case-refs only (the function's cases whose partition has >1 class). No
   * authored ids: the interpretive annotation layer (cause/summary/clustering) lives OUT OF
   * BAND, joined to forks by case-ref — the no-authority-over-meaning refinement (2026-06-19). */
  forks: string[]
  tests: string[]
}

export interface ManifestV5AliasEntry {
  target: string
  kind: "public-ref"
}

export interface ManifestV5TombstoneEntry {
  reason: string
}

export interface ManifestV5 {
  version: 5
  generatedAt: string
  engines: readonly Platform[]
  rung: "circulating"
  tests: Record<string, ManifestV5TestEntry>
  functions: Record<string, ManifestV5FunctionEntry>
  aliases: Record<string, ManifestV5AliasEntry>
  tombstones: Record<string, ManifestV5TombstoneEntry>
  hashes: Record<`sha256:${string}`, string>
}

export type FormulaCompatibilitySupport =
  | "native"
  | "absent"
  | "partial"
  | "external-service"
  | "context-required"
  | "design-pending"

export interface PlatformFunctionSupport {
  support: FormulaCompatibilitySupport
  note?: string
  causes?: Cause[]
}

export interface FormulaCompatibilityEvidenceRef {
  source: "assay"
  ref: string
  url?: string
}

export interface FunctionCompatibilityEntry {
  name: string
  platforms: Partial<Record<Platform, PlatformFunctionSupport>>
  tags?: string[]
  evidence?: FormulaCompatibilityEvidenceRef[]
}

export interface FormulaCompatibilityManifest {
  version: 1
  generatedAt: string
  platforms: readonly Platform[]
  functions: Record<string, FunctionCompatibilityEntry>
}

type TypeAssert<T extends true> = T
type IsAssignable<T, U> = T extends U ? true : false
type LegacyManifestShapeLabeledV4 = {
  version: 4
  generatedAt: string
  engines: readonly Platform[]
  dvs: Record<string, ManifestDvEntry>
  tests: Record<string, ManifestTestEntry>
  functions: Record<string, ManifestFunctionEntry>
}
type _LegacyV4ManifestRejected = TypeAssert<
  IsAssignable<LegacyManifestShapeLabeledV4, Manifest> extends false ? true : false
>

// bump on incompatible schema changes; consumers fail loud on mismatch
export const MANIFEST_VERSION = 4

export const SUPPORTED_MANIFEST_VERSIONS: readonly number[] = [4]

export function assertSupportedManifestVersion(version: unknown, source: string): void {
  if (typeof version !== "number" || !SUPPORTED_MANIFEST_VERSIONS.includes(version)) {
    throw new Error(
      `unsupported manifest version ${JSON.stringify(version)} from ${source}; ` +
        `expected one of [${SUPPORTED_MANIFEST_VERSIONS.join(", ")}]`,
    )
  }
}

export const FORMULA_COMPATIBILITY_MANIFEST_VERSION = 1

export const SUPPORTED_FORMULA_COMPATIBILITY_MANIFEST_VERSIONS: readonly number[] = [1]

export function assertSupportedFormulaCompatibilityManifestVersion(
  version: unknown,
  source: string,
): void {
  if (
    typeof version !== "number" ||
    !SUPPORTED_FORMULA_COMPATIBILITY_MANIFEST_VERSIONS.includes(version)
  ) {
    throw new Error(
      `unsupported formula compatibility manifest version ${JSON.stringify(version)} from ${source}; ` +
        `expected one of [${SUPPORTED_FORMULA_COMPATIBILITY_MANIFEST_VERSIONS.join(", ")}]`,
    )
  }
}

// assay fork-annotation store — see assay-fork-annotation.ts
export { ASSAY_FORK_ANNOTATION_VERSION } from "./assay-fork-annotation.js"

export type {
  AnnotationScope,
  AssayForkAnnotationInput,
  AssayForkAnnotationStatus,
  AssayForkAnnotationV1,
  ForkPredicate,
  ScopeClause,
} from "./assay-fork-annotation.js"

// fork-annotation coverage — derived read (manifest × annotations); see fork-coverage.ts
export { computeForkCoverage } from "./fork-coverage.js"
export type { AnnotationCoverage, ForkCoverageReport } from "./fork-coverage.js"

// edit-wiki page index — see edit-index.ts
export {
  EDIT_INDEX_VERSION,
  SUPPORTED_EDIT_INDEX_VERSIONS,
  CLOSED_KINDS,
  ALL_EDIT_INDEX_KINDS,
  isEditIndexKind,
  assertSupportedEditIndexVersion,
} from "./edit-index.js"

export type { EditIndex, EditIndexEntry, EditIndexKind } from "./edit-index.js"

// edit-wiki locked frontmatter fields — see locked-fields.ts
export { LOCKED_FIELDS_BY_KIND, lockedFieldsFor } from "./locked-fields.js"

// assay preview/result helpers — see assay-preview.ts
export {
  ASSAY_PREVIEW_RESULT_CONTRACT_VERSION,
  addressFor,
  columnLetters,
  compareAssayGrids,
  diffAssayGrids,
  inspectAssayPreviewResult,
  parseAssayGridClipboard,
} from "./assay-preview.js"

export type {
  AssayCellError,
  AssayCellValue,
  AssayCompareResult,
  AssayCompareRow,
  AssayCompareVerdict,
  AssayGridCellDifference,
  AssayGridDiff,
  AssayGridDifferenceKind,
  AssayGridValue,
  AssayPreviewDiagnostic,
  AssayPreviewDiagnosticSeverity,
  AssayPreviewInspection,
  AssayPreviewOverall,
  AssayPreviewPlatformInspection,
  AssayPreviewPlatformPayload,
  AssayPreviewPlatformState,
  AssayPreviewPlatformVerdict,
  AssayPreviewResultPayload,
  CompareAssayGridsOptions,
  InspectAssayPreviewResultOptions,
} from "./assay-preview.js"

// rich per-engine cell value contract — see cell-value.ts
export {
  projectPrimitive,
  projectScalarGrid,
  isCellError,
  isRichGrid,
  toScalarGrid,
  canonicalizePrimitive,
  canonicalizeCell,
  circulatingKey,
} from "./cell-value.js"

export type {
  CellError,
  CellValue,
  GridValue,
  CirculatingCell,
  CirculatingGrid,
  EngineExtras,
  ExcelExtras,
  FormulasExtras,
  GSheetsExtras,
  HyperformulaExtras,
  IroncalcExtras,
  LatticeExtras,
  LibreofficeExtras,
  PrimitiveValue,
  PycelExtras,
  RichCellValue,
  RichGridValue,
} from "./cell-value.js"
