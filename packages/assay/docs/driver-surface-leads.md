# Driver-surface leads inventory

> **Framing.** The driver-fidelity audit is a search for ground — the union of engine state programmatically observable across all reachable access surfaces. Each "lead" is a candidate surface that potentially exposes state our current drivers don't capture. The leads here were catalogued as prep for the **driver-surface coalescing session** that combined LIVE leads into comprehensive per-engine drivers maximizing visible state.
>
> **Coalescing session result (2026-05-23):** the per-engine `RichCellValue` contract + driver migrations landed end-of-day; see [`driver-surface-coalescing-2026-05-23.md`](./driver-surface-coalescing-2026-05-23.md) "Implementation log" for what shipped. This doc remains the source of truth for which leads were evaluated and their disposition; LIVE leads have driver code; PARTIAL leads marked DEFERRED have documented reasons.
>
> **Verifier pass:** [`driver-surface-verifier-2026-05-23.md`](./driver-surface-verifier-2026-05-23.md) is the cleanup/sign-off pass for these statuses (pre-coalescing).

## Ground axes

"Ground" isn't a single axis — a surface can expose new state along several dimensions. A surface that's lossy on one axis (cell-value typing depth) may still be load-bearing on another (cloud-hosted coverage, runtime-event observation, CI-friendliness, etc.). Each lead below records its verdict *per axis*, not just overall. Axes considered:

- **A1 — Cell-value typing depth.** Richness of typed cell-value model (Office.js 15-variant CellValue is the ceiling; classic narrow `Unknown|Empty|String|Integer|Double|Boolean|Error` is the floor).
- **A2 — Structural / per-cell metadata.** Merge, banding, protection, data validation, developer metadata, notes, hyperlinks, rich text per-run formatting.
- **A3 — Format-state visibility.** numberFormat, font, fill, borders, effectiveFormat overlay.
- **A4 — Formula representation.** A1 vs R1C1 notation; IIE-dialect vs AE-dialect; function-name namespace prefixes.
- **A5 — Runtime-event observation.** Triggers (onEdit, onOpen, onChange, time-driven); ability to react to calc events.
- **A6 — Function-evaluation primitive.** Ability to invoke an arbitrary formula against the engine without writing to a file/cell and reading back.
- **A7 — Workbook-source coverage.** What workbook locations the surface can read: local file, cloud-hosted (OneDrive/SharePoint/Drive), in-browser/embedded.
- **A8 — Operational characteristics.** Latency, throughput, concurrency, quota envelope, CI-friendliness (no local Excel/browser install), auth flow.

## Lead status legend

- **LIVE** — surface adds ground on ≥1 axis; partially or fully exploited by current driver code.
- **PARTIAL** — surface is lossy on the originally-tested axis (typically A1) but live on others. Worth a per-axis decision in the coalescing session.
- **DEAD** — surface adds NO ground on any axis; or strictly subset of an existing LIVE surface across all axes. Drop from coalescing scope.
- **PENDING** — identified, not yet evaluated. Candidate for future investigation; effort + likely-payoff noted.

## Excel

The Excel engine is the most extensively audited so far. Four surfaces are LIVE; one is DEAD; multiple PENDING surfaces remain — at least one (Office.js as a primary driver path) is high-value.

### LIVE

