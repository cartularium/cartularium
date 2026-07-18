// Rich per-engine cell value contract — see
// packages/assay/docs/driver-surface-coalescing-2026-05-23.md
//
// Each Driver.evaluate() returns a RichGridValue. Top-level fields on
// RichCellValue are the shared cross-engine vocabulary; engine extras
// (discriminated on `platform`) carry per-engine specific state. Cross-engine
// matchers address the shared vocabulary; engine-specific assertions use the
// engine extras. projectPrimitive/projectScalarGrid give callers a scalar
// projection compatible with the legacy CellValue shape.
//
// Per coalescing-session locks (2026-05-23):
//   D1 = Candidate A; D1.A.1 vetoed (no shared text_runs);
//   D1.A.2 = β null model (blank vs null distinct kinds);
//   D1.A.3 = "extended-error" for cross-engine non-classic errors;
//   D1.A.4 = formula as string; D1.A.5 = structural-subset matcher.

// === Primitive value variants ===
// Discriminated by `kind`. Cross-engine matchers branch on this.

export type PrimitiveValue =
  | { kind: "number"; value: number }
  | { kind: "string"; value: string }
  | { kind: "boolean"; value: boolean }
  // Classic 7-error set: #DIV/0!, #N/A, #NAME?, #NULL!, #NUM!, #REF!, #VALUE!
  | { kind: "error"; sentinel: string }
  // Non-classic engine-emitted errors (Excel rich-value family;
  // gsheets LOADING/ERROR/GETTING_DATA/NULL_VALUE). Engine extras carry detail.
  | { kind: "extended-error"; sentinel: string; error_type?: number }
  // Excel-style cell-state that decays through formula evaluation. Also
  // emitted by gsheets for untouched cells / spill recipients without value.
  // Excel emits this for ALL nullish output.
  | { kind: "blank"; reason?: "untouched" | "spill-recipient" | "formula-no-effective" }
  // Gsheets-style propagatable runtime Null that survives formula evaluation.
  // Excel never emits this kind. Semantic disambiguation of formula-returned
  // null vs empty-string is gated on a future side-channel probe (D8.β).
  | { kind: "null"; reason?: "formula-returned-null" | "spill-null" }
  // Cell carrying rich-text runs (per-engine shape in engine extras).
  | { kind: "rich-text"; collapsed: string }
  // Rendered-rich values (in-cell image, sparkline). CIRCULATING — they survive
  // `=A1` and are valid VLOOKUP/MATCH targets — but content-opaque through every
  // channel (driver capture is empty; in-engine `=` is content-blind, e.g.
  // different-data sparklines compare equal). So a fingerprint resolves them to
  // kind-only; their content is no-data (capability, never manufactured agreement).
  // `type_tag` names the rendered kind ("image" | "sparkline" | …, open as data);
  // `content` is populated only if some channel ever exposes it (today: absent).
  // See seeding-isolation §6.1 + value-equality-and-fingerprint §3.
  | { kind: "opaque"; type_tag: string; content?: string }

// === Top-level shared fields ===

export interface RichCellValue {
  primitive: PrimitiveValue
  // Formula text as the engine saw it (no leading "="). Dialect details
  // (Excel IIE vs AE; R1C1 if ever surfaced) live in engine extras.
  formula?: string
  // Display string (Excel: number-format-applied; gsheets: formattedValue).
  formatted?: string
  // Inferred numeric-format signal.
  number_format?: { type?: string; pattern?: string }
  // Single-link convenience. Multi-link / per-run encoding lives in engine
  // extras (no shared text_runs vocabulary per D1.A.1 veto).
  hyperlink?: string
  // Per-engine extension. Discriminated union on `platform`.
  engine: EngineExtras
}

// === Per-engine extras (discriminated union on platform) ===

export interface ExcelExtras {
  platform: "excel"
  // OOXML `t` attribute: 'n'/'s'/'str'/'b'/'e'/'d'/'inlineStr'/'f'.
  data_type?: string
  is_date?: boolean
  comment?: { text: string; author: string }
  // openpyxl CellRichText runs in engine-native shape (D1.A.1 veto =>
  // no shared text_runs).
  rich_runs?: Array<{ text: string; format?: Record<string, string> }>
  // OOXML XML fields openpyxl drops or normalizes.
  raw_xml?: {
    t?: string
    s?: number
    cm?: number
    vm?: number
    formula_text?: string
    formula_array_marker?: string
    formula_array_ref?: string
    formula_namespaces?: string[]
  }
  // D9 resolve_vm output. Field name "modern" matches Microsoft's term for the
  // rich-value error family specifically (load-bearing for MS-docs cross-ref);
  // distinct from the cross-engine kind "extended-error".
  modern_error_detail?: {
    error_type: number
    sub_type?: number
    extras?: Record<string, string>
  }
  // Surface B (xlwings live `.api.Range.Value2`): bit-accurate raw value as
  // Excel stores it. Dates stay as serials instead of datetime conversion;
  // strings/bools/empties pass through. Error-via-Value2 shape TBD at lift.
  value2?: number | string | boolean | null
  // Surface B: conditional-formatting overlay.
  display_format?: Record<string, unknown>
  // Surface B: writer-heuristic result for IIE/AE persistence decision.
  saved_as_array?: boolean
  // D1.A.4: formula dialect lives in engine extras.
  formula_dialect?: "iie" | "ae"
}

