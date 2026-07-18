# gsheets driver fidelity audit

Companion to [`excel-driver-fidelity.md`](./excel-driver-fidelity.md). Catalogs where the current gsheets driver loses or normalizes information that the gsheets API actually carries, plus the engine-level findings from the extended probes (Probes 9, 10, 11 of [`gsheets-celldata-probes.md`](./gsheets-celldata-probes.md)).

**Entry-point doc for the 2026-05-22 audit session:** [`audit-session-2026-05-22.md`](./audit-session-2026-05-22.md) — comprehensive index of all artifacts + state + queued work.

**Note:** the probe script regenerates `gsheets-celldata-probes.md` from scratch on each run. The catalog here is hand-maintained on top of that raw data. If the probe is re-run, this file is unaffected.

## Research-agent verification (2026-05-22)

A research agent searched the official Google Workspace docs for the engine behaviors this catalog identifies. **Striking result: Google documents almost none of it.**

Comprehensively searched: ARRAYFORMULA help, "Using arrays in Google Sheets," ISBLANK, COUNTA, COUNTBLANK, IF, VLOOKUP, the v4 CellData reference, ExtendedValue / ErrorValue / ErrorType schemas, the troubleshooting guide, and the v4 discovery document.

**Google's official sources are silent on:**
- A runtime-Null distinct from cell-state blank
- ARRAYFORMULA anchor/recipient wire format (despite explicitly documenting the same convention for PivotTable and DataSourceTable)
- Spill recipients with Null vs empty string at the wire level
- ISBLANK / COUNTBLANK / COUNTA behavior on formula-returned blank values
- The fact that `IF(value_if_false omitted)` returns the propagatable-Null