| Surface | Driver code | What it adds | Evidence |
|---|---|---|---|
| **A — openpyxl static read** | `python/excel_driver.py` `read_sheet_result_rich()` | File-format reader. Cell values, types, hyperlinks, comments, rich-text runs, basic format strings. Normalizes some fields (`t="str"` → `data_type="s"`; default attributes stripped). | [`excel-driver-fidelity.md`](./excel-driver-fidelity.md) F-series probes; D1/D2 catalog disagreements |
| **B — xlwings live `.api`** | `python/excel_driver.py` `_capture_surface_b_for_sheet()` + `RichCell.surface_b` (Windows live path) + `_excel_extras` Mac-derived fallback (landed 2026-05-23/24 in coalescing session). | Reads Excel's runtime view: `Range.DisplayFormat.NumberFormat` (conditional-formatting overlay), `Range.Value2` (bit-accurate raw value; dates as serials), `Range.SavedAsArray` (writer-heuristic result). On Mac the live capture path is disabled (Apple Events bridge can't sustain the round-trip volume — `OSERROR -609` after 2-3 calls), so Mac fixtures get a derived `saved_as_array` (from OOXML `<f t="array">` marker via `raw_xml.formula_array_marker`); `value2` is intentionally not emitted on Mac as it would just duplicate `primitive.value`; `display_format.number_format` is the Mac gap (CF overlay not derivable from saved file). | F21 (`SavedAsArray`), F22 (`Range.Formula`/`Formula2`), F23 (`DisplayFormat`), F24 (`Value2`). **Empirically verified 2026-05-24 via the D9 #SPILL! probe — Mac derived path produces the right shape.** Windows live path landed but untested without a Windows runner. CF overlay on Mac is future work (Office.js or osascript bulk fetch). |
| **C — raw OOXML XML reader** | `python/excel_driver.py` `RawXmlReader` | Captures OOXML fields openpyxl drops/normalizes: `cm`, `vm`, `s`, `<f t="array" ref=...>`, namespace prefixes, sheet-level `<hyperlinks>` + their rels, `formula_namespaces`. | A3 driver lift, 2026-05-22; F6, F10, D7 |
| **D — vm-dereferencing into rich-value table** | `RawXmlReader.resolve_vm()` | Resolves the `vm=` indirection chain (`xl/metadata.xml` valueMetadata + futureMetadata → `rdRichValue.xml` → `rdRichValueStructure.xml`) to recover modern errors (11 codes: `#SPILL!`, `#CALC!`, `#NAME?`, `#FIELD!`, `#BUSY!`, `#CONNECT!`, `#BLOCKED!`, `#UNKNOWN!`, `#EXTERNAL!`, `#TIMEOUT!`, second `#BUSY!`-waiting form). Spill geometry extras (`colOffset`, `rwOffset`) come through. | F26 finding; D9 driver lift, 2026-05-22. **VERIFIED 2026-05-23 via probe C9** on Excel-for-Mac fixture; verification corrected the F26 indirection chain (valueMetadata layer was missing) and added case-insensitive part lookup. Note: the helper is reachable and verified, but public scalar `read_sheet_result()` still collapses rich descriptors until the coalescing/schema session decides how to emit them. |

### PARTIAL (originally DEAD on cell-value typing; reframed 2026-05-23 with multi-axis evaluation)

**Microsoft Graph Excel REST API** (v1.0 + beta)

| Axis | Verdict vs current Excel surfaces (A+B+C+D) | Notes |
|---|---|---|
| A1 cell-value typing depth | **DEAD** | Locked at classic-narrow surface. No `valuesAsJson`, no 15-variant CellValue. Strict subset of Office.js. (F25) |
| A2 structural metadata | DEAD | Sheet-level merge/banding via separate Graph resources; not richer than Surface A+C provide for file-based workbooks |
| A3 format-state | DEAD | `numberFormat` grid present but identical to A+C |
| A4 formula representation | NEUTRAL | `formulas` / `formulasLocal` / `formulasR1C1` parallel grids — `formulasR1C1` IS R1C1; we don't expose R1C1 today but this isn't unique to Graph (xlwings `.api.Range.FormulaR1C1` would too) |
| A5 runtime-event observation | **NEUTRAL/UNKNOWN** | Graph doesn't natively expose calc-event hooks (would need to layer webhooks via OneDrive change-notification subscriptions). Likely not load-bearing. |
| A6 function-evaluation primitive | **LIVE — UNIQUE** | `POST /workbook/functions/{name}` invokes any Excel function against the workbook without writing into cells. Returns `{error, value}`. **No current Excel driver exposes this.** Useful for differential calc-engine probing without polluting workbooks. |
| A7 workbook-source coverage | **LIVE — UNIQUE** | Reads OneDrive / SharePoint / Microsoft 365 cloud workbooks WITHOUT downloading. Current drivers all assume a local file. **The only cloud-hosted Excel coverage path.** |
| A8 operational characteristics | **LIVE — UNIQUE** | No local Excel install required. CI-friendly (runs on Linux). Session sandboxing via `persistChanges:false` for non-destructive probes. Trade-off: quota envelope is opaque (no published RPM/RPS); auth requires MS-account OAuth. |

**Verdict:** PARTIAL. **DEAD as a primary cell-value-typing driver** (Office.js + xlwings + raw OOXML + D9 strictly dominate on A1/A2/A3). **LIVE on A6/A7/A8** — adds three distinct operational capabilities that no other Excel surface provides. **Coalescing-session decision (2026-05-23): DEFERRED.** Mac mini runner handles CI Excel today; A8 not load-bearing. No current assay fixtures are cloud-hosted (A7 not needed). A6 function-evaluation is interesting for differential calc-engine probing but not load-bearing now. Reopen if (a) CI Excel moves off Mac mini, (b) cloud-hosted workbook coverage becomes a use case, or (c) differential engine-version probing is needed. **Source:** F25.

