# Excel CellData gap analysis

Research artifact, not a plan. Walks the OOXML SpreadsheetML cell representation field-by-field, marks what the assay excel driver captures today, and identifies Excel-only surfaces that a gsheets-derived schema would miss. Companion to [`gsheets-celldata-gap.md`](./gsheets-celldata-gap.md); together they are the inputs to the assay-canonical cell-value schema design.

**Status:** initial scaffold. Spec-grounded and code-grounded sections are filled. Empirical-probe targets are flagged inline (TODO-probe) and consolidated in [Open questions](#open-questions--to-resolve-empirically). The gsheets doc reached its current shape only after probes resolved its open questions; expect a similar second pass for this one.

## Why this exists

Same fidelity argument as the gsheets walk: `CellValue = number | string | boolean | CellError | null` ([`format/types.ts:13`](../src/format/types.ts)) is the intersection of what the engines comfortably express. Intersection produces silent passes — when a platform represents something the assay model cannot carry, the driver strips it and divergences disappear.

The gsheets walk identified HYPERLINK as the load-bearing example (per-substring link in `textFormatRuns` lost to a flat string). Excel has its own family of these:

- **`#GETTING_DATA` transient** (Linked Data Types, RTD, Power Query) — Excel emits this as an `errorValue` while async refresh is in flight. gsheets has `LOADING` for the analog. Neither survives the current pipeline; both get flattened to whatever final state the cell happens to show.
- **`#SPILL!`, `#CALC!`** — modern dynamic-array errors not in the historical seven. The driver's regex `_ERROR_STR_RE` ([`excel_driver.py:56`](../python/excel_driver.py)) does catch them (`#SPILL!`, `#CALC!` match `^#[A-Z0-9/]+!?\??$`), but they collapse into `CellError = {error: string}` like every other error — no `#SPILL!`-vs-`#CALC!` semantic distinction at the schema layer.
- **Linked Data Types** (Stocks, Geography, Image) — the cell *displays* a string like "Apple Inc." but the underlying value is a structured record with sub-fields (`.Price`, `.HQ`). openpyxl's `data_only=True` read returns the display string; the structure is invisible to the current pipeline.
- **Number format inference** — same shape as the gsheets `effectiveFormat.numberFormat.type` story: Excel auto-applies a date numFmt to `=TODAY()`/`=NOW()`/`=DATE(...)` and the *typed* identity rides on the style index, not the value. The driver actively flattens this — `_dt_to_serial` ([`excel_driver.py:36`](../python/excel_driver.py)) converts datetime back to a serial number specifically to match gsheets' UNFORMATTED_VALUE. The "Excel inferred this is a date" signal is destroyed at the driver layer by design.

## Source of truth

Excel does not have a single source of truth the way the Sheets API does. There are two surfaces, and they don't fully agree:

1. **The xlsx file** (OOXML / ECMA-376) — the wire format. Public spec. Authoritative for what Excel *persists*.
2. **The live calc engine** (in-process Excel) — what xlwings talks to via COM (Windows) or AppleEvents (macOS). Source of truth for in-flight state that the xlsx never carries (calc-chain progress, `#GETTING_DATA` transients).

These diverge in both directions. The live engine has state the file doesn't carry; the file has structure (cell metadata for dynamic-array anchors, the extension parts for Linked Data Types) that the live engine surfaces only indirectly.

References:

- [ECMA-376 Part 1](https://ecma-international.org/publications-and-standards/standards/ecma-376/) — fundamentals + markup. Sheet1.xml shape, cell types, style xfs.
- [MS-XLSX `[MS-XLSX]` and `[MS-XLS]` open specs](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-xlsx/) — Microsoft's transitional implementer notes; the spec-and-a-half that closes most ambiguities.
- xlwings docs and openpyxl docs — empirical anchors for what the driver actually sees through each layer.
- No equivalent of [sheets.wiki](../../sheets-wiki/) exists for Excel; community-canonical references are scattered.

## The capture pipeline — and the three reachable surfaces

The driver pipeline ([`python/excel_driver.py`](../python/excel_driver.py)):

1. **Build** a fresh xlsx with input cells via openpyxl (`build_workbook`)
2. **Recalc** via xlwings: open in live Excel, set each task's formula at `AA1` via `Range.formula2` (dynamic-array aware), `app.calculate()`, save, close (`recalc_with_excel`)
3. **Read back** via openpyxl with `data_only=True`, `iter_rows(values_only=True)` over the spill window `AA1:AT20` (`read_sheet_result`)

That's the *pipeline*, but the *capture ceiling* is set by what each of three independent surfaces can expose. They overlap unevenly, and the current driver only reaches the cheapest cells of the cheapest layer.

### Surface A — openpyxl read (`data_only=True`)

After Excel saves the xlsx, openpyxl reparses the file. Even at `data_only=True` (formulas dropped, cached values kept), openpyxl 3.1.5 exposes far more per-cell than just `.value`:

| Property | What it gives | Used today? | Where it maps in OOXML |
|---|---|---|---|
| `cell.value` | Python primitive (int/float/str/bool/datetime/None) | yes | `<c><v>` (resolved through `t` and sharedStrings) |
| `cell.data_type` | OOXML `t` attribute as string: `"n"`, `"s"`, `"str"`, `"b"`, `"e"`, `"d"`, `"f"` | **no** | `<c t="...">` — direct |
| `cell.number_format` | Format pattern string (e.g. `"yyyy-mm-dd"`, `"General"`, `"$#,##0.00"`) | **no** | `styles.xml` → `cellXfs[s].numFmtId` → built-in table or `<numFmts>` |
| `cell.is_date` | Convenience bool from `number_format` | **no** | derived from above |
| `cell.hyperlink` | Sheet-level `<hyperlinks>` resolved to this cell (incl. `target`, `display`, `tooltip`) | **no** | `worksheet/hyperlinks/hyperlink[@ref]` |
| `cell.comment` | Cell comment (legacy `xl/comments<N>.xml`) | **no** | `xl/comments<N>.xml` |
| `cell.font` `cell.fill` `cell.alignment` `cell.border` `cell.protection` | Style sub-objects (color, bold/italic, fg/bg, etc.) | **no** | `styles.xml` → `cellXfs[s]` → fontId/fillId/borderId/etc. |
| `cell.quotePrefix` | Leading `'` quote that forces text coercion | **no** | `<c><is>` or quotePrefix on xf |
| `CellRichText` / `TextBlock` (via `cell.value` when rich) | Per-run rich-text reads (run-level font and text) | **no** | `<c t="inlineStr"><is><r><rPr>...` or shared-strings `<si><r><rPr>...` |
| `worksheet.tables` | ListObjects (Tables) — table-level columns, name, range | **no** | `xl/tables/table<N>.xml` |
| `worksheet.conditional_formatting` | Conditional-format rules (rule-level) | **no** | `worksheet/conditionalFormatting` |
| `worksheet.data_validations` | Cell-range → validation rule | **no** | `worksheet/dataValidations` |
| `worksheet.merged_cells` | Merge ranges | **no** | `worksheet/mergeCells` |

**Switching the read path** from `iter_rows(values_only=True)` to per-cell openpyxl reads buys all of column 2 — same workbook, same parse pass, no new library. This is the closest analog to gsheets switching from the values API to `spreadsheets.get?includeGridData=true&fields=...`.

**openpyxl does *not* model:**
- Cell metadata index (`<c cm="...">`) — spill recipient / dynamic-array marker. Visible only in raw XML.
- Value metadata index (`<c vm="...">`) — used by rich/linked data types. Visible only in raw XML.
- `xl/richData/*` parts — Linked Data Types (Stocks/Geography/Image). openpyxl ignores these entirely.
- `xl/metadata.xml` — `futureMetadata` blocks. Not parsed.
- `xl/calcChain.xml` — calculation order. Not parsed.
- The `extLst` extension blocks on most parts. Stripped.
- Comment threads (modern threaded comments live in `xl/threadedComments/*.xml`; openpyxl reads only the legacy `xl/comments<N>.xml`).
- Shared formulas as a coherent structure (the spec's `<f t="shared" si="0" ref="A1:A10">` model). openpyxl 3.x flattens shared formulas back to per-cell strings on read; the master/non-master split is lost.

### Surface B — xlwings live Excel (pre-save)

The xlwings Range API has a *narrower* public surface than openpyxl on the read side. The interesting state lives behind `Range.api`, which on macOS is an AppleScript-bridge object and on Windows is a COM object — and they're not the same shape.

**xlwings public Range properties** (relevant subset, from `xlwings 0.34.0`):

| Property | Notes |
|---|---|
| `.value` `.raw_value` | Python primitive; `.raw_value` skips converters |
| `.formula` `.formula2` `.formula_array` | Three formula views — `.formula2` is the modern Excel 2021/365 setter that triggers dynamic-array spill, `.formula_array` is legacy Ctrl-Shift-Enter |
| `.number_format` | Pattern string, same shape as openpyxl |
| `.hyperlink` `.note` `.color` `.font` | Direct accessors |
| `.has_array` `.merge_area` `.merge_cells` | Array-formula / merge identity |
| `.api` | Escape hatch to underlying AppleEvents (Mac) / COM (Windows) object |

**Through `.api`, Windows COM exposes** (not all available on Mac):

- `Range.HasSpill` — whether this cell anchors a dynamic-array spill
- `Range.SpillingToRange` — the spill range from an anchor
- `Range.SpillParent` — the anchor from a spilled cell
- `Range.DisplayFormat` — *effective* format including conditional-format overlays (closest analog to gsheets' `effectiveFormat`)
- `Range.Errors.Item(N).Value` — per-flag error checking (auto-recalc errors)
- `Range.LinkedDataTypeState` — Stocks/Geography state
- `Range.Validation` — data validation directly
- `Range.NumberFormatLocal` — locale-formatted pattern

**Mac asymmetry:** the AppleEvents bridge (`xlwings._xlmac`) wraps a subset of these. Some modern properties (`HasSpill`, `SpillingToRange`, `LinkedDataTypeState`) are not exposed through Mac AppleEvents at all in current Excel for Mac — they're calc-engine-level features that AppleScript's Excel dictionary doesn't enumerate. Workarounds are awkward (e.g., evaluating `=ROWS(SPILLRANGE(A1))` via xlwings as a side-channel probe). **Per [project-assay-driver-fidelity](.../memory/project-assay-driver-fidelity.md), this is exactly the "user can verify on Mac" / "Windows behavior needs external calibration" wedge.**

**Live-only state:** `#GETTING_DATA` transients during async refresh; cells mid-`STOCKHISTORY`/`WEBSERVICE` resolution. The xlsx never carries these — by the time `wb.save()` returns, Excel has either resolved or errored. Capturing them requires reading via `.api` *before* save.

### Surface C — raw OOXML XML

The deepest layer. xlsx is a zip; everything openpyxl and xlwings drop is recoverable here at the cost of parse complexity.

| Path | What's there | Reachable from openpyxl? |
|---|---|---|
| `xl/worksheets/sheet<N>.xml` | The `<c>` elements with full `t`/`s`/`cm`/`vm`/`ph` attrs and `<f>`/`<v>`/`<is>` children | partially — `cm`/`vm` lost |
| `xl/sharedStrings.xml` | String table with per-run `<r><rPr>` rich text | yes (CellRichText surfaces it) |
| `xl/styles.xml` | `<numFmts>`, `<fonts>`, `<fills>`, `<borders>`, `<cellXfs>`, `<dxfs>` (differential xfs for conditional formatting) | mostly — `dxfs` indexing is fragile |
| `xl/metadata.xml` | `futureMetadata`/`metadata` blocks; the `cm`/`vm` index targets | **no** — raw XML only |
| `xl/richData/rdRichValues.xml`, `xl/richData/rdRichValueTypes.xml`, `xl/richData/rdRichValueStructures.xml` | Linked Data Type definitions and instances | **no** — raw XML only |
| `xl/calcChain.xml` | Formula calculation order | **no** — raw XML only |
| `xl/connections.xml`, `xl/queryTables/`, `xl/pivotCache/` | External connections, query tables, pivot caches | partially — surface metadata only |
| `xl/threadedComments/*.xml`, `xl/persons/person.xml` | Modern threaded comments | **no** — raw XML only |
| `[Content_Types].xml`, `_rels/.rels`, `xl/_rels/workbook.xml.rels` | Parts manifest and relationships | not for our purposes |

**When raw XML is unavoidable:**

- Spill anchor vs recipient identity (`cm`)
- Linked Data Type sub-fields
- Modern threaded comments
- Differential format (`dxfs`) details for conditional formatting that has propagated into the visible style
- Calc chain order if it ever matters (it probably doesn't for fidelity)

**Cost model:** raw XML reads add a parse pass over the saved xlsx (zip extract + XML parse). On the existing chunk path (`CHUNK_SIZE = 25`, ~50 tasks per chunk × 20×20 spill window), this is small — well under 100ms per chunk for the parts we'd touch. The brittleness is the bigger concern: OOXML has Strict / Transitional dialects and Excel-version-specific deviations from spec, and our parsing would need to handle both.

### How the surfaces interact (the choice tree)

For each schema-relevant field, the question is which surface to read it from. The right answer per field:

- **Things openpyxl already exposes per cell** (`data_type`, `number_format`, `hyperlink`, `comment`, `is_date`, font/fill/alignment, rich text via CellRichText) → **switch the openpyxl read path** to be per-cell instead of `iter_rows(values_only=True)`. Cheapest lift. No new libraries.
- **Things openpyxl doesn't model** (`cm` spill indexes, `vm` linked data type refs, `xl/richData/`, `xl/metadata.xml`, threaded comments) → **raw XML pass** alongside the openpyxl read. zipfile + ElementTree are stdlib.
- **Live-only state** (`#GETTING_DATA` transients, calc-chain progress) → **xlwings pre-save reads via `.api`** with the Mac/Windows asymmetry called out. This is the most expensive: holds Excel attached, adds per-cell COM round-trips. Probably out of scope for v1 schema fidelity; a follow-on capability.

For the schema-design phase, the first two paths cover everything we need to *design against*. The live-only surface is real but it's a driver-capability question, not a schema-shape question — the schema can carry a transient/loading variant whether or not the Excel driver currently emits it.

## Type-system gap: OOXML cell types vs assay `CellValue`

OOXML's `<c>` element has an attribute `t` selecting one of these value categories (omitted means `n`):

| OOXML `t` | Description | Current `CellValue` | Captured? |
|---|---|---|---|
| `n` (default) | Number (IEEE 754 double; dates as serial, booleans never via this path) | `number` | yes |
| `s` | Shared-string-table index; `<v>` is the integer index, real string lives in `sharedStrings.xml` | `string` | yes (openpyxl resolves transparently) |
| `str` | Inline computed string (formula result, etc.); `<v>` is the literal | `string` | yes |
| `inlineStr` | Inline string in `<is>` child element (rare; used when `sharedStrings.xml` is omitted) | `string` | yes |
| `b` | Boolean; `<v>` is `0` or `1` | `boolean` | yes |
| `e` | Error sentinel; `<v>` is the display string (`#DIV/0!`, `#N/A`, …) | `{error: string}` | partial — we keep the sentinel, drop everything else |
| `d` | Date in ISO-8601 form (Strict OOXML); non-standard in Transitional but openpyxl sometimes writes it | `number` (via `_dt_to_serial` coercion) | partial — semantically a date but flattened to serial |

### Cell error sentinels — Excel's enum surface

OOXML doesn't enumerate the error sentinels typed in the spec; they're the literal strings stored in `<v>` when `t="e"`. Observed at runtime (some confirmed in code, some TODO-probe):

| Sentinel | Cause | Captured? | Notes |
|---|---|---|---|
| `#DIV/0!` | divide by zero | yes (string match) | gsheets analog: `DIVIDE_BY_ZERO` |
| `#N/A` | not available | yes | gsheets analog: `N_A` |
| `#NAME?` | unknown name (function, named range, etc.) | yes | gsheets analog: `NAME` |
| `#NULL!` | empty intersection (the space operator: `=A1:A10 B1:B10`) | yes | **Excel-only.** gsheets has no intersect operator. Listed in gsheets' `ErrorType` enum as `NULL_VALUE` for Excel-compat but never produced there. |
| `#NUM!` | numeric error (out of range, SQRT of negative, etc.) | yes | gsheets analog: `NUM` |
| `#REF!` | broken reference | yes | gsheets analog: `REF` |
| `#VALUE!` | type mismatch in arithmetic / coercion | yes | gsheets analog: `VALUE` |
| `#GETTING_DATA` | transient; async function or RTD or Power Query in-flight | TODO-probe — regex would match, but unclear whether the saved xlsx ever carries this string vs the live engine flushing it before save | gsheets analog: `LOADING` (also unobserved in the gsheets probes) |
| `#SPILL!` | dynamic-array spill blocked | yes (regex match) | **Excel-only.** No gsheets analog. |
| `#CALC!` | calc-engine error (empty array literal, recursive lambda overflow, async error, …) | yes (regex match) | **Excel-only.** No gsheets analog. Sub-flavors emit different banner strings in the UI but the `<v>` sentinel is just `#CALC!`. |
| `#UNKNOWN!` | seen with cross-version cells (newer-Excel formula opened in older) | unclear | TODO-probe; rare enough that it may be a corruption signal more than a runtime state. |
| `#BLOCKED!` | content-policy-blocked function (Mac-Office signed-in vs not, some XLOOKUP variants, etc.) | unclear | TODO-probe — may not be reachable from the bulk-driver harness. |

**Gap from gsheets enum:** the gsheets `ErrorType` is closed (9 named cases). Excel's error sentinels are open-set in practice — Microsoft has added `#SPILL!`, `#CALC!`, and `#UNKNOWN!` over the past few years, and the format-format permits anything matching the sentinel shape. Schema implication: the canonical error model needs either a string-keyed code (Excel-style) plus a canonical mapping, or a discriminated union that explicitly admits `unknown(string)`.

**Message gap:** OOXML stores only the sentinel string. There is no `message` field. The live Excel engine *does* expose error sub-types (via `Range.Errors.Item(xlEvaluateToError).Value` and similar), and the UI shows category-specific banners, but none of that survives to the saved xlsx. So the schema's `CellError = {type, message?}` plan from the gsheets walk is sound; `message` is "sometimes present, locale-specific" exactly as gsheets had it, just for a different reason (engine-side, not file-side).

## Platform types that don't appear at the cell-data layer

Mirroring the gsheets section on Lambda + Null. Excel has its own set:

- **LAMBDA at cell boundary.** Excel 365 supports `LAMBDA` in defined names and inline calls (`=LAMBDA(x, x+1)(5)`). A bare `=LAMBDA(x, x+1)` as a cell formula returns `#CALC!` (TODO-probe to confirm the exact code; could also be `#VALUE!`). So Excel collapses cell-boundary lambdas to a `#CALC!`-class error, just like gsheets collapses to `N_A`. Lattice carries Lambda as a real cell-value type. **Same conclusion as the gsheets walk:** schema must carry a Lambda variant for Lattice's sake even though Excel never emits one.

- **Empty / null at cell boundary.** Excel's behavior differs from gsheets in subtle ways:
  - **Truly empty cell:** no `<c>` element in `sheet1.xml` at all (or `<c>` with no `<v>` child). openpyxl `data_only=True` returns `None`. ISBLANK returns TRUE.
  - **`=""`:** stored as `<c t="str"><f>"=" & "" & ""</f><v></v></c>` or `<c t="str"><v></v></c>` (TODO-probe the exact shape). openpyxl returns `""`. ISBLANK returns FALSE, ISTEXT returns TRUE. **Same as gsheets.**
  - **`=IF(,,)`:** TODO-probe. Excel's empty-argument coercion rules are slightly different from gsheets'. In gsheets `=IF(,,)` produces a Null-like value (ISBLANK TRUE, ISTEXT FALSE, but the API conflates it with `""`). Excel likely treats omitted-argument as `0` not Null (Excel uses `0` for missing positional args in most contexts). Worth confirming because if Excel doesn't have a runtime-Null distinct from `0`/`""`, the schema's `Null` variant is purely a Lattice + gsheets affordance, not a three-way superset requirement.

- **Linked Data Types (Stocks, Geography, Image).** A `=Stocks.Price` cell displays the price number but the underlying value is a *reference* to a structured record stored in `xl/richData/`. openpyxl `data_only=True` returns the *displayed* string ("Apple Inc.") or number; the record sub-fields are invisible. **No analog on gsheets** (Smart Chips are the closest but they don't carry computed sub-fields). **No analog on Lattice.** Three-way schema implication: either the canonical schema explicitly excludes Linked Data Types from cross-platform fidelity (categorize as Excel-only, like Smart Chips were gsheets-only) or we model them as a generic "structured cell value" variant.

- **CUBE functions** (`=CUBEVALUE(...)`, `=CUBEMEMBER(...)`). Cached value is a scalar; underlying type is a cube member with `.Caption`, `.UniqueName`, `.Type`. Like Linked Data Types but older. **Excel-only.** Recommend excluding from canonical schema (category: "external-binding", not "cell-value").

- **Spilled-array anchor vs spilled cells.** Excel models a dynamic array as one *anchor* cell with the formula and N-1 *spilled* cells with implicit references. The xlsx stores `<f>` only on the anchor; spilled cells have a `cm` (cell metadata) attribute pointing into `metadata.xml`'s `futureMetadata` to mark them as spill recipients. The current driver reads back the spilled values via `data_only=True` so spill output is captured *as values*, but the anchor-vs-spill identity is lost. gsheets has a different model (ARRAYFORMULA returns a range; cells in the range carry no formula). **Cross-platform implication:** the schema may need an "is-this-cell-a-spill-recipient" axis, or it may be acceptable to flatten — the gsheets walk didn't surface this question because gsheets doesn't expose the anchor/recipient split in the API.

## OOXML cell field walk

The `<c>` element's attributes + children, in rough spec order. Same relevance classifications as the gsheets walk:

- **drives-divergence** — has produced or is likely to produce real cross-platform divergence claims.
- **cosmetic** — purely visual.
- **anchor-only** — cell is a marker for a larger structure.
- **excel-only** — no analog on gsheets or Lattice.
- **unverified** — needs empirical probe before classification.

**Reach column** — which surface (A=openpyxl per-cell, B=xlwings live `.api`, C=raw OOXML) exposes this field. The cheapest surface is named first when multiple work.

| # | Field | Type | Captured today? | Reach | Relevance | Notes / divergence shape |
|---|---|---|---|---|---|---|
| 1 | `r` | string (cell ref) | yes (positional) | A, B, C | n/a | A1-style ref. Coordinate, not data. |
| 2 | `t` | enum (n/s/str/inlineStr/b/e/d) | partial — collapses through `_value_to_cell` | A (`cell.data_type`) | drives-divergence | The value-category attribute. Distinguishes booleans from 0/1, errors from strings, etc. Currently inferred from Python type at read time; openpyxl exposes it directly. |
| 3 | `s` | int (style index → `cellXfs`) | no | A (`cell.number_format`, `cell.is_date`, `cell.font` etc.) | drives-divergence (via numFmt) | Index into `styles.xml`'s `cellXfs` → `numFmtId` → `numFmts`. The "is this cell a date?" signal. **Critical — this is the analog of `effectiveFormat.numberFormat.type` in gsheets.** Currently destroyed by `_dt_to_serial` flattening dates to numbers. openpyxl resolves the index → pattern for free; type inference from pattern still ours. |
| 4 | `cm` | int (cell metadata index) | no | **C only** | drives-divergence (spill) | Index into `metadata.xml`. Identifies spill recipients and dynamic-array metadata. Anchor vs recipient distinction lives here. openpyxl drops it. |
| 5 | `vm` | int (value metadata index) | no | **C only** | unverified | Value metadata index. Used for rich data type tagging (Linked Data Types use this to reference `xl/richData/`). |
| 6 | `ph` | bool (phonetic) | no | C only | n/a-cross-platform | Phonetic guide text for East Asian locales. Cosmetic. |
| 7 | `<f>` | string (formula) | n/a (we own input) | A (`cell.value` with `data_only=False`), B (`.formula`/`.formula2`) | n/a | Sub-attributes (`t="shared"`, `t="array"`, `t="dataTable"`, `aca`, `ca`, `dt2D`, `dtr`, `r1`/`r2`, `bx`, `si`, `ref`) carry array/shared-formula structure. We supply formulas, so capturing back is mostly a "did Excel re-parse our input the way we expected" check. Shared-formula master/non-master structure is C-only — openpyxl flattens it. |
| 8 | `<v>` | string (cached value) | yes | A (`cell.value`) | drives-divergence | The cached value. For `t="n"`/`t="b"`/`t="e"` it's the literal; for `t="s"` it's the sharedStrings index; for `t="str"` it's the computed string. |
| 9 | `<is>` | rich-string structure | partial — openpyxl returns the concatenated plain text via `iter_rows(values_only=True)` | A (`cell.value` returns `CellRichText`) | drives-divergence (rich text) | Inline string with `<r>` runs supporting per-run `<rPr>` (font/color/bold/italic/underline). openpyxl 3.1 `CellRichText` carries the runs through; just need to swap the read path. |
| 10 | `<x>` | extension | no | C only | excel-only | OOXML extension hook. Most rich-data-type associations land here via `extLst`. |

**Beyond `<c>`** — fields that live at the sheet level but are intrinsically part of "what's in the cell":

| # | Field | Sheet-level path | Reach | Relevance | Notes |
|---|---|---|---|---|---|
| 11 | `<hyperlinks>` block | `worksheet/hyperlinks/hyperlink` | A (`cell.hyperlink`), B (`Range.hyperlink`) | drives-divergence | **Excel does not store hyperlinks on the cell.** It stores a sheet-level table mapping cell ranges to URLs. Reading "the cell at A6 has a hyperlink to X" requires resolving the sheet's `<hyperlinks>` against the cell range; openpyxl does this for us. The gsheets walk concluded `textFormatRuns` is canonical and cell-level hyperlink is a single-link convenience. Excel's model is *closer* to gsheets' cell-level convenience, with one twist (next row). |
| 12 | `=HYPERLINK("url","text")` formula | within `<c><f>` | A (`cell.value` w/ `data_only=False`), B (`.formula`) | drives-divergence | Excel has *two distinct* hyperlink encodings: the sheet-level `<hyperlinks>` block (manual hyperlinks) and the `HYPERLINK()` formula (computed hyperlinks). The formula version does NOT populate the sheet-level hyperlinks block — the URL only exists inside the formula text. So an Excel cell with `=HYPERLINK("https://x", "click")` reads back as just `"click"` from `data_only=True`; the URL is only visible by re-reading the formula. **Silent-pass case identical to gsheets and Lattice.** |
| 13 | Rich text within strings | `<is><r><rPr>...` inline, or `<si><r><rPr>...` in `sharedStrings.xml` | A (`CellRichText`) | drives-divergence (per-run styling) | Per-run formatting inside a string value: color, font, bold/italic/underline. **OOXML does NOT support per-run hyperlinks** — links are always sheet-level. Real asymmetry: gsheets' `textFormatRuns[].format.link` has no exact OOXML equivalent. A multi-link cell in gsheets has no faithful Excel representation. |
| 14 | Comments (legacy) | `xl/comments<n>.xml` | A (`cell.comment`) | n/a-cross-platform | Cell annotations. Same as gsheets `note`. Out of scope for formula-divergence. |
| 14b | Threaded comments (modern) | `xl/threadedComments/<n>.xml` + `xl/persons/person.xml` | **C only** | n/a-cross-platform | Modern threaded comments (the @-mention model). openpyxl reads only the legacy comments file. |
| 15 | Data validation | `worksheet/dataValidations/dataValidation` | A (`ws.data_validations`), B (`.api.Validation`) | n/a-cross-platform | Input constraints. Same as gsheets `dataValidation`. Out of scope. |
| 16 | Conditional formatting | `worksheet/conditionalFormatting` | A (`ws.conditional_formatting`) — rules only; effective overlay needs B (`.api.DisplayFormat`) | partial — affects display only | Rule-based formatting. Cosmetic; doesn't change formula values. Effective overlay (post-conditional) is a live-engine concept that openpyxl can't materialize. |
| 17 | Pivot table cells | `xl/pivotTables/...` | A (metadata), C (full structure) | anchor-only | Pivot cell values are precomputed and stored in `<v>` of the affected cells; the pivot structure is anchor-only. Same as gsheets pivots. |
| 18 | Linked Data Types | `xl/richData/...`, referenced via `<c>`'s `vm` attribute | **C only**; some surface via B (`.api.LinkedDataTypeState`) on Windows | excel-only | Stocks/Geography/Image. **Excel-only.** No gsheets or Lattice analog. Per the Mac asymmetry note, Mac AppleEvents doesn't expose `LinkedDataTypeState` — Mac driver needs C; Windows driver could use B. |
| 19 | Dynamic-array spill anchor / recipients | `<c cm="...">` for recipients; anchor identified by having `<f>` + spill metadata in `metadata.xml` | **C only**; live anchor identifiable via B (`.api.HasSpill`/`SpillingToRange` — **Windows only**) | drives-divergence | The anchor/recipient identity is file-persisted but openpyxl drops the `cm` index. On Windows, live `.api.HasSpill` is reliable; Mac has no equivalent property — would need a side-channel formula probe. |
| 20 | `#GETTING_DATA` transient | none — engine-side only | **B only**, pre-save | drives-divergence (transient) | Async-fetch state. Not persisted to xlsx — by the time `wb.save()` returns Excel has resolved or errored. Capturable only by reading via xlwings `.api` *before* save. |

## Style/numberFormat walk (sub-fields of #3 `s` → `cellXfs` → numFmt)

The Excel analog of gsheets' `effectiveFormat.numberFormat`. A cell's `s` attribute indexes `styles.xml`'s `<cellXfs>` array. Each `<xf>` has a `numFmtId` pointing either at a built-in format code (0-163, reserved) or a custom format defined in `<numFmts>`.

| Built-in numFmtId | Format | Inferred type | Notes |
|---|---|---|---|
| 0 | General | inferred | The default. Number/text inferred from value. |
| 1-13 | Number formats (`0`, `0.00`, `#,##0`, percent, scientific, fraction) | NUMBER / PERCENT / SCIENTIFIC | Sub-distinguishable by code. |
| 14-22 | Date and time formats | DATE / TIME / DATE_TIME | The critical date-inference path. |
| 27-36, 50-58, 71-81 | Locale-specific date/time formats | DATE / TIME / DATE_TIME | Excel for-Mac and Excel-on-Windows differ on which locale-format IDs are populated; openpyxl handles the translation. |
| 37-44 | Accounting and currency | CURRENCY | |
| 45-49 | Time formats (mm:ss, h:mm:ss, etc.) | TIME | |
| 59-66, 67-82 | More locale formats | various | |
| 164+ | Custom (defined in `<numFmts>`) | parsed from pattern string | E.g., `"$"#,##0.00` is CURRENCY-flavored. Pattern-based heuristics needed. |

**Gap from gsheets:** the gsheets API gives us `effectiveFormat.numberFormat.type` directly as an enum (NUMBER, DATE, TIME, ...). Excel makes us derive it from the numFmtId via a built-in-table lookup plus pattern parsing for custom formats. openpyxl exposes `cell.number_format` as the *pattern string*, not the inferred type — so the lookup is on us.

**Schema implication:** the canonical `numberFormat.type` enum is platform-agnostic, but the *derivation* differs per platform. Excel side needs a built-in-table + pattern-parser; gsheets side just maps the API enum.

## Fields most load-bearing for fidelity

Distilled — schema work should plan to carry at minimum:

1. **Full Excel error sentinels + open-set tolerance.** The error model needs to admit `#SPILL!`, `#CALC!`, and future-Excel codes. Either string-keyed with a canonical mapping, or a discriminated union with explicit `unknown(string)`. Mapped to/from gsheets' `ErrorType` enum where the semantics line up.
2. **`s` → numFmt → inferred type (with pattern).** Same load-bearing field as gsheets' `effectiveFormat.numberFormat.type`. Derivation is harder on Excel side (built-in table + custom-pattern parse) but the schema slot is the same.
3. **Hyperlink — sheet-level table + HYPERLINK-formula text.** Two paths to "this cell has a link." The schema needs to carry the URL; the source-of-truth on Excel is whichever path produced it. Aligns with gsheets' "textFormatRuns + cell-level hyperlink convenience" but **without** the per-substring link model (Excel doesn't have one).
4. **Rich-text runs (per-run formatting, not per-run links).** Excel supports per-run color/bold/italic but **not** per-run hyperlinks. So the schema can carry per-substring formatting universally, but per-substring *links* are gsheets+Lattice only — Excel renders them at the sheet level.
5. **Linked Data Type record reference.** Excel-only structural cell value. Schema decision: carry as a generic "structured" variant, or categorize as Excel-only fidelity (parallel to Smart Chips being gsheets-only).
6. **Spill anchor vs recipient identity.** Excel distinguishes them in the file via `cm`; gsheets ARRAYFORMULA doesn't surface the split. Open: does Lattice surface it? If yes, the schema needs the axis; if no, flattening is fine.

## Out of scope (consciously)

Mirror the gsheets walk's exclusions:

- **Comments** — annotation, not value. Same reasoning as gsheets `note`.
- **Data validation** — input constraint, not output.
- **Pivot, table (ListObject), conditional formatting** — anchor-only or sheet-level rule structures.
- **CUBE functions / external connections** — external bindings; same category as gsheets' `dataSourceTable`.
- **Phonetic guide text (`ph`)** — locale cosmetic.
- **All purely cosmetic CellFormat sub-fields** (background, borders, padding, alignment, rotation, wrap, direction). No formula-result implication.
- **Linked Data Types** — *tentative*; depends on schema-design decision (#5 above). If we exclude, this is an Excel-only fidelity gap by design.

## Open questions — to resolve empirically

The gsheets walk had 5; this one starts with at least these. Resolve via a probe script analogous to [`gsheets-celldata.mjs`](../scripts/probes/gsheets-celldata.mjs), but with two probe targets: openpyxl reading the saved xlsx, *and* unzipping the xlsx and inspecting the raw XML. Probes that need *live* Excel state (`#GETTING_DATA` in-flight) require xlwings reads pre-save.

1. **LAMBDA at cell boundary.** Does `=LAMBDA(x, x+1)` in a cell produce `#CALC!`, `#VALUE!`, or something else? Probe via the existing driver — output is whatever sentinel ends up in `<v>`.
2. **`=IF(,,)` and other Null-producing constructs.** Does Excel have a runtime-Null distinct from `0`/`""`/empty? Test ISBLANK, ISTEXT, ISNUMBER, concat, `="" =` comparisons on `=IF(,,)`, `=IF(TRUE,,)`, `=VLOOKUP("nope", A1, 1, FALSE)` returning missing-positional-arg results. If Excel collapses to `0` everywhere, the schema's `Null` variant is gsheets-and-Lattice-only.
3. **`#GETTING_DATA` reachability from the saved-xlsx pipeline.** Generate an async-function load (`STOCKHISTORY`, `WEBSERVICE`, or a Power Query refresh), save before resolution. Does `<v>` carry `#GETTING_DATA` in the file, or does Excel flush to a final state at save?
4. **Hyperlink encoding asymmetry.** Three authoring paths: (a) manual hyperlink via UI / `cell.hyperlink = ...` — lands in sheet-level `<hyperlinks>`; (b) `=HYPERLINK("url","text")` formula — URL lives only in formula text; (c) typed URL auto-recognized — TODO-probe whether Excel populates the sheet-level table for these like gsheets does for the typed multi-URL case. For each, what does openpyxl `data_only=True` expose vs `cell.hyperlink`?
5. **numFmt inference propagation.** Does `=A7` (where A7 is `=DATE(2023,3,19)`) inherit the date numFmt the way gsheets does? Excel calc-engine *should* propagate it through references, but the *file-level* style index is set by the user / autoformat rules, not the calc engine. Probe: a chain of date-producing → reference → reference and inspect each cell's `s` attribute.
6. **`#NULL!` from intersect operator.** `=A1:A10 B11:B20` (truly non-overlapping). Confirm Excel emits `#NULL!` and that openpyxl preserves it. (gsheets parsed this as `#ERROR` parse-failure; Excel should treat the space as intersect.)
7. **`#SPILL!` and `#CALC!` sub-flavors.** Both have UI-visible sub-categories ("Spill range isn't blank", "Spill range too big", "Empty array", "Recursive lambda"). Does any of that sub-flavor make it into the `<v>` sentinel, or is the file-level encoding always just the bare `#SPILL!` / `#CALC!`?
8. **Linked Data Type surface.** A `=Stocks.A1` cell with a real Stocks linkage — what does `<c>` look like? What does openpyxl return for `cell.value`? What does the `xl/richData/` parts contain? This is the highest-effort probe — needs an Excel session signed into a Microsoft account with the data service available.
9. **Spill recipient cells in the file.** For a 5-row `=SEQUENCE(5)` at A1: do A2-A5 have `<c cm="...">` entries with no `<f>`, or are they just empty? Verify via raw XML inspection.
10. **`d` vs `n` for dates.** Does openpyxl write Strict-OOXML `t="d"` cells, Transitional `t="n"` with date numFmt, or both? What does Excel-Mac vs Excel-Windows do on save? (Cross-platform calibration matters here per [project-assay-driver-fidelity](.../memory/project-assay-driver-fidelity.md) — user can verify Mac; Windows behavior is inference.)

## Schema-design inputs (handoff to next phase)

This walk produces these concrete inputs for the assay-canonical schema:

- **Error model:** open-set tolerance. Either `{type: string, message?: string}` keyed by canonical-code, or a discriminated union with explicit `unknown(string)`. Mapping table between Excel sentinels and gsheets `ErrorType` enum lives at the contracts boundary.
- **numFmt type derivation:** schema enum is platform-agnostic; per-driver translators map (a) gsheets API enum → schema enum, (b) Excel numFmtId + pattern → schema enum.
- **Rich-text per-run formatting:** universal axis (color/bold/italic/underline).
- **Per-run *links*: gsheets + Lattice only.** Excel renders multi-link cells as sheet-level mappings, not per-substring. Schema needs to carry the per-substring model for fidelity, but the Excel driver projects to/from sheet-level.
- **Hyperlink double-path:** Excel-side, the canonical URL source can be `<hyperlinks>` *or* the `HYPERLINK()` formula text. Driver needs to consult both.
- **Spill anchor/recipient:** open — depends on Lattice's model. If Lattice surfaces the split, schema needs an axis. If Lattice flattens, both drivers flatten.
- **Linked Data Types:** open — either a generic structured-value variant in the schema, or categorize as Excel-only and exclude from cross-platform fidelity (parallel to Smart Chips being gsheets-only).
- **No `message` field at file-level.** Excel's saved-xlsx error encoding has no message. Live engine has one (`Range.Errors` and the UI banners) but it's a separate driver-side capability question. Schema's `message?` optionality already handles this.

## Surprises worth noting (so far)

- **Excel persists no error messages.** All error context lives in the live engine, not the file. Driver enrichment would need pre-save xlwings reads.
- **The driver actively destroys date-type information** via `_dt_to_serial` ([`excel_driver.py:36`](../python/excel_driver.py)) to match gsheets' UNFORMATTED_VALUE output. That decision is sound for the current intersection-based `CellValue`, but it's the *first thing to revisit* once the schema carries `numFmt.type`.
- **HYPERLINK formula and manual hyperlink are different file-level surfaces in Excel** — unlike gsheets, where both paths populate `textFormatRuns[].format.link`. So Excel's "where's the URL?" answer is path-dependent.
- **Excel has no per-substring link encoding.** A multi-link gsheets cell has no faithful Excel projection; Excel can only express "the whole cell links to URL X" or "the formula contains the URL." This is an asymmetric capability of gsheets/Lattice that the schema needs to record but the Excel driver cannot fully emit.
- **Spill recipients are tracked in the file** via `cm` (cell metadata) indexes — not just a runtime concept. gsheets ARRAYFORMULA has no equivalent persistence of "this cell is the 3rd recipient of the formula at C1."

## What this enables

Same as the gsheets walk: input to the next phase, which is design of the assay-canonical `CellValue` schema (plus matcher extensions for case-`expect` assertions on the new fields). With both walks landed, the schema can be designed against the *union* of what gsheets and Excel surface — and we can name Lattice-only and Excel-only fields explicitly rather than discovering them mid-implementation.

## Related

- [[project-assay-driver-fidelity]] memory — broader fidelity workstream.
- [`gsheets-celldata-gap.md`](./gsheets-celldata-gap.md) — gsheets-side companion. Closed-set ErrorType, single API surface, per-substring link encoding.
- [`packages/assay/src/format/types.ts`](../src/format/types.ts) — current `CellValue`, `CellError`, `Matcher`.
- [`packages/assay/src/drivers/excel.ts`](../src/drivers/excel.ts) — Node-side driver entry.
- [`packages/assay/python/excel_driver.py`](../python/excel_driver.py) — two-stage xlwings + openpyxl pipeline.
- ECMA-376 Part 1, Section 18 (SpreadsheetML) — wire-format spec.
