// canonical manifest schema published by assay at assay.sheets.wiki/manifest.json
// and consumed by sheets-wiki at build time. see ASSAY-INTEGRATION.md for prose.

import type { Platform } from "./platform.js"

export { ALL_PLATFORMS, isPlatform } from "./platform.js"
export type { Platform } from "./platform.js"

// closed enum of override causes (assay schema §7)
export type Cause =
  | "missing-function"
  | "missing-arg-form"
  | "argument-arity"
  | "arg-semantics"
  | "precision"
  | "format-rendering"
  | "locale"
  | "shape"
  | "array-orientation"
  | "error-code"
  | "error-attribution"
  | "null-vs-zero"
  | "recalc-semantics"
  | "array-handling"
  | "unimplemented-edge"
  | "version-skew"
  | "intentional-spec"
  | "TODO"

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
} from "./cell-value.js"

export type {
  CellError,
  CellValue,
  GridValue,
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