### PENDING (identified, not yet evaluated as ground-exposing — listed roughly by likely-payoff)

#### High likely-payoff

1. **Office.js / Excel JS API as a primary driver path** — `Range.valuesAsJson` exposes the full 15-variant `Excel.CellValue` discriminated union (Entity, LinkedEntity, Array, Reference, WebImage, FunctionCellValue, FormattedNumber, etc.). The richest typed-cell-value surface Microsoft publishes. We currently parse the legacy/wire path; Office.js would let the engine rehydrate everything for us. **Cost:** new driver — needs Excel running OR Excel for Web (headless browser); separate from xlwings path. **Payoff:** likely the single biggest ground-exposing lead remaining for Excel.
2. ~~**Surface B full lift**~~ — **LANDED 2026-05-23** in coalescing session. Now LIVE; see Surface B row in the LIVE table above. Per-property empirical verification on Mac mini Excel still pending; try/except guards isolate any platform-specific `.api` failures.

#### Medium likely-payoff (meta-research / spec-gap-filling)

3. **Open XML SDK (.NET)** — typed C# wrapper around MS-XLSX. Sometimes documents fields the MS-XLSX spec page is silent on. Candidates: the `_xludf.` / `_xlfn.` promotion contract (F6 gap), the `subType` integer-to-string map (F26 gap), `xlOmittedCells`/`xlStaleValue` persistence shape (F20 gap), Mac/Win OOXML drift specifics (C4 gap). **Cost:** read-only research, no new driver code. **Payoff:** closes documentation gaps but doesn't itself add a runtime driver surface.
4. **Excel JS API preview / 1.19+ beta variants** — `LocalImageCellValue`, `FunctionCellValue`, `ExternalCodeServiceObjectCellValue` — newer cell-value variants under feature flag. Cataloging them sets the schema-design ceiling. **Cost:** research-only at the lead-evaluation stage; later driver lift if a beta surface becomes critical. **Payoff:** scopes the rich-cell-type ceiling we'd want our schema to model.

#### Lower likely-payoff (orthogonal or redundant scope)

5. **XLL C API** — legacy C interface. `XLOPER12` type system (num / str / bool / int / err / multi / missing / nil / sref / ref). Engine-primitive perspective. **Cost:** heavy investment; finance/quant-focused. **Payoff:** likely only useful as cross-reference to Office.js + MS-XLSX, not as a new driver surface.
6. **VSTO (.NET add-in SDK)** — VBA-like object model with .NET types. Probably redundant with VBA-layer research already done (F20-F24).
7. **Excel for Web JS SDK** — subset of Office.js + Microsoft Graph. Likely subset of Surface (1) above.
8. **XLSB binary format** — same logical model as XLSX, different encoding. Quick check worth running: does Excel persist anything differently? Empirically save-a-test-workbook-to-XLSB-and-diff would answer in minutes.

#### Orthogonal scope (cell-value impact only if scope expands)

9. **Power Query M language types** — separate type system for data-pipeline cells. Records, lists, tables, durations. Relevant only if assay extends to Power Query-loaded data.
10. **Excel Data Model / Power Pivot / DAX** — embedded tabular database. Relevant when cube-reference cells (CUBE functions) appear.

## gsheets

The gsheets engine has one heavily-audited LIVE surface, one DEAD, and a small handful of PENDING leads. Notably less ground-rich than Excel because Google's docs are documentation-poor and the engine surfaces less.

### LIVE

| Surface | Driver code | What it adds | Evidence |
|---|---|---|---|
| **I — REST `spreadsheets.get?includeGridData=true`** | `src/drivers/gsheets.ts` | Full `CellData` per cell: `userEnteredValue`, `effectiveValue`, `formattedValue`, `hyperlink`, `textFormatRuns`, `effectiveFormat.numberFormat`, error message text. Field-mask configurable. | B driver lift, 2026-05-22; G1-G5 findings |

### PARTIAL (originally DEAD on cell-value typing; reframed 2026-05-23 with multi-axis evaluation)

**Apps Script `SpreadsheetApp`** (gsheets-side)