export interface GSheetsExtras {
  platform: "gsheets"
  // Wire-provenance signal (D8.α). Not a complete semantic type:
  // `=""` and `=IF(,,)` map to the same wire shape without D8.β probe.
  wire_kind:
    | "number"
    | "string"
    | "boolean"
    | "error"
    | "null"
    | "spill-null"
    | "blank"
  // D8.β: ISBLANK verdict on the cell's result for an ambiguous blank/null
  // wire shape. true = genuine runtime Null (primitive is kind:"null");
  // false = empty-string formula result (primitive is tightened to
  // {string,""}). Either way wire_kind keeps the raw provenance. Absent = not
  // probed (cell was not an ambiguous blank/null, or the probe was
  // inconclusive — e.g. a missing/non-boolean probe read).
  semantic_null?: boolean
  // Full Sheets v4 CellData wire format. Kept loosely-typed at the contracts
  // layer; tightening waits for gsheets-side consumers to stabilize.
  raw_api?: Record<string, unknown>
}

// Stubs for engines whose per-engine ground audit is deferred. Each will
// grow per-engine maximality post-audit (out of session). Lattice's audit
// is deferred per user (separate codebase), but it participates here so its
// Driver implementation stays valid through the interface migration.

export interface LatticeExtras {
  platform: "lattice"
}

export interface HyperformulaExtras {
  platform: "hyperformula"
}

export interface IroncalcExtras {
  platform: "ironcalc"
}

export interface LibreofficeExtras {
  platform: "libreoffice"
}

export interface FormulasExtras {
  platform: "formulas"
}

export interface PycelExtras {
  platform: "pycel"
}

export type EngineExtras =
  | ExcelExtras
  | GSheetsExtras
  | LatticeExtras
  | HyperformulaExtras
  | IroncalcExtras
  | LibreofficeExtras
  | FormulasExtras
  | PycelExtras

// === Grid ===
// 2D grid of rich cells; trailing-null trimming is driver-side concern.

export type RichGridValue = Array<Array<RichCellValue | null>>

// === Scalar projection ===
// Backwards-compat scalar shape matching the legacy CellValue contract.
// Drivers can drop their internal scalar-collapse logic and use these helpers
// uniformly. The structural shape matches assay-preview.ts AssayCellValue;
// unifying the two is consumer-side work (downstream of this contract).

export interface CellError {
  error: string
}

export type CellValue = number | string | boolean | CellError | null

export function projectPrimitive(rich: RichCellValue): CellValue {
  const p = rich.primitive
  switch (p.kind) {
    case "number":
      return p.value
    case "string":
      return p.value
    case "boolean":
      return p.value
    case "error":
      return { error: p.sentinel }
    case "extended-error":
      return { error: p.sentinel }
    case "blank":
      return null
    case "null":
      return null
    case "rich-text":
      return p.collapsed
    case "opaque":
      // No scalar representation — the rich layer (primitive.kind/type_tag) carries
      // it; legacy scalar consumers see null (kind-only; content is no-data). The
      // rich-aware comparison uses canonicalize over `kind`, not this projection.
      return null
  }
}

export function projectScalarGrid(grid: RichGridValue): CellValue[][] {
  return grid.map((row) => row.map((rc) => (rc ? projectPrimitive(rc) : null)))
}

// === Shared value spine ===
// The legacy scalar grid + the rich/scalar discriminators. These are the conservative
// value vocabulary used by BOTH the drivers (driver I/O) and the catalogue/matcher; they
// live here (the spine) rather than in `@cartularium/drivers` so the catalogue layer
// depends on contracts, not drivers. (Moved out of assay's `format/values.ts` at the
// driver-package extraction — only the driver-I/O vocab DriverTask/DriverTaskResult/
// Outcome moves to drivers.)

/** 2D grid of legacy scalar cell values; scalar results are [[value]]. */
export type GridValue = CellValue[][]

export function isCellError(v: unknown): v is CellError {
  return typeof v === "object" && v !== null && "error" in v
}

/**
 * Detect whether a 2D grid is the post-coalescing rich shape (RichGridValue) vs the
 * legacy scalar shape (CellValue[][]). Rich cells are `{primitive, engine, ...}`
 * objects; scalar cells are primitives or `{error: string}`.
 */
export function isRichGrid(g: unknown): g is RichGridValue {
  if (!Array.isArray(g) || g.length === 0) return false
  for (const row of g) {
    if (!Array.isArray(row)) return false
    for (const cell of row) {
      if (cell === null) continue
      if (typeof cell === "object" && !Array.isArray(cell)) {
        const obj = cell as Record<string, unknown>
        return "primitive" in obj && "engine" in obj
      }
      return false
    }
  }
  return false
}

/** Project to scalar GridValue if the input is rich; otherwise pass through. */
export function toScalarGrid(g: GridValue | RichGridValue): GridValue {
  return isRichGrid(g) ? projectScalarGrid(g) : (g as GridValue)
}
