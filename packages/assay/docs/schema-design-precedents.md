# Schema-design precedents — for the canonical CellValue work

Distillation of design patterns from Microsoft's published Excel.CellValue type system + audit findings, organized for the schema-finalization session. The audit identified the engineering ground; this doc distills the design-pattern ground.

**Goal:** when the schema-finalization session opens, this is the single doc to read for "what other people have built that's worth borrowing."

## Microsoft's Excel.CellValue — the closest existing prior art

[`Excel.CellValue`](https://learn.microsoft.com/en-us/javascript/api/excel/excel.cellvalue?view=excel-js-preview) is a 15-variant TypeScript discriminated union. Microsoft has effectively published a typed cell-value model — the same shape of artifact we're designing for assay. Worth studying as direct precedent.

### Pattern 1: Discriminator `type` string + `basicType`/`basicValue` shadow pair

Every variant carries both its rich `type` discriminator AND a `basicType`/`basicValue` pair representing the legacy-API equivalent:

```typescript
interface BooleanCellValue {
  type: "Boolean";
  basicValue: boolean;
  basicType?: RangeValueType; // legacy view
}

interface EntityCellValue {
  type: "Entity";
  text: string;        // display
  properties: {...};   // rich data
  basicType?: "Error";       // legacy view
  basicValue?: "#VALUE!";    // legacy fallback for old API readers
}
```

**Why this matters for assay:** we need a way to express "what does engine A see vs engine B?" Microsoft's solution: every rich value carries its degraded form alongside. Direct precedent for the cross-engine fallback the schema needs.

### Pattern 2: String-literal subType enums (not integers)

Modern errors have string `errorSubType` enums:

```typescript
interface SpillErrorCellValue {
  type: "Error";
  errorType: "Spill";
  errorSubType: "Unknown" | "Collision" | "IndeterminateSize"
              | "WorksheetEdge" | "OutOfMemoryWhileCalc"
              | "Table" | "MergedCell";
  rowCount?: number;
  columnCount?: number;
}
```

Note: `"Unknown"` is always present as a forward-compat slot. Subtypes are stable identifiers across Excel versions; new subtypes get added but existing ones don't change.

**Schema implication:** assay's canonical schema should also use string-literal subTypes (Spill, Calc, etc.) rather than integer codes — even though OOXML stores integers at the wire format. The mapping from OOXML integers → canonical strings lives in the driver.

### Pattern 3: `referencedValues[]` + `ReferenceCellValue` dedup model

Entity property trees can deduplicate via index references:

```typescript
interface EntityCellValue {
  properties: { [key: string]: EntityPropertyType };
  referencedValues?: ReferencedValue[]; // dedup pool at the root
}

interface ReferenceCellValue {
  type: "Reference";
  reference: number; // index into referencedValues[]
}
```

Cleaner than re-serializing the same entity at multiple property paths. **Relevance for assay:** if the schema admits nested-entity values (Linked Data Types or any future structured cell type), the dedup pattern is well-precedented.

### Pattern 4: Per-value `writable` tombstone

Every variant gets `writable?: boolean` + `writableNote?: string` via intersection:

```typescript
type CellValue = (... 15 variants ...) & CellValueExtraProperties;

interface CellValueExtraProperties {
  writable?: boolean;
  writableNote?: string;
}
```

When a cell is computed (formula result) or protected, `writable: false` lets clients know without throwing on write.

**Schema implication for assay:** could model "this cell is derived; can't be the assertion target" as a per-value tombstone, useful for matcher language design.

### Pattern 5: Forward-compat sentinel with fallback

`ValueTypeNotAvailableCellValue` is an explicit "newer API knows this; this version doesn't":

```typescript
interface ValueTypeNotAvailableCellValue {
  type: "NotAvailable";
  basicType?: RangeValueType;
  basicValue?: boolean | number | string;
}
```

If a newer Excel version persists a rich type in a workbook and an older Office.js reads it, the reader sees this sentinel — with the basicValue preserved so the old reader still has SOMETHING to display.

**Schema implication for assay:** explicit forward-compat handling done right. Schema can include a `kind: 'unknown'` variant that carries scalar-degraded fallback for unsupported rich types.

### Pattern 6: Three-part identity for external-service values

`LinkedEntityId`:

```typescript
interface LinkedEntityId {
  serviceId: number;   // Microsoft's published service registry: Stocks, Geography, etc.
  entityId: string;
  culture: string;     // locale
  domainId?: string;
}
```

Provider × entity × culture. For Stocks: serviceId points to Stocks-service, entityId is the ticker, culture identifies the locale's representation.

**Schema implication for assay:** when modeling Linked Data Types or other external-service values, three-part identity is the documented pattern.

### Pattern 7: Flat array values (no nesting)

`ArrayCellValue.elements: CellValue[][]` is a 2D grid. **Arrays don't nest** — you can't have an ArrayCellValue inside an ArrayCellValue. A spill range is represented as ArrayCellValue at the anchor + plain DoubleCellValues at spilled positions, NOT as a nested array structure.

**Schema implication for assay:** if the schema admits array-typed cells, follow the no-nesting rule. Spill ranges have their own structural identity (anchor + recipients) distinct from "this cell holds an array."

### Pattern 8: Date-as-Double-with-format-string

Excel has **no DATE type**. Dates are `DoubleCellValue` with a `numberFormat: string` (Excel format-string syntax like `"m/d/yyyy"`). Pure spreadsheet serial number.

```typescript
interface DoubleCellValue {
  type: "Double";
  basicValue: number;
  numberFormat?: string;
  // ...
}
```

Contrast with gsheets: `effectiveFormat.numberFormat.type` is an enum (DATE, TIME, DATE_TIME, PERCENT, CURRENCY, SCIENTIFIC, TEXT). gsheets DOES have type-of-format as a first-class concept.

**Schema fork for assay (NEW from this research):** either align with Excel (Double + format-string), align with gsheets (DATE enum + pattern), or carry both axes. Real design decision.

### Pattern 9: Classic-vs-modern API duality

Office.js has two parallel read paths:

```typescript
range.valueTypes: RangeValueType[][]      // old narrow enum, "richValue" collapses everything
range.valuesAsJson: CellValue[][]         // new typed 15-variant union
```

Same architecture as the OOXML wire-format split (classic 7-error path vs modern rich-value path).

**Schema implication for assay:** matchers can opt into "give me the narrow view" or "give me the rich view" — the schema can support both via a render-mode parameter, matching Microsoft's documented duality.

## Engineering-side findings → schema constraints

Translated from the audit's empirical findings, these are constraints on the schema:

### Constraint 1: gsheets Null ≠ Excel blank

- gsheets Null is a propagatable runtime value. Survives formula evaluation.
- Excel blank is a cell-state property. Decays to numeric 0 the moment a formula reads it.
- **Schema needs both variants:** `kind: 'null'` (gsheets-and-Lattice; propagatable) and `kind: 'blank'` (Excel; cell-state-only).
- Both should be polymorphically-equal to 0, "", FALSE per documented engine behavior (this is the same on both engines — only propagation differs).

### Constraint 2: Excel modern errors have subTypes; gsheets errors don't (or do they?)

- Excel JS API documents subTypes for Spill (7), Calc (22), Busy (4), Field (4), Blocked, Connect, External, Python, Timeout.
- gsheets ErrorValue.type has 9 enum values: ERROR, NULL_VALUE, DIVIDE_BY_ZERO, VALUE, REF, NAME, NUM, N_A, LOADING. No documented sub-typing.
- **Schema design:** error subType is an OPTIONAL field. Excel populates it; gsheets leaves it null.

### Constraint 3: Excel has 11+ modern error codes; gsheets has 9

- Excel: classic 7 + modern 11+ (#SPILL!, #CALC!, #UNKNOWN!, #GETTING_DATA, #BUSY!, #BLOCKED!, #CONNECT!, #FIELD!, #PYTHON!, #EXTERNAL!, #TIMEOUT!).
- gsheets: 9 codes (one of which — NULL_VALUE — is documented as if normal but the audit never observed it emitted; possibly Excel-import-compat).
- **Schema design:** error code is open-set (admits codes not in the closed enum). canonical mapping table per engine.

### Constraint 4: Function-name namespacing (Excel-specific structural axis)

- OOXML stores modern function names with 5 prefix productions (`_xlfn.`, `_xlfn._xlws.`, `_xlpm.`, `_xlop.`, plus off-spec `_xludf.`).
- gsheets does not have an equivalent — function names are bare.
- **Schema design:** if the schema represents formula text, the function-name normalization is Excel-only. Probably handled by the Excel driver at the boundary.

### Constraint 5: Spill anchor/recipient identity

- Excel persists spill identity in the file via `<f t="array" ref="A1:A5">` on the anchor cell + the absence of formula on recipients.
- gsheets persists similarly: anchor has `userEnteredValue.formulaValue`; recipients don't.
- **Schema design:** `spillIdentity` field with values `'anchor' | 'recipient' | null`. Cross-platform.

### Constraint 6: Per-substring text formatting + links

- Excel: rich text with per-run formatting (color/bold/italic/underline). No per-run links — links are at the sheet level (`<hyperlinks>`) or in formula text (`HYPERLINK()`).
- gsheets: per-substring formatting INCLUDING per-substring links via `textFormatRuns[].format.link`.
- **Schema design:** per-substring text-runs structure with optional link. Excel-side, the link field is always null for in-text runs (links live elsewhere); gsheets-side, link may be populated.

### Constraint 7: numFmt type as engine type signal

- Excel: no numFmt type enum; just format-strings. Date inferred from numFmt format-string pattern.
- gsheets: `effectiveFormat.numberFormat.type` enum (DATE, TIME, PERCENT, CURRENCY, SCIENTIFIC, TEXT, NUMBER_FORMAT_TYPE_UNSPECIFIED).
- BOTH auto-apply numFmt for date-producing formulas (DATE, NOW, TODAY).
- **Schema design fork (already identified):** align with Excel (format-string) or gsheets (enum) or carry both.

## Forks for the schema-finalization session (refined)

Carry-over from roadmap, refined by research:

1. **Tagged union vs scalar+sidecar.** Lean: tagged. (Patterns 1 and 5 above strongly suggest tagged.)

2. **Generic structured variant vs platform-tagged extras.** Lean: platform-tagged. (Microsoft does this — they don't have a generic structured type; they have `EntityCellValue`, `LinkedEntityCellValue`, `WebImageCellValue` etc. as named variants.)

3. **Fidelity tier per-driver vs per-test.** Lean: per-driver for A+C, per-test for B.

4. **Surface B (xlwings live `.api`) strategy.** Lean: defer.

5. **`kind: 'blank'` vs `kind: 'null'`.** **Both, distinct semantics.** Excel blank is cell-state; gsheets Null is propagatable runtime value. This is the engineering-grounded answer.

6. **Date-as-type vs Date-as-Double-plus-format.** **NEW FORK.** Excel has no DATE type; gsheets has it. Schema picks one model or carries both axes. Microsoft's choice was Double + format-string; gsheets's choice is an enum. Both have precedent.

7. **Schema doc location.**

8. **Lattice constraints articulation** (deferred per user direction).

## Concrete schema sketch (strawman, not normative)

For the schema-finalization session's starting point. Distilled from precedents + audit findings:

```typescript
type CellValue =
  | NumberCellValue
  | StringCellValue
  | BooleanCellValue
  | ErrorCellValue
  | NullCellValue        // gsheets/Lattice — propagatable runtime null
  | BlankCellValue       // Excel — cell-state absence (never propagatable)
  | StructuredCellValue; // platform-tagged extras (LinkedDataType, etc.)

interface CellValueCommon {
  kind: string;
  // Cross-engine fallback (the basicType/basicValue pattern)
  // representation in legacy/simpler engines. Present on every variant.
  legacyShape?: { kind: string; value: number | string | boolean | null };
}

interface NumberCellValue extends CellValueCommon {
  kind: "number";
  value: number;
  // Excel-side: numberFormat string. gsheets-side: numberFormat.type enum + pattern.
  // Schema carries BOTH for the date-fork (see #6 above) — engine reports what
  // it has; schema sees through.
  numberFormatString?: string;       // Excel-style
  numberFormatType?: NumberFormatType; // gsheets-style; engine fills if available
  numberFormatPattern?: string;      // gsheets-style pattern (often matches Excel's string)
}

interface StringCellValue extends CellValueCommon {
  kind: "string";
  value: string;
  textRuns?: TextRun[];     // per-substring formatting + links (gsheets has links; Excel doesn't)
  hyperlink?: string;       // cell-level hyperlink (single-link case)
}

interface BooleanCellValue extends CellValueCommon {
  kind: "boolean";
  value: boolean;
}

interface ErrorCellValue extends CellValueCommon {
  kind: "error";
  code: string;             // open-set (admits future codes); canonical = #-prefixed sentinel
  subType?: string;         // Excel-only for modern errors; gsheets always null
  message?: string;         // sometimes present (gsheets), never persisted (Excel)
  // Spill-error-specific shape from Excel.SpillErrorCellValue
  spillGeometry?: { rowCount?: number; columnCount?: number };
}

interface NullCellValue extends CellValueCommon {
  kind: "null";  // gsheets/Lattice — runtime value that propagates
  // No payload; the variant IS the value
}

interface BlankCellValue extends CellValueCommon {
  kind: "blank"; // Excel — cell-state-only; decays to 0 through formula evaluation
}

interface StructuredCellValue extends CellValueCommon {
  kind: "structured";
  subtype: "linked-data-type" | "cube" | "lambda" | string; // open-set
  detail: unknown;          // engine-specific structure
}

// Optional cell-level metadata orthogonal to the value variant
interface CellMetadata {
  spillIdentity?: "anchor" | "recipient";
  spillRange?: string;       // anchor's ref="A1:A5"
  formulaNamespaces?: string[]; // Excel: _xlfn, _xlpm, _xlfn._xlws, _xlop, _xludf
  writable?: boolean;        // per-value tombstone (from pattern 4)
  writableNote?: string;
}

type Cell = { value: CellValue; meta?: CellMetadata };
type Grid = Array<Array<Cell | null>>; // null = truly untouched
```

This is a strawman; the schema-finalization session is where it gets argued + decided.

## Open patterns NOT yet explored

For the schema session to consider:

- **Per-cell warnings** (Excel's XlErrorChecks family: stale-value flag, "number stored as text", etc.). Engine warnings distinct from value or errors. Matcher language could opt into asserting on warning state.
- **Effective format overlay** (Excel's Range.DisplayFormat ≈ gsheets effectiveFormat). Live-computed, not persisted. Whether the schema represents it depends on use case.
- **Calculation mode** (workbook-level: auto/manual/semiautomatic). Affects when recalc happens. Probably not cell-value level but worth noting.
- **Iterative calc convergence** (Application.MaxIterations, MaxChange). Engine-state-only.