| Axis | Verdict vs current gsheets surface (REST `spreadsheets.get?includeGridData=true`) | Notes |
|---|---|---|
| A1 cell-value typing depth | **DEAD** | `ValueType` enum: only Number/Boolean/Date/String/IMAGE. No BLANK/NULL/EMPTY/ERROR. Strict subset of REST `effectiveValue`. (G6) |
| A2 structural metadata | **PARTIAL — POSSIBLY LIVE** | `getMergedRanges()`, `getDataValidations()`, `getBandings()`, `getDeveloperMetadata()`, `getNotes()` all exist as Range getters. REST exposes most of these (merges via sheet-level `merges[]`, dataValidation in CellData, developerMetadata as separate resource) but Apps Script's Range-level getter form may simplify per-range queries. **Needs side-by-side comparison.** |
| A3 format-state | NEUTRAL | `getBackgrounds()`, `getFontWeights()`, `getFontStyles()`, `getNumberFormats()` all exist — same data as REST `effectiveFormat`, different access shape. |
| A4 formula representation | **LIVE — UNIQUE** | `getFormulasR1C1()` returns R1C1 notation. **REST API only exposes A1.** Apps Script is the only gsheets surface that gives R1C1. |
| A5 runtime-event observation | **DEPRIORITIZED (not a priority surface for assay scope per user, 2026-05-23)** | Triggers (`onOpen`, `onEdit`, `onChange`, `onSelectionChange`, installable, time-driven) do exist and REST polling cannot observe them. But: they require edit access + trigger-code injection + a Playwright-driven harness to fire user actions, and runtime-event assertions aren't load-bearing for assay's case-file shapes. If scope ever expands to "engine behavior in response to edits," reopen this. |
| A6 function-evaluation primitive | **NOT VIABLE** (corrected 2026-05-23 after user pushback + re-read of docs) | Custom functions exist but: (a) bound to the spreadsheet, require edit access — can't be injected into someone else's workbook; (b) can only see their own arguments, NOT other cells / sheet state / active range; (c) 30-second timeout; (d) volatile functions (NOW/RAND) can't be passed as args; (e) docs are silent on whether they run inside the calc engine vs in V8 called from the engine. **Not usable as a general-purpose engine introspection probe.** Source: [developers.google.com/apps-script/guides/sheets/functions](https://developers.google.com/apps-script/guides/sheets/functions). |
| A7 workbook-source coverage | NEUTRAL | Same as REST — Apps Script accesses workbooks via the same auth boundary as the Sheets API. |
| A8 operational characteristics | NEUTRAL/CAVEAT | Different quota envelope than REST (Apps Script has its own daily-limits structure; runs server-side in Google's infrastructure). Trade-off: requires writing + deploying GAS code, more setup than a REST call. |
| **Incidental finding (A2)** | `ValueType.IMAGE` is the one Google-authoritative typed term for embedded-image cells. If a future surface needs to name them, this is the canonical word. |

**Verdict:** PARTIAL (narrowed twice in 2026-05-23 session). **DEAD as a primary cell-value-typing driver** (REST + empirical-probe-data dominate on A1). **LIVE on A4 only** — Apps Script's R1C1 formula representation is the one axis where it's the unique source of ground:
- **A4:** R1C1 formula notation (REST is A1-only)

**A5 (triggers) DEPRIORITIZED 2026-05-23** per user direction — not a priority surface for assay scope. Reopen if scope ever extends to "engine behavior in response to edits."

**A6 (function-evaluation primitive) DROPPED 2026-05-23** after user pushback prompted a re-read of the custom-functions docs. Custom functions are sandboxed (arguments-only visibility, 30s timeout, bound to spreadsheet via edit access) and the docs don't claim they run inside the calc engine. Not a viable injection primitive.

**Coalescing-session decision (2026-05-23): DEFERRED with documented gap.** R1C1 is a presentation difference, not a semantic difference (formula is identical; only cell-ref notation changes). Apps Script integration cost is high (per-spreadsheet deployment, separate quota, separate auth). Reopen when a concrete test in the catalogue depends on observing R1C1. Named Functions and other Sheets features in the same Playwright-required tier remain separately tracked under "NO SURFACE" + "PENDING". **Source:** G6 + 2026-05-23 follow-ups.

### NO SURFACE (engine features that exist but have no programmatic access path)

| Feature | Why it's a gap | Source |
|---|---|---|
| **Sheets Named Functions** (user-defined reusable formulas via Data → Named functions) | NOT in v4 REST API Spreadsheet resource (no `namedFunctions` field; only `namedRanges` for cell ranges). NOT accessible from Apps Script. Verified 2026-05-23. **Formulary will need to test these for compat coverage** but no driver surface exists. Workarounds: wait for Google API support, build UI-driven harness (Playwright), or find unofficial endpoint. | G7; user (gsheets SME) confirmed |

### PENDING (identified, not yet evaluated)

#### Low-effort, modest payoff

1. **Sheets API `developerMetadata` resource** — workbook/sheet/range-level metadata. Unknown whether Google uses it for engine-state annotations (formula provenance, cache markers, etc.). Worth a 1-pass read of the docs. **Cost:** docs read + one probe call. **Payoff:** unclear but cheap to confirm.
2. **Sheets API `pivotTable` / `dataSourceTable` / `dataSourceFormula`** — these are anchor-cell models the audit cited as Google-acknowledged precedent for ARRAYFORMULA spill. They're documented but our driver doesn't capture them. **Cost:** modest if we want to read them. **Payoff:** captures embedded-table cell state. Useful for any workbook using DataSource cells.
3. **Sheets API `chipRuns`** (Smart Chips) — referenced in the original [`gsheets-celldata-gap.md`](./gsheets-celldata-gap.md) but not currently read by the driver. Captures embedded entity-card references inside text. **Cost:** field-mask addition + decode logic. **Payoff:** the gsheets analog of Excel's LinkedEntityCellValue.
4. **Embedded charts via `Sheet.charts`** — orthogonal to cell-value but a workbook feature. Cell-value impact only for chart-reference cells.

#### Uncertain payoff

5. **Connected Sheets / BigQuery integration** — separate API surface for BigQuery-backed workbooks. Cell-value impact only for cells in connected ranges.
6. **Sheets API discovery doc beyond v4** — any beta endpoints? Quick check.

## Other engines in the catalogue (open-source — full ground access available)

The assay catalogues 8 engines total. Excel and gsheets above are extensively audited. The remaining 6 are **open-source**: full source-level ground access is available; the question is what their current drivers expose vs what's reachable. **No per-engine ground audit has been done yet.** Each entry below is just a stub for the future coalescing session to scope.

| Engine | Driver | Audit status | Notes |
|---|---|---|---|
| **formulas** | `src/drivers/formulas.ts` | Not audited | Open-source JS library. Internal state likely accessible via API or by reading source. |
| **hyperformula** | `src/drivers/hyperformula.ts` | Not audited | TS library; in the preview-runner subset (one of 3 implemented for preview). Engine internals likely exposed via library API. |
| **ironcalc** | `src/drivers/ironcalc.ts` | Not audited | Rust library, JS bindings. Engine internals likely accessible but may require WASM-layer plumbing. |
| **lattice** | `src/drivers/lattice.ts` | **Deferred (user direction)** | User controls Lattice codebase; will fold in when ready. Lead status: deliberately not audited yet. |
| **libreoffice** | `src/drivers/libreoffice.ts` | Not audited | UNO API surfaces accessible via Python or Java bridges. Significant engine surface area. |
| **pycel** | `src/drivers/pycel.ts` | Not audited | Pure-Python formula engine. Engine internals likely accessible by reading source. |

**Per-engine ground audit** is a discrete unit of work for the coalescing session — for each non-Excel non-gsheets engine, identify (a) what state the engine internally tracks, (b) what the current driver currently captures, (c) the delta.

## Cross-cutting threads (not engine-specific)

1. ~~**Empirical fixture verification of D9 (probe C9)**~~ — **PASSED 2026-05-23.** The verification cycle materially improved D9: corrected the F26 indirection chain (added `<valueMetadata>` layer) and added case-insensitive rich-value-part reading (Excel for Mac saves lowercase). Probe at [`scripts/probes/verify-d9-resolve-vm.py`](../scripts/probes/verify-d9-resolve-vm.py) is re-runnable; useful as the seed for additional modern-error probes (e.g. `#CALC!` via FILTER-with-empty-result, `#FIELD!` via Stocks data-type column reference).
2. **Standardized "what does the engine actually see?" probe protocol** — the existing probes (Excel + gsheets) are scenario-driven; a more systematic engine-state probe pattern would speed up per-engine audits for the 6 open-source engines.

## How to use this doc (for future coalescing session)

1. **Read this doc first** to know which leads are LIVE, DEAD, and PENDING.
2. **For each LIVE lead**, check whether the current public driver output emits it or only captures it internally. Example: D9 `resolve_vm()` is verified and reachable, but public scalar output still collapses rich descriptors; Surface B is documented by probes but not wired into reads. The coalescing session's job is to combine these per-engine for maximum visible state.
3. **For each PENDING lead**, decide investigate-now / defer based on the likely-payoff annotations above and the schema fidelity bar the session is targeting.
4. **For DEAD leads**, don't reinvestigate unless something changes externally (Microsoft adds `valuesAsJson` to Graph; Google adds an Apps Script `ValueType.NULL`).
5. **Schema design** is downstream of the coalescing — once we know the ground each engine can be made to expose, the schema models that ground. Until then, the schema work is exploratory only (see [`schema-design-precedents.md`](./schema-design-precedents.md) for the prep material).