**Direct contradiction with a help page:** the [ISBLANK help page](https://support.google.com/docs/answer/3093290) literally says *"ISBLANK returns FALSE if the referenced cell has any content, including spaces, the empty string ('')…"* — directly conflicts with our empirical `ISBLANK(VLOOKUP-returning-blank) = TRUE`. The doc only describes cell-state, not formula-returned values.

**One revised finding:** the v4 discovery doc lists `NULL_VALUE` in `ErrorValue.type` enum identically to other errors (`"Corresponds to the #NULL! error."`) — there is **no normative text** saying `NULL_VALUE` is Excel-import-only or never emitted natively. Our earlier characterization that it's "Excel-compat only on gsheets side" was empirical (never observed) but unsourced. **Status updated: empirically not observed, but the claim of "Excel-compat only" is not in Google docs and should be removed.**

**What this validates:** the audit's empirical-probe work was necessary. Folk theories aren't reliable, but **Google's own documentation isn't either** — it covers the cell-state case and goes silent on the calc-engine-runtime case. The behavior we found is real but lives outside the documented surface.

**Schema implication:** the polymorphic runtime-Null we identified is **assay's terminology, by necessity**. Google hasn't named it. **Precedent argument:** the PivotTable / DataSourceTable doc convention (anchor cell carries structure; recipients carry computed values in `effectiveValue`) is the Google-acknowledged pattern; we cite this as analogue when justifying the schema's ARRAYFORMULA anchor/recipient model.

**Post-session Apps Script follow-up (2026-05-22):** an additional research pass against the Apps Script `SpreadsheetApp` API (the queued thread doc's "most promising gsheets-side thread") confirmed and reinforced the verification above — Apps Script is as silent as the REST API on engine semantics. See [G6](#g6-new--apps-script-research-follow-up-2026-05-22-post-session-dispatch-apps-script-spreadsheetapp-surface-confirms-google-has-no-documented-terminology-for-the-polymorphic-runtime-null) below for the detailed findings (ValueType enum members, isBlank documentation, getFormula/getFormulasR1C1 wire-format inconsistency).

## Probe additions covered

- **Probe 9** — Spill-recipient with Null result. Tests whether the "three-shape Null" question (untouched / direct-IF(,,) / spilled-Null) is observable structurally.
- **Probe 10** — VLOOKUP returning a blank cell. Tests whether Null propagates through formula evaluation in gsheets, the parallel of Excel's F3 (blank decays through VLOOKUP on Excel side).

## Category 1 — gsheets-as-engine behavior

### G1. Null is a propagatable runtime value in gsheets.

`=VLOOKUP(2, D1:E3, 2, FALSE)` where E2 is the blank lookup target produces a cell with `userEnteredValue.formulaValue` set but **no `effectiveValue` and no `formattedValue`** — identical wire-format shape to a direct `=IF(,,)` cell. ISBLANK on the VLOOKUP result returns TRUE. The Null survives the formula evaluation.

**Contrast with Excel** (per excel-driver-fidelity F3): Excel decays blank to numeric 0 the moment a formula reads it. ISBLANK on the same construct returns FALSE.

This is a real two-engine divergence axis:

| Probe | gsheets | Excel |
|---|---|---|
| `=ISBLANK(VLOOKUP-returning-blank)` | **TRUE** | FALSE |
| `="x" & VLOOKUP-returning-blank` | `"x"` | `"x0"` |
| `=CELL("type", VLOOKUP-returning-blank)` | (would be "v" — Null is a value) | `"v"` |

### G2. Spilled-Null and direct-Null are semantically interchangeable.

Probe 9.l confirmed `=B3 = A4` returns TRUE (where B3 is a spill recipient with IF(,,) at that array position, and A4 is a direct `=IF(,,)`). Both have ISBLANK TRUE, ISTEXT FALSE, TYPE 1, coerce to `""`/0 polymorphically.

**Implication:** there is one Null in gsheets, with multiple authoring paths to produce it. The provenance (direct formula vs spill recipient) is visible at the wire-format level (whether `userEnteredValue` is set), but not in any runtime behavior.

### G3. Polymorphic equality matches Excel's blank.

`=Null = 0` → TRUE. `=Null = ""` → TRUE. `=Null = FALSE` → not probed yet, but expected TRUE.

**This part aligns with Excel** — both engines treat the blank/Null value as polymorphically-equal to its coercion-counterparts. The divergence is in *propagation*, not in *equality*.

### G4. TYPE() does not distinguish Null from number 0.

`=TYPE(B3)` (spill-Null) = 1. `=TYPE(A40)` (VLOOKUP-Null) = 1. Same as Excel — TYPE coerces to numeric for any number-context-coercible value.

This means **TYPE() is not a reliable way to identify Null** — ISBLANK is the only function that does the structural-distinction check. CELL("type") presumably returns "v" for Null cells too (haven't probed directly but would expect from G3).

### G4a. CELL("type") categorizes Null as "b" (blank) — including VLOOKUP results.

Probe 11 results (gsheets side):

| Target | `CELL("type", ...)` | Notes |
|---|---|---|
| Untouched (A2) | `"b"` | matches Excel |
| Direct `=IF(,,)` (A4) | `"b"` | **Excel returns `"v"` (value)** — gsheets categorizes Null as blank, Excel categorizes decayed-0 as value |
| Spilled-Null (B3) | `"b"` | consistent with direct-Null |
| VLOOKUP-of-blank (A40) | `"b"` | **single-probe confirmation that Null propagates through VLOOKUP** |

This is the single cleanest engine-introspection probe for the propagation question.

### G4b. COUNTBLANK and COUNTA diverge from Excel in ways that follow the Null-vs-decay model.

| Target | gsheets COUNTBLANK | Excel COUNTBLANK | gsheets COUNTA | Excel COUNTA |
|---|---|---|---|---|
| Untouched | 1 | 1 | 0 | 0 |
| `=""` | 1 | 1 | 1 | 1 |
| `=IF(,,)` | **1** | **0** | **0** | **1** |
| Spilled-Null | 1 | (untested) | (untested) | (untested) |
| VLOOKUP-of-blank | 1 | (untested) | (untested) | (untested) |

**Two clean divergences for `=IF(,,)`:**

- **COUNTBLANK:** gsheets counts Null cells; Excel doesn't (because the cell is number 0).
- **COUNTA:** gsheets counts by *result-is-non-Null*; Excel counts by *formula-exists*. Same input, different definitions of "is there content."

Both align with the Null-propagation vs cell-state-decay model.

### G4c. N() and T() match Excel — Null coerces to 0 / "" respectively.

`=N(IF(,,))` = 0, `=T(IF(,,))` shows no effectiveValue (encoded as missing-effectiveValue = empty string). Matches Excel behavior for blank.

### G4d. ISNUMBER / ISLOGICAL / ISERROR / ISTEXT all FALSE on Null.

Null is "none of the typed categories" in gsheets, same as Excel's blank. Plus polymorphic equality with FALSE: `=IF(,,) = FALSE` → TRUE — also matches Excel blank.

### G5. The wire format has at least four shapes for "blank-ish" cells.

Confirmed via Probes 2, 9, and 10:

| Shape | Example | userEnteredValue | effectiveValue | ISBLANK |
|---|---|---|---|---|
| Untouched, outside populated region | A2 in probe 2.a | absent | absent | TRUE |
| Untouched, inside populated region | E2 in probe 10.a | absent | absent | TRUE |
| Direct `=IF(,,)` | A4 | `formulaValue: "=IF(,,)"` | absent | TRUE |
| Spill recipient with Null result | B3 | absent (only anchor has it) | absent | TRUE |
| VLOOKUP-returning-blank | A40 | `formulaValue: "=VLOOKUP(...)"` | absent | TRUE |

**Structurally distinguishable** via presence/absence of `userEnteredValue` and whether the cell is inside the populated region. **Semantically identical** for all calc-engine purposes (ISBLANK, ISTEXT, TYPE, coercion, equality).

Sub-finding: the "rowData entry shape" for untouched cells differs depending on the read range. In probe 2.a (single-column read), untouched A2 came back as **`null`** (no rowData entry at all). In probe 10.a (multi-column read where neighboring cells are populated), untouched E2 came back as **`{}`** (empty CellData object). Likely a sparse-representation choice by the API — when an untouched cell is sandwiched between populated cells, the API includes an empty entry; when it's in a fully-empty row, it's omitted entirely. Minor wire-format quirk worth noting but not load-bearing.

### G6 [NEW — Apps Script research follow-up, 2026-05-22 post-session dispatch; DRIVER-SURFACE VERDICT: PARTIAL — DEAD on A1 cell-value typing, LIVE only on A4 after the 2026-05-23 multi-axis re-eval cleanup]. Apps Script SpreadsheetApp confirms Google has no documented terminology for the polymorphic runtime-Null and adds one currently-unique surface beyond REST: R1C1 formula notation.

> **Lead status:** PARTIAL — narrowed twice in 2026-05-23 session. Original DEAD verdict was scoped to cell-value typing depth (A1). Multi-axis re-evaluation surfaced one Apps-Script-unique LIVE axis that REST does not provide:
> - **A4 formula representation:** `getFormulasR1C1()` exposes R1C1 notation. REST is A1-only.
>
> **A5 (runtime-event observation via triggers) DEPRIORITIZED** per user direction — not a priority surface for assay's case-file scope. Triggers exist and REST polling can't observe them, but they require edit access + trigger-code injection + a Playwright-driven harness to fire, and runtime-event assertions aren't load-bearing for current scope. Reopen if scope expands.
>
> **A6 (custom functions as engine-probe primitive) DROPPED** after re-reading the docs. Custom functions are sandboxed (arguments-only visibility per [developers.google.com/apps-script/guides/sheets/functions](https://developers.google.com/apps-script/guides/sheets/functions): *"A custom function can't affect cells other than those it returns a value to"*), have a 30-second timeout, and can't accept volatile functions like NOW/RAND as arguments. Execution location undocumented. Not viable as a probe-injection surface.
>
> **Net: Apps Script's only unique LIVE axis is A4 (R1C1 notation).** If R1C1 isn't load-bearing, Apps Script drops out entirely as a driver-surface candidate. See [`driver-surface-leads.md`](./driver-surface-leads.md) for the full per-axis breakdown.

Sourced from direct WebFetch + WebSearch against the Apps Script reference (the queued research-agent dispatch returned blocked on a no-network sandbox; primary agent performed the research instead). Findings reinforce the top-of-doc research-agent verification — Apps Script is as silent as the REST API on engine semantics.

**The `ValueType` enum has 5 documented members:** `Number`, `Boolean`, `Date`, `String`, `IMAGE` ([Enum ValueType](https://developers.google.com/apps-script/reference/spreadsheet/value-type)). **No `BLANK`, `NULL`, `EMPTY`, or `ERROR` is publicly documented.** A `Range.getValueType()` call on a cell containing `=IF(,,)` therefore has no documented answer — Apps Script doesn't name the polymorphic-Null state at the type-enum level.

**`Range.isBlank()` documentation: a single sentence.** *"Returns `true` if the range is totally blank."* ([Range reference](https://developers.google.com/apps-script/reference/spreadsheet/range#isblank)). No distinction between cell-state-blank and formula-returning-Null is documented. Apps Script inherits the same documentation gap as the REST API; the empirical `ISBLANK(VLOOKUP-of-blank) = TRUE` finding lives entirely outside Apps Script's documented surface too.

**Wire-format inconsistency across Apps Script methods (worth recording for future driver work):**
- `Range.getFormula()` / `getFormulas()` — returns `""` (empty string) for cells with no formula.
- `Range.getFormulasR1C1()` — returns `null` for cells with no formula.

Same underlying cell-state, two different sentinels across sibling methods. Google does not document why or what semantic distinction the inconsistency carries.

**`getValue()` / `getValues()` / `getDisplayValue()` / `getDisplayValues()` empty-cell behavior: undocumented.** Apps Script reference describes what these methods return at a high level ("the value of the top-left cell", "rectangular grid of values", "displayed value") but never specifies what gets returned for an untouched cell, a cell containing `""`, or a cell containing `=IF(,,)`. This was the most promising thread for surfacing the polymorphic-Null at the API level; it didn't.

**ISBLANK help-center page contradicts our empirical finding (already noted at the top of this doc).** Quoted: *"ISBLANK returns FALSE if the referenced cell has any content, including spaces, the empty string ('')..."* ([Help Center](https://support.google.com/docs/answer/3093290)). This is the cell-state definition; it doesn't cover formula-returned-blank. The audit's empirical `ISBLANK(VLOOKUP-of-blank) = TRUE` lives outside this documented scope.

**Conclusion (reinforces top-of-doc verification):** the Apps Script research adds no Google-authoritative terminology for the polymorphic-Null, and no cell-value-typing ground beyond the REST surface already accessed by driver lift B. The audit's terminology stands; Google has not named the concept anywhere across REST docs, Apps Script docs, or help center.

**Driver-surface verdict:** Apps Script is a **PARTIAL** lead, narrowed to A4 only. It is DEAD for A1 cell-value typing and should not drive schema decisions. Its only unique LIVE axis is R1C1 formula notation via `Range.getFormulasR1C1()`. A5 triggers are deprioritized for current assay scope; A6 custom functions were dropped after source review because they cannot edit arbitrary cells, are argument/return-range constrained, and have a 30s timeout.

**One incidental finding worth retaining:** Apps Script's `ValueType.IMAGE` is the one piece of Google-authoritative terminology this thread surfaced. Relevant only if a future driver surface exposes embedded-image cells — note for the leads inventory, not load-bearing here.

**Sources:**

- [Range reference](https://developers.google.com/apps-script/reference/spreadsheet/range)
- [SpreadsheetApp reference](https://developers.google.com/apps-script/reference/spreadsheet/spreadsheet-app)
- [Enum ValueType](https://developers.google.com/apps-script/reference/spreadsheet/value-type)
- [ISBLANK help](https://support.google.com/docs/answer/3093290)

### G7 [NEW 2026-05-23, after user flagged the conflation]. Sheets Named Functions are a distinct engine feature with NO programmatic surface — neither REST nor Apps Script.

**Two different features that are easy to conflate, and the audit briefly did:**

| Feature | Where defined | Code language | Accessible from Apps Script? | Tested by assay today? |
|---|---|---|---|---|
| **Apps Script custom function** | Apps Script editor (Extensions → Apps Script) | JavaScript / V8 | Yes (it IS Apps Script code) | No, and not viable as engine probe per G6 |
| **Sheets Named Function** | Sheets UI (Data → Named functions) | Spreadsheet formula syntax | **No** | **No, and no programmatic surface exists to test it** |

**Named Functions are reusable formulas defined in the Sheets UI** — users write a formula like `=IF(x>0, x*RATE, 0)` with named parameters and assign a name like `APPLY_RATE`. Once defined, they're callable from any cell formula in the workbook: `=APPLY_RATE(A1)`. Stored with the workbook; can be imported across workbooks.

**No programmatic surface as of 2026-05-23.** Verified:

- **REST v4 API:** the [Spreadsheet resource](https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets) has a `namedRanges` field (named cell ranges, not formulas) but **no** `namedFunctions`, `userDefinedFunction`, or equivalent. The page does not mention the Data → Named functions feature at all.
- **Apps Script:** confirmed by the user (gsheets SME) — Named Functions are not accessible from Apps Script. The G6 research already established that Apps Script custom functions are a separate concept entirely; Named Functions are formula-language, not JavaScript.

**Implication for assay + formulary (sibling project):**
- Formulary will need to test Named Functions for compat coverage. The current gsheets driver cannot capture them.
- No documented workaround exists. Possible paths: Google adds them to the API (out of our control), or a UI-driven testing harness (e.g., Playwright against the Sheets UI), or an unofficial endpoint if one surfaces.
- **For the leads inventory:** Named Functions are a "no-surface" gap — distinct from PENDING (worth investigating) or DEAD (investigated and irrelevant). Logged as such.

**Excel parity note:** Excel's analogous feature is name-managed LAMBDA — user defines a LAMBDA expression in Name Manager and references it from formulas. This DOES persist in the .xlsx file (in `<definedName>` elements at workbook level) and IS readable via openpyxl + raw XML. So Excel exposes this surface while gsheets does not — relevant axis if the schema needs to model user-defined functions cross-engine.

**Sources:**
- [Sheets v4 Spreadsheet resource](https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets)
- [Apps Script custom functions](https://developers.google.com/apps-script/guides/sheets/functions) (confirms Apps Script custom functions are a separate feature, sandboxed)
- User confirmation 2026-05-23 (gsheets SME)

---

## Category 2 — Driver-fidelity gaps

### D1. The current driver collapses all "blank-ish" shapes into a single null output.

Historical note: before driver lift B, [`packages/assay/src/drivers/gsheets.ts`](../src/drivers/gsheets.ts) used `spreadsheets.values.batchGet`, which returned only collapsed values. The current driver uses `spreadsheets.get?includeGridData=true`, but public scalar output still collapses the blank-ish shapes below unless a future schema/coalescing pass exposes the internal `RichCell` records.

- Untouched: `null` (no value)
- Direct `=IF(,,)` Null: `null` (effectiveValue absent → returned as null)
- Spilled-Null: `null` (same)
- VLOOKUP-of-blank: `null` (same)

**Four wire-format shapes collapse into one driver output.** Structural distinction (which is real, per G5) is destroyed.

Recovery requires switching to `spreadsheets.get?includeGridData=true` with a field mask that includes `userEnteredValue` — already an existing recommendation in [`gsheets-celldata-gap.md`](./gsheets-celldata-gap.md). The fidelity benefit is now concretely articulable.

### D2. The driver cannot distinguish "blank cell" from "Null runtime value" because it never sees the file-level state.

For a cell with formula `=IF(,,)`:
- gsheets engine: stores cell with userEnteredValue (the formula) and emits Null on read
- Legacy scalar driver: got `null` from values.batchGet, with no formula provenance

For an untouched cell:
- gsheets engine: no rowData entry (or empty CellData)
- Legacy scalar driver: got `null` from values.batchGet, same shape as above

**The schema needs to be aware that the gsheets driver collapses this distinction at the current read path.** Even after switching to `spreadsheets.get`, the schema's representation of "blank" needs to either preserve the distinction or accept its loss.

### D3. `userEnteredValue` is not currently read, so original formula text is lost.

For cells the test case authored as formulas, the driver loses the formula round-trip. This is fine for "what did the engine compute?" assertions but limits the auditor's ability to verify "did Excel/gsheets parse our formula as we intended?" (the gsheets gap doc's question about field #1).

Recoverable via the API switch (same as D1/D2).

### D4. Error messages are dropped.

The current driver's `toError` ([`gsheets.ts:265`](../src/drivers/gsheets.ts:265)) does string-prefix sniffing on `formattedValue` to derive an error code, and constructs `{error: code}`. The actual `errorValue.message` is dropped. **Same shape as Excel's lack of message at the file level** — but on gsheets the API has the message; the driver just doesn't read it.

Recovery: switch to fields that include `effectiveValue.errorValue.{type,message}`.

### D5. `effectiveFormat.numberFormat.type` is not read, so inferred-type signal is lost.

The gsheets walk identified this as load-bearing for "is this cell semantically a date?" The current driver doesn't read effectiveFormat at all.

Recovery: add `effectiveFormat.numberFormat` to the field mask.

### D6. `textFormatRuns` is not read, so per-substring formatting and links are lost.

The gsheets walk identified this as canonical encoding for hyperlinks (the HYPERLINK silent-pass case the schema is meant to surface). The current driver doesn't see it.

Recovery: add `textFormatRuns` to the field mask.

---

## Category 3 — Cross-engine divergence axes confirmed

These are concrete assertions a case-file could make and observe different answers on the two engines.

| Test case formula | gsheets result | Excel result | Schema axis |
|---|---|---|---|
| `=ISBLANK(VLOOKUP-of-blank)` | TRUE | FALSE | Null propagation through formula eval |
| `="x" & VLOOKUP-of-blank` | `"x"` | `"x0"` | Null propagation through concat |
| `=ISBLANK(IF(,,))` | TRUE | FALSE | Null vs decay-to-0 |
| `=CELL("type", IF(,,))` | `"b"` | `"v"` | Engine-introspection: Null IS blank-typed; decayed 0 is value-typed |
| `=COUNTBLANK(IF(,,))` | 1 | 0 | COUNTBLANK counts Null on gsheets; treats 0 as not-blank on Excel |
| `=COUNTA(IF(,,))` | 0 | 1 | COUNTA: result-is-non-Null (gsheets) vs formula-exists (Excel) |
| `=A1:A10 B11:B20` (non-overlap intersect) | `#ERROR` (parse fail) | `#NULL!` | Intersect operator existence |
| Bare `=LAMBDA(x, x+1)` | `#N/A` (with "should be followed by a call" message) | `#VALUE!` | Cell-boundary LAMBDA error code |
| `=DATE(2023,3,19)` numFmt-type | auto-applied DATE | auto-applied DATE | **Aligned**, not a divergence |
| `=A1 = 0` and `=A1 = ""` on blank/Null A1 | both TRUE | both TRUE | **Aligned** — polymorphic equality |

The audit's most surprising finding: many of the "Excel-is-different" first-pass findings dissolved once the driver-write path was corrected (xlwings.formula2 vs openpyxl). The remaining divergences (top 5 in the table) are real engine-level differences, not driver artifacts.

---

## Category 4 — Calibration deficits remaining (gsheets side)

After Probe 11, this section is mostly resolved.

- ~~**C-G1.** `=CELL("type", IF(,,))`~~ → **resolved (Probe 11.b)**: returns `"b"` (blank). Different from Excel `"v"`. Documented in G4a.
- ~~**C-G2.** `=N(IF(,,))` and `=T(IF(,,))`~~ → **resolved (Probes 11.e, 11.f)**: N=0, T=""; matches Excel. Documented in G4c.
- ~~**C-G3.** COUNTBLANK behavior~~ → **resolved (Probes 11.g-k)**: gsheets COUNTBLANK counts Null cells (1 for IF(,,)); Excel doesn't (0). Real divergence. Documented in G4b.
- ~~**C-G4.** ISNUMBER / ISLOGICAL / ISERROR on Null~~ → **resolved (Probes 11.o-q)**: all FALSE. Matches Excel. Documented in G4d.

Remaining open:
- COUNTA / COUNTBLANK on spilled-Null and VLOOKUP-Null are confirmed on gsheets side (G4b table); Excel side hasn't been symmetrically probed for those specific cases. Quick to add to the Excel probe if it becomes important.

---

## What this enables

Same shape as the Excel-side finding: the schema needs distinct variants for Excel's `blank` (cell-state) and gsheets' `null` (propagatable runtime value). The two-engine divergence is in *propagation through formula eval*, not in *equality semantics for the direct cell*.

Both drivers need parallel reworks:
- **gsheets:** `spreadsheets.get?includeGridData` lift landed; remaining work is the coalescing/schema decision to expose `userEnteredValue`, effective/format fields, text runs, and error messages beyond the public scalar collapse
- **Excel:** switch from `iter_rows(values_only=True)` to per-cell openpyxl reads + raw OOXML XML pass for fields openpyxl doesn't model

Driver-rework is a Phase 2 lift item ([`cell-value-fidelity-roadmap.md`](./cell-value-fidelity-roadmap.md)). The audit produced enough data to scope it.
