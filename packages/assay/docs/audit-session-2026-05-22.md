# Audit session 2026-05-22 — index + handoff

Single-session archival pass over a substantial assay audit. Future agents picking up cartularium driver-fidelity work should read this doc first; it links to every artifact produced in the session, summarizes the state, and queues what's next.

> **Status (end of 2026-05-24):** **coalescing session shipped + greenfielded**. The full runner-side regen (`assay generate tests/*.yaml --platform excel,gsheets` on chris's Mac mini) produced **0 failures across 1955 tests × 2 platforms** (1194 recorded, 277 documented divergences). 100/100 assay tests + 37/37 contracts tests green locally. D9 modern-error wire-in empirically verified via a `#SPILL!` probe. Mac Surface B resolved: derived path emits `saved_as_array` from OOXML; `value2` skipped as redundant with primitive; CF overlay is the lone Mac gap (deferred to Office.js / osascript future work). See [`driver-surface-coalescing-2026-05-23.md`](./driver-surface-coalescing-2026-05-23.md) "Implementation log" + "Runner-side full regen" for full detail, including the four post-regen triage fixes (errorType=6 mapping, FILTER `#CALC!` expectation, SPLIT gsheets override, removed scratch probe YAML).
>
> **In flight as of session close:** auditor review + commit of the migration. Local working tree + runner are aligned (both have the migration changes + the 4 triage fixes); fixtures pulled back from runner so the local repo has the rich-shape fixture set.

> **Reframe note (2026-05-23):** The audit work is best understood as **a search for ground** — the union of engine state programmatically observable across all reachable access surfaces. Each research thread evaluated a candidate driver-surface lead. The next major work item was the **driver-surface coalescing session**: combine LIVE leads into comprehensive high-fidelity per-engine drivers maximizing visible state. The leads inventory in [`driver-surface-leads.md`](./driver-surface-leads.md) was the prep artifact for that session, now complete. Schema unification across engines (cross-engine semantic reconciliation) remains downstream of per-engine coalescing.
>
> **Verifier pass (2026-05-23):** [`driver-surface-verifier-2026-05-23.md`](./driver-surface-verifier-2026-05-23.md) rechecked the live Sheets probe, official API surfaces, D9/C9 status, and stale contradictions in this handoff set.

## TL;DR

- **Excel + gsheets driver-fidelity audit substantially complete.** Empirical probes + nine research-validation threads (cross-validated against MS-XLSX spec, Excel JS API, VBA reference, M365 release notes, Google Workspace docs, Microsoft Graph reference, ECMA-376, Apps Script reference, Office support).
- **Driver lifts (A1+A2+A3 for Excel, B for gsheets, D9 vm-dereferencing for Excel) shipped + verified.** E2E verification: 17/17 pass through ExcelDriver (covers A1+A2+A3+B). **D9 fixture verification PASSED 2026-05-23** via probe C9 — `resolve_vm(1) = {symbol: "#SPILL!", errorType: 8, subType: 1, extras: {colOffset: 2, rwOffset: 2}}`. Verification cycle surfaced + fixed two implementation bugs (the OOXML agent's pseudocode skipped the `<valueMetadata>` indirection layer; Excel for Mac saves rich-value parts lowercase). F26 chain corrected accordingly.
- **Five clean two-engine divergence axes** confirmed (ISBLANK propagation, CELL("type"), COUNTBLANK, COUNTA, intersect-error, LAMBDA-cell-boundary).
- **All three queued research threads completed in same session as a follow-up pass. Driver-surface verdicts (revised 2026-05-23 via multi-axis re-evaluation):**
  - **Thread 1 (Microsoft Graph Excel REST API): PARTIAL lead.** F25 added — DEAD on cell-value typing depth (A1), LIVE on **A6 function-evaluation primitive** (`POST /workbook/functions/{name}`), **A7 workbook-source coverage** (cloud-hosted OneDrive/SharePoint without download), and **A8 operational** (CI-friendly, no local Excel). Initial verdict treated A1 lossiness as overall-DEAD; that was too narrow. Per-axis breakdown in [`driver-surface-leads.md`](./driver-surface-leads.md).
  - **Thread 2 (Apps Script SpreadsheetApp): PARTIAL lead — narrowed twice.** G6 added — DEAD on cell-value typing (A1), LIVE on **A4 formula representation** (R1C1 notation; REST is A1-only). A5 (triggers) was initially marked LIVE but **deprioritized 2026-05-23** per user — not a priority assay surface; runtime-event observation isn't load-bearing for current case-file scope. A6 (custom-function probe injection) dropped after re-reading the docs (custom functions are sandboxed, arguments-only, 30s timeout). **Net: A4 R1C1 notation is Apps Script's only unique LIVE axis. If R1C1 isn't load-bearing, Apps Script effectively drops out as a driver-surface candidate.**
  - **Thread 3 (OOXML metadata.xml / futureMetadata): LIVE — driver lift landed.** F26 added with complete `vm=` indirection chain + 11-code errorType-to-symbol map. **D9 implementation landed in the same session** ([`RawXmlReader.resolve_vm`](../python/excel_driver.py:415)) — new Excel ground-exposing surface.
- **All originally-identified leads now sorted into LIVE / PARTIAL / DEAD / PENDING** in [`driver-surface-leads.md`](./driver-surface-leads.md). Highest-priority PENDING leads: Office.js as a primary Excel driver path (full 15-variant CellValue), Surface B full lift (xlwings live `.api.Range.DisplayFormat`/`Value2`/`SavedAsArray`), per-engine ground audit for the 6 open-source engines (formulas/hyperformula/ironcalc/lattice/libreoffice/pycel).
- **Schema design** (canonical CellValue) is downstream of the driver-surface coalescing session; not the immediate next item. Precedents catalogued in [`schema-design-precedents.md`](./schema-design-precedents.md) remain useful prep for the schema session whenever it happens.

## Artifact map

### Audit catalogs (read these for findings)

- [`excel-driver-fidelity.md`](./excel-driver-fidelity.md) — Excel-side catalog. F1–F24 findings + D1–D9 surface disagreements + Category-3 calibration deficits + research-agent validation summary. **Catalog at bottom is hand-maintained; the rest is auto-regenerated by the probe script. If the probe is re-run, restore the catalog from git history.**
- [`gsheets-driver-fidelity.md`](./gsheets-driver-fidelity.md) — gsheets-side catalog. G1–G5 findings + D1–D6 driver gaps + research-agent validation note (Google docs are largely silent on engine semantics — the audit's empirical work is the authoritative source).

### Gap walks (the field-by-field analyses)

- [`excel-celldata-gap.md`](./excel-celldata-gap.md) — OOXML cell field walk with capture-surface analysis (Surface A: openpyxl; Surface B: xlwings live; Surface C: raw OOXML XML).
- [`gsheets-celldata-gap.md`](./gsheets-celldata-gap.md) — gsheets CellData field walk against the Google Sheets API v4.

### Raw probe data (regenerable, not for hand-editing)

- [`excel-driver-fidelity.md`](./excel-driver-fidelity.md) (top section) — generated by `scripts/probes/excel-driver-fidelity.py`. 15 scenarios × ~80 targets.
- [`gsheets-celldata-probes.md`](./gsheets-celldata-probes.md) — generated by `scripts/probes/gsheets-celldata.mjs`. Probes 1-11.

### Roadmap + planning

- [`cell-value-fidelity-roadmap.md`](./cell-value-fidelity-roadmap.md) — dependency-ordered (not time-ordered) plan covering Phase 0 (investigation, mostly complete), Phase 1 (schema design, gated on user decisions), Phase 2 (driver lifts, mostly complete), Phase 3 (case-file migration). **Out of date in some sections — see "State updates" below.**
- [`excel-sme-questions.md`](./excel-sme-questions.md) — drafted SME ping that turned out to need research agents instead (the user's Excel SMEs are competition-Excel experts, not implementation-level engineers). Kept for posterity if an implementation-level SME is found.

### Probe scripts (re-runnable)

- [`scripts/probes/excel-driver-fidelity.py`](../scripts/probes/excel-driver-fidelity.py) — Excel probe via xlwings + openpyxl + raw OOXML. 15 scenarios. `cd packages/assay && uv run python scripts/probes/excel-driver-fidelity.py`.
- [`scripts/probes/gsheets-celldata.mjs`](../scripts/probes/gsheets-celldata.mjs) — gsheets probe via Sheets API v4. `cd packages/assay && ASSAY_SPREADSHEET_ID=<id> node scripts/probes/gsheets-celldata.mjs`.
- [`scripts/verify-excel-driver-e2e.mjs`](../scripts/verify-excel-driver-e2e.mjs) — E2E driver verification, 17 cases. Run via `pnpm build && node scripts/verify-excel-driver-e2e.mjs`.

### Driver code (production)

- [`python/excel_driver.py`](../python/excel_driver.py) — Excel driver. After this session's A1/A2/A3 lift it includes:
  - `RichCell` dataclass capturing per-cell openpyxl reads (value, data_type, number_format, is_date, hyperlink, comment, rich_runs)
  - `RawCellData` dataclass for OOXML fields openpyxl drops (`cm`, `vm`, `s`, `<f t="array" ref="...">`, namespace prefixes)
  - `RawXmlReader` class for the raw OOXML pass
  - `read_sheet_result_rich(ws, raw_reader)` produces full RichCell grid; `read_sheet_result(ws, raw_reader)` is the back-compat scalar shim
  - 1904-epoch fix: `wb.epoch` threaded through `_dt_to_serial`
- [`src/drivers/gsheets.ts`](../src/drivers/gsheets.ts) — gsheets driver. After this session's B lift:
  - Switched from `values.batchGet` × 2 render modes to single `spreadsheets.get?includeGridData=true` with field mask
  - Internal `RichCell` interface + `ApiCellData` wire-format types + 18 modern error sub-variants
  - `buildRichCell` collapse with `kind` classification (number/string/boolean/error/null/spill-null/blank)
  - `errorTypeToSentinel` maps gsheets ErrorType enum to `#`-prefixed sentinels
  - Adaptive backoff: 4 attempts, exponential 1/2/4/8s + jitter (was: 1-retry-then-abort)
  - Quota observability: `getQuotaStats()` returns `{requests, throttleHits}`

## State updates (where the roadmap is out of date)

- **Lattice walk:** skipped (user direction). Roadmap reflects this.
- **Phase 0 (investigation):** substantially complete. Excel + gsheets sides both have catalogs; research-agent validation in place (now nine threads incl. Graph, Apps Script, OOXML metadata.xml).
- **Phase 1 (schema design):** not started. Gated on user decisions over the open forks (see "Schema design forks" below; one new constraint surfaced from Graph thread — see below).
- **Phase 2 (driver lifts):** **all known lifts shipped.** Excel A1+A2+A3 + gsheets B + Excel D9 (`vm` dereferencing) all landed. D9 is spec-grounded but unverified against a fixture; queued as probe C9.
- **Phase 3 (case-file migration):** not started; gated on Phase 1.
- **SME ping:** drafted but not sent. Replaced entirely by research-agent strategy, which produced authoritative findings cited to MS-XLSX, Excel JS API, VBA reference, M365 release notes, ECMA-376, Microsoft Graph reference, and Apps Script reference.
- **Subagent constraint discovered late-session:** the `general-purpose` Agent dispatched in this environment fails on no-network sandboxes for some threads (Apps Script came back blocked; Graph + OOXML succeeded — variance currently unexplained). When a research thread requires WebFetch/WebSearch against external docs, primary-agent execution is the reliable path.

## What's empirically established

Five clean two-engine divergences (Excel vs gsheets, confirmed by both probe data and research-agent verification where possible):

| Test | Excel | gsheets |
|---|---|---|
| `=ISBLANK(VLOOKUP-of-blank)` | FALSE (blank decays through formula eval) | TRUE (Null propagates) |
| `=CELL("type", IF(,,))` | `"v"` (decayed to number 0) | `"b"` (categorized as blank) |
| `=COUNTBLANK(IF(,,))` | 0 | 1 |
| `=COUNTA(IF(,,))` | 1 (formula-exists) | 0 (result-is-non-Null) |
| `=A1:A10 B11:B20` (non-overlap intersect) | `#NULL!` (classic error) | `#ERROR` (parse failure — gsheets has no space-intersect) |
| Bare `=LAMBDA(x, x+1)` | `#VALUE!` | `#N/A` with "should be followed by a call" message |

Plus key architectural findings:

**Excel-side:**
- OOXML has TWO error-encoding paths: classic 7-error set (`<c t="e"><v>#X!</v></c>`) and modern rich-value family (via `vm=` indirection into `xl/richData/`). At least 11 modern error types (`#SPILL!`, `#CALC!`, `#UNKNOWN!`, `#GETTING_DATA`, `#BUSY!`, `#BLOCKED!`, `#CONNECT!`, `#FIELD!`, `#PYTHON!`, `#EXTERNAL!`, `#TIMEOUT!`).
- 5 OOXML function-name namespaces per MS-XLSX ABNF: `_xlfn.`, `_xlfn._xlws.` (only FILTER/SORT/PY), `_xlpm.`, `_xlop.`, plus `_xludf.` (off-spec writer convention).
- `@` operator is UI-only; wire-format spelling is `_xlfn.SINGLE(...)`. `#` spill-range operator's wire spelling is `_xlfn.ANCHORARRAY(...)`. Excel auto-translates between IIE-dialect (`Range.Formula`) and AE-dialect (`Range.Formula2`) at the API boundary.
- `Range.SavedAsArray` is Excel's writer-side IIE/AE-equivalence heuristic that decides at save time whether to persist `<f t="array">`.
- Excel has NO date type — dates are `DoubleCellValue` with a `numberFormat` string (Excel format-string syntax). Pure spreadsheet serial.
- Modern error subTypes are documented in Excel JS API as string-literal enums (Spill: 7, Calc: 22, Busy: 4, Field: 4, plus Blocked/Connect/External/Python/Timeout each with their own subType pages).
- Microsoft's published 15-variant `Excel.CellValue` discriminated union is the closest existing precedent for assay's canonical schema (see schema-design precedents below).

**gsheets-side:**
- Null is a propagatable runtime value (survives formula evaluation). ISBLANK on VLOOKUP-returning-blank returns TRUE.
- Google's official docs are silent on most engine semantics we care about (Null type, ARRAYFORMULA wire format, ISBLANK on formula-returned values). The audit's empirical work is the authoritative source.
- Wire-format has at least four shapes for "blank-ish" cells: untouched-outside-region (no rowData entry), untouched-inside-region (`{}`), direct `=IF(,,)` (formulaValue without effectiveValue), spill-recipient-with-Null (no formulaValue, no effectiveValue).
- The driver SHOULD use `spreadsheets.get?includeGridData=true` (now does, after B lift). Previously used `values.batchGet` which collapsed all four blank-shapes into one `null`.

## Schema-design forks (downstream of driver-surface coalescing; reference only)

> **2026-05-23 reframe:** schema design is downstream of the driver-surface coalescing session. The forks below remain accurate as prep material for that future session, but they should be resolved against the actual ground each driver can produce, not against research-derived expectations. Logged here for continuity.

Open decisions from the roadmap, refined by the research-agent findings:

1. **Tagged union vs scalar+sidecar.** Lean: tagged.
2. **Generic structured variant vs platform-tagged extras.** Lean: platform-tagged. **Reinforced by Office.js findings:** Microsoft also platform-tags via Entity/LinkedEntity/WebImage/etc. variants rather than a generic "structured" type.
3. **Fidelity tier per-driver vs per-test.** Lean: per-driver for A+C, per-test for B.
4. **Surface B (xlwings live `.api`) strategy.** Originally: defer. Now reframed as a high-priority PENDING lead in [`driver-surface-leads.md`](./driver-surface-leads.md) — the coalescing session decides.
5. **`kind: 'blank'` vs `kind: 'null'`.** Strong precedent in audit findings — Excel blank is cell-state (decays through formulas); gsheets Null is propagatable runtime value. Both needed.
6. **Date-as-type vs Date-as-Double-plus-format.** NEW FORK from Office.js research. Excel models dates as `DoubleCellValue` with `numberFormat` string — no DATE type. gsheets exposes `effectiveFormat.numberFormat.type` as enum (DATE, TIME, etc.). Schema picks one model or carries both axes.
7. **Schema doc location:** `internal/superpowers/specs/` or `packages/assay/docs/`.
8. **Lattice constraints articulation** (deferred — user controls Lattice codebase; will fold in when ready).

## Schema-design precedents (from Excel.CellValue research; reference only)

> **2026-05-23 reframe:** these are documented patterns from existing high-fidelity typed cell-value systems. They're useful precedent for the schema session, NOT immediate inputs. The schema's actual shape is determined by what ground the drivers can produce — to be decided in the coalescing session.

Patterns from Microsoft's published Excel.CellValue type system worth considering for assay's canonical schema:

1. **Discriminator `type` string + `basicType`/`basicValue` shadow pair.** Every rich variant carries the legacy-API equivalent for cross-engine fallback. Directly applicable to assay's "what does an old reader / different engine see?" need.
2. **String-literal subType enums.** Microsoft chose strings over integers for error sub-types — stable across versions, debuggable in JSON, "Unknown" always present as forward-compat slot.
3. **`referencedValues[]` + `ReferenceCellValue` dedup.** Entity-property trees can deduplicate via index references. Cleaner than re-serializing the same value at multiple property paths.
4. **`writable` + `writableNote` per-value.** Per-value tombstone for "computed/protected, ignore writes" without a separate error type.
5. **`ValueTypeNotAvailableCellValue` as forward-compat sentinel.** Explicit "newer API has this; this version doesn't" type that still carries a `basicValue` for backward-compat fallback.
6. **Three-part identity for external services** (`LinkedEntityId { serviceId: number; entityId: string; culture: string; domainId? }`). Provider × entity × culture.
7. **`ArrayCellValue.elements: CellValue[][]` with no nesting.** Spill range encoded as ArrayCellValue at anchor + plain primitives at spilled positions; arrays don't nest.
8. **Classic-vs-modern API duality codified in code** (`Range.valueTypes` returns old narrow `RangeValueType` enum collapsing to `"richValue"`; `Range.valuesAsJson` opens up to 15-variant union). Same architecture as the OOXML wire-format split.

## Completed research threads (all three landed same session)

The three threads queued for future sessions were dispatched as a follow-up pass in the same session. See [`queued-research-threads.md`](./queued-research-threads.md) for the original prompts (now historical).

### Thread 1 — Microsoft Graph Excel REST API (CLOSED — PARTIAL LEAD per 2026-05-23 multi-axis re-eval)

**Finding (now F25 in [excel-driver-fidelity.md](./excel-driver-fidelity.md)):** Graph REST `workbookRange` exposes only the pre-2023 narrow cell-value model in BOTH v1.0 and beta. No `valuesAsJson`, no 15-variant `Excel.CellValue` discriminated union, no Entity/LinkedEntity/Array/Reference variants, no error subType breakdown. Modern errors collapse to `#SENTINEL!` strings. Linked Data Types flatten to display strings.

**Quota / throttling:** Microsoft publishes no numeric limits; only the `Retry-After` header + ~22 named second-level error codes + a single quantitative cap (~5M cells per range).

**Driver-surface verdict:** **PARTIAL** (revised 2026-05-23). DEAD on cell-value typing depth (A1) — strict subset of Office.js + xlwings/openpyxl/OOXML/D9 surfaces. But LIVE on:
- **A6 function-evaluation primitive:** `POST /workbook/functions/{name}` invokes Excel formulas without writing into cells. No other Excel surface gives us this.
- **A7 workbook-source coverage:** OneDrive / SharePoint cloud-hosted workbooks accessible without downloading.
- **A8 operational:** no local Excel install (CI-friendly); session sandboxing via `persistChanges:false`.

**Coalescing-session decision:** complement to the local-file surfaces if cloud-hosted coverage, function-probe primitive, or CI-friendliness is load-bearing.

**Adjacent use that's NOT in scope here:** if assay ever wants to test "what does a Graph-using client SEE about a workbook authored elsewhere?" — Graph as the *target* of a compat assertion — the A1 lossy projection documented above is the model. Assertion-fixture concern.

### Thread 2 — Apps Script SpreadsheetApp (CLOSED — PARTIAL LEAD per 2026-05-23 multi-axis re-eval)

**Subagent dispatch blocked on no-network sandbox.** Primary agent ran it via direct WebFetch + WebSearch.

**Finding (now G6 in [gsheets-driver-fidelity.md](./gsheets-driver-fidelity.md)):** Apps Script is as silent as the REST API on engine semantics:
- `ValueType` enum has 5 documented members (Number, Boolean, Date, String, IMAGE). **No BLANK, NULL, EMPTY, or ERROR.**
- `Range.isBlank()` documentation is one sentence with no formula-propagation detail.
- `getFormula()` returns `""` for cells with no formula; `getFormulasR1C1()` returns `null` for the same cells — undocumented wire-format inconsistency.
- `getValue()` / `getDisplayValue()` empty-cell return values: undocumented.
- ISBLANK help center contradicts our empirical finding (says ISBLANK is FALSE for cells with any content; doesn't address formula-returned-blank).

**Driver-surface verdict:** **PARTIAL** (revised 2026-05-23 and cleaned up by verifier pass 2026-05-23). DEAD on cell-value typing depth (A1) — strict subset of REST `spreadsheets.get?includeGridData=true`. LIVE only on:
- **A4 formula representation:** `getFormulasR1C1()` returns R1C1 notation. REST API is A1-only.

**Dropped/deprioritized axes:** A6 custom-function probe injection is not viable: Apps Script custom functions are sandboxed, can affect only their return range, require deterministic arguments, and time out at 30s. A5 trigger/runtime-event observation exists but was explicitly deprioritized for assay's current case-file scope.

**Coalescing-session decision:** decide whether R1C1 notation is load-bearing. If not, Apps Script drops out as a driver-surface candidate.

**Incidental finding worth retaining:** `ValueType.IMAGE` is the one piece of Google-authoritative terminology — relevant only if a future surface exposes embedded-image cells.

### Thread 3 — OOXML `metadata.xml` / `futureMetadata` blocks (CLOSED — LIVE LEAD; D9 LANDED)

**Finding (now F26 in [excel-driver-fidelity.md](./excel-driver-fidelity.md)):** complete four-hop indirection chain documented per MS-XLSX §2.2.4.4 + ECMA-376 §18.9 and corrected during C9 verification:

```
cell @vm (1-based)
  → valueMetadata/bk[vm-1]/rc(t, v)
  → metadataTypes[t].name + futureMetadata[name]/bk[v]/extLst/ext/rvb/@i
  → rdRichValue.xml: rv[i]/@s
  → rdRichValueStructure.xml: s[s_idx]
```

**Complete errorType integer → symbol map (11 codes):** 4→#NAME?, 8→#SPILL!, 9→#CONNECT!, 10→#BLOCKED!, 11→#UNKNOWN!, 12→#FIELD!, 13→#CALC!, 14→#BUSY!, 17→#BUSY! (waiting), 18→#EXTERNAL!, 19→#TIMEOUT!.

**Driver code (D9):** [`RawXmlReader.resolve_vm`](../python/excel_driver.py:415) landed in this session. Returns `{symbol, errorType, subType?, extras?}` for `_error`-typed rich values; returns `None` for Linked Data Types / web images (would need extension to `rdRichValueTypes.xml` + `richValueRels.xml`).

**Implementation status:** spec-grounded; **empirical fixture verification still queued as probe C9** — needs a saved workbook containing a real modern error (e.g. `=SEQUENCE(3,3)` triggering `#SPILL!`).

**Known unpublished gap:** the `subType` integer-to-string map is not in any normative MS source. OfficeJS exposes strings ("Collision", "EmptyArray", etc.) in TypeScript definitions but no integer mapping exists. Driver preserves `subType` as raw int for telemetry / round-trip only.

## Lower-priority threads (still unpursued)

The lower-priority threads catalogued in [`queued-research-threads.md`](./queued-research-threads.md) remain available but unpursued — none are blocking the schema work:

- **XLL C API** — legacy C-level interface; might document calc-engine primitive types
- **Open XML SDK** (.NET) — typed wrapper around MS-XLSX; sometimes fills gaps the spec page is silent on (especially overlap with thread 3's territory)
- **Power Query M language types** — orthogonal to cell values; relevant only if assay's scope expands into data-pipeline tooling
- **Excel Data Model / Power Pivot / DAX** — embedded tabular database; affects schema only if cube-reference cells need accommodating
- **XLSB binary format** — same logical model as XLSX, different encoding; no new cell-value-semantics ground
- **Excel for Web / VSTO** — likely subsets of Office.js and VBA respectively

The original [`queued-research-threads.md`](./queued-research-threads.md) doc is preserved with the full prompt-engineering content for the three closed threads; useful as a template for any future research-agent dispatch.

## Outstanding probe additions (queued)

- **C7:** COUNTBLANK / COUNTA on spilled-Null and VLOOKUP-Null on Excel side (mirror the gsheets-side data we have)
- ~~**C8**~~ **FULLY VERIFIED 2026-05-23.** Both `_xlfn.SINGLE` and `_xlfn.ANCHORARRAY` empirically observed in saved files via dedicated probes ([`verify-at-operator-persistence.py`](../scripts/probes/verify-at-operator-persistence.py), [`verify-anchor-array-persistence.py`](../scripts/probes/verify-anchor-array-persistence.py)). Bonus finding: `=A1#` at top level creates a secondary spill anchor (recorded in F12).
- ~~**C9**~~ **PASSED 2026-05-23.** Probe at [`scripts/probes/verify-d9-resolve-vm.py`](../scripts/probes/verify-d9-resolve-vm.py): `resolve_vm(1) = {symbol: "#SPILL!", errorType: 8, subType: 1, extras: {colOffset: 2, rwOffset: 2}}`. Verification cycle (required granting Terminal Automation access to Microsoft Excel on first run) surfaced and fixed two implementation bugs: (1) the OOXML agent's pseudocode skipped the `<valueMetadata>` indirection layer — real chain is 4-hop, not 3-hop; (2) Excel for Mac saves rich-value parts as lowercase filenames (`rdrichvalue.xml`) and zip lookups are case-sensitive. F26 + RawXmlReader updated. Probe is re-runnable via `cd packages/assay && uv run python scripts/probes/verify-d9-resolve-vm.py`.
- **C10:** Probe what `xlOmittedCells`, `xlStaleValue`, etc. (XlErrorChecks family) look like in saved files. Where do they persist in OOXML?
- **C11:** Probe `Range.SavedAsArray` for a formula like `=SQRT(@A1:A4)` — confirm Excel-for-Mac applies the documented strip behavior the same way as Excel-for-Windows.

## Remaining calibration deficits

(External SME or specific environment required.)

- **C3:** Linked Data Types (Stocks/Geography/Image) — needs MS account + signed-in M365 with active data service.
- **C4 [DOWNGRADED]:** Cross Mac/Windows save differences — research found the rich-value architecture is documented identical on both platforms. Other Mac/Win differences possible but no longer load-bearing.
- **C6 [RESOLVED via research]:** True pre-365 `@` semantics — per F12/F22, `@` is a UI affordance, wire format never contains it, pre-365 reads via `_xlfn.SINGLE` or `_xlfn.ANCHORARRAY` per documented compatibility behavior.

## How to use this doc

**A future agent picking up cartularium driver-fidelity work should:**

1. Read this doc top-to-bottom for the lay of the land.
2. **Read [`driver-surface-leads.md`](./driver-surface-leads.md) next** — it's the audit-as-search-for-ground inventory that frames what the coalescing session will work from. LIVE / DEAD / PENDING per engine + per surface.
3. Read the catalogs ([excel-driver-fidelity.md](./excel-driver-fidelity.md), [gsheets-driver-fidelity.md](./gsheets-driver-fidelity.md)) for finding-level detail. F25, F26 (Excel) and G6 (gsheets) are the most recent additions from the queued-thread closure.
4. Check the roadmap ([cell-value-fidelity-roadmap.md](./cell-value-fidelity-roadmap.md)) for dependency ordering, but apply the "State updates" section above to know what's actually done.
5. **The next major work item is the driver-surface coalescing session** — combine LIVE leads (per [`driver-surface-leads.md`](./driver-surface-leads.md)) into comprehensive high-fidelity per-engine drivers. Schema design is downstream of that session; defer it until the ground reachable per engine is known.
6. **Probe C9 (D9 fixture verification) is closed.** Re-run [`scripts/probes/verify-d9-resolve-vm.py`](../scripts/probes/verify-d9-resolve-vm.py) only if changing `RawXmlReader.resolve_vm()` or the rich-value parser. The current verified fixture is a Mac-authored `#SPILL!`; additional modern-error codes remain useful future probes.
7. **If picking up a specific PENDING lead:** the leads inventory annotates each with likely-payoff and effort estimates. High-priority PENDING leads as of 2026-05-23: Office.js as a primary Excel driver path; Surface B full lift; per-engine ground audit for the 6 open-source engines currently in the assay catalogue.
8. **All originally-queued research threads have closed** ([F25](./excel-driver-fidelity.md), [F26](./excel-driver-fidelity.md), [G6](./gsheets-driver-fidelity.md)). The lower-priority threads in [`queued-research-threads.md`](./queued-research-threads.md) (XLL C API, Open XML SDK, Power Query M, etc.) are catalogued in the leads inventory under their respective engine sections.

## Session metadata

- **Date:** 2026-05-22
- **Driver-rework verification:** 17/17 E2E cases passed; all 85 existing assay tests pass (covers A1+A2+A3+B). D9 fixture verification passed 2026-05-23 via C9 on a Mac-authored `#SPILL!` fixture.
- **Research threads dispatched:** 9 total — 5 first-wave (core questions); 2 second-wave (VBA + Office.js coverage); 3 third-wave queued-thread closure (Graph, Apps Script, OOXML metadata.xml). Of the third wave, 2 were subagent-dispatched and 1 (Apps Script) was primary-agent-executed after the subagent came back blocked on no-network sandbox.
- **Empirical probes:** 15 Excel scenarios × ~80 targets; gsheets probes 1-11
- **Key change of approach mid-session:** moved from human-SME ping to research-agent strategy after recognizing the SME-audience mismatch. Late-session: discovered subagent dispatch variability on no-network sandboxes; primary-agent direct WebFetch is the reliable fallback.
- **User constraint observed throughout:** schema design is gated on user fork decisions; Lattice is deferred (user controls that codebase); roadmap is dependency-ordered, not time-ordered
