# gsheets CellData gap analysis

Research artifact, not a plan. Walks Google's published `CellData` type field-by-field, originally marking what the assay gsheets driver captured before the 2026-05-22 lift. Current state: driver lift B switched the read path to `spreadsheets.get?includeGridData=true`; this doc is retained as the gap analysis that motivated that lift.

## Why this exists

Assay's current cell-value schema is `CellValue = number | string | boolean | CellError | null` ([`format/types.ts:13`](../src/format/types.ts)). That is the *intersection* of what most engines comfortably express. The intersection bias produces silent passes: when a platform represents something the assay model can't carry, the driver strips it, and divergences disappear.

The concrete example: `=HYPERLINK("https://x", "click")` in gsheets produces a cell with `effectiveValue.stringValue = "click"` *and* a separate cell-level `hyperlink` field equal to `"https://x"`. Lattice's `HYPERLINK()` is a no-op that returns just `"click"`. Today both drivers produce `"click"`, the assay matcher passes, and a real cross-platform divergence is hidden.

To make the schema a superset rather than an intersection, we need to know what each platform's data model contains. gsheets is the only one of the three primary targets (gsheets, Excel, Lattice) with a public spec, so it sets the template.

## Source of truth

- Google Sheets API v4 [`CellData`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/cells) reference.
- [`ExtendedValue`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/other#ExtendedValue) / `ErrorValue` / `ErrorType`.
- [`CellFormat`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/cells#CellFormat) and its nested types.
- sheets.wiki's [`Data type`](../../sheets-wiki/content/concept/Data%20type.md) article — cross-checks the user-facing type model.

## What the driver captured before lift B

Before lift B, [`packages/assay/src/drivers/gsheets.ts`](../src/drivers/gsheets.ts) used the **values** API (`spreadsheets.values.batchGet`), not the **full CellData** API. It captured two of the three documented cell-value layers:

| Layer | API field | Render option used | Captured? |
|---|---|---|---|
| userEnteredValue | `ExtendedValue` (one of: numberValue, stringValue, boolValue, formulaValue) | not requested | no — we own the input |
| effectiveValue | `ExtendedValue` | `UNFORMATTED_VALUE` | yes |
| formattedValue | `string` (display string after format) | `FORMATTED_VALUE` | yes |

Everything outside those three layers was invisible to that pipeline.

## API surface change now landed

To capture richer CellData, the driver switched from the values endpoint to:

```
spreadsheets.get?includeGridData=true&ranges=<range>&fields=<mask>
```

with a `fields` mask scoping which CellData sub-fields to return (e.g. `sheets.data.rowData.values(effectiveValue,formattedValue,hyperlink,note,textFormatRuns,effectiveFormat.numberFormat)`).

Implications that still matter for coalescing/performance work:

- **Different quota class.** Values reads and full-cell reads bill against different per-minute/per-user quotas. Batching strategy needs re-thinking.
- **Larger payload.** A 20×20 spill window with rich fields can be 50–100× the byte volume of `values.batchGet`. Worth measuring before committing to whole-window capture.
- **Field-mask selection becomes a knob.** We don't have to ask for everything every time — but the mask itself becomes a per-test parameter (or a fidelity-tier).
- **Two-render-mode merging goes away.** Today's `mergeResults(unformatted, formatted)` in [`gsheets.ts:273`](../src/drivers/gsheets.ts) reconciles two separate API calls. With `spreadsheets.get`, `effectiveValue` and `formattedValue` come back in the same response.

### Quota / profiling follow-up

The API switch has landed, with adaptive retry and write-throttling in the driver. Two follow-up pieces remain useful before raising throughput:

1. **Profile current usage.** Measure per-chunk request counts, payload sizes, and observed 429 frequency on the current `spreadsheets.get` path.
2. **Tune quota-aware backoff.** The driver now has adaptive backoff hooks; quota profiling should decide whether the current envelope is sufficient or whether a stronger token bucket is needed.

Direct line to the Sheets team exists — but raising the quota envelope productively needs measured numbers (request rate, payload size, error distribution), not just "we're hitting limits." The profiling work feeds that conversation as much as it feeds the driver change.

## Type-system gap: ExtendedValue vs assay `CellValue`

The API documents five `ExtendedValue` variants:

| ExtendedValue variant | Type | Current `CellValue` | Captured? |
|---|---|---|---|
| `numberValue` | `number` (doubles; dates as serial numbers) | `number` | yes |
| `stringValue` | `string` (leading single quote stripped) | `string` | yes |
| `boolValue` | `boolean` | `boolean` | yes |
| `formulaValue` | `string` (only on `userEnteredValue`, never `effectiveValue`) | not applicable | n/a — input-side |
| `errorValue` | `{type: ErrorType, message: string}` | `{error: string}` | partial — we keep the code, drop the message |

`ErrorType` enum: `ERROR, NULL_VALUE, DIVIDE_BY_ZERO, VALUE, REF, NAME, NUM, N_A, LOADING`. The current driver converts these via string-prefix sniffing (`toError` in [`gsheets.ts:265`](../src/drivers/gsheets.ts:265)) — it works for the common cases but throws away `message` and treats `LOADING` (transient async-recalc state) as a string-prefix match rather than a typed signal.

### Platform-level types that don't appear in ExtendedValue

The sheets.wiki [`Data type`](../../sheets-wiki/content/concept/Data%20type.md) article documents two scalar types that the user-facing Sheets model recognizes but the published API surface does **not** expose as `ExtendedValue` variants. They behave very differently at the cell boundary — empirically confirmed via the [probe results](./gsheets-celldata-probes.md):

- **Lambda — runtime-only on gsheets, valid cell value on Lattice.** In gsheets, lambdas exist only during expression evaluation; at the cell boundary they degrade to an error. Probe 1 confirms: `=LAMBDA(x, x+1)` directly in a cell produces `errorValue.type = "N_A"` with message `"Function LAMBDA should be followed by a call containing the actual values."`. So the gsheets-side mapping is trivial: it surfaces through the existing `errorValue` channel as `N_A` (somewhat surprising — not `VALUE` or `ERROR`). **Lattice, however, supports Lambda as a real cell-value type** — the assay-canonical schema does need to carry a Lambda variant for cross-platform fidelity even though the gsheets driver will never emit one. This is exactly the superset-vs-intersection situation.

- **Null — real cell-value type, with surprising API encoding.** Per sheets.wiki's [`Null`](../../sheets-wiki/content/concept/Null.md) article, Null is the type of blank cells *and* a runtime value that can be produced by empty argument positions. Probe 2 confirms this is real (`=ISBLANK(IF(,,))` returns `true`), but reveals an important API-surface limitation: **`=""` and `=IF(,,)` both return CellData with no `effectiveValue` field at all** — the API does not surface the distinction at the cell level. An untouched cell returns no `rowData.values[i]` entry. So at the wire-format level the API gives us three observably-equivalent shapes (untouched / `=""` / `=IF(,,)`), even though sheets.wiki documents these as semantically distinct. The schema can carry Null as a first-class variant for Lattice's sake, but the gsheets driver cannot distinguish Null from empty-string-formula-result purely from `spreadsheets.get` — distinguishing them requires evaluating `ISBLANK` on the cell as a secondary probe.

Both gaps are in the platform's *API surface*, not necessarily the platform's behavior. Sheets clearly has these types internally; the REST API just doesn't enumerate them as `ExtendedValue` cases — and in the Null case, actively conflates them with empty-string-results.

## CellData field walk

13 fields, top-down from the API spec. **Relevance** classifications:

- **drives-divergence** — has produced or is likely to produce real cross-platform divergence claims.
- **cosmetic** — purely visual; no formula-result implication.
- **anchor-only** — the cell is a marker for a larger structure; the structure itself, not this cell, is what diverges.
- **n/a-cross-platform** — only meaningful on gsheets; no analogue on Excel/Lattice/others.
- **unverified** — needs empirical probe before classification.

| # | Field | Type | Captured today? | API path | Relevance | Notes / divergence shape |
|---|---|---|---|---|---|---|
| 1 | `userEnteredValue` | ExtendedValue | n/a (we own input) | `…values(userEnteredValue)` | n/a | We supply formulas via `valueInputOption=USER_ENTERED`. Capturing back would let us verify Sheets parsed our input as we intended (especially when `'` quoting or locale changes the interpretation). |
| 2 | `effectiveValue` | ExtendedValue | yes (via UNFORMATTED_VALUE) | `…values(effectiveValue)` | drives-divergence | The numeric/typed result. Already captured; the `errorValue.message` is dropped on conversion. |
| 3 | `formattedValue` | string | yes (via FORMATTED_VALUE) | `…values(formattedValue)` | drives-divergence | Display string. Already captured. Note: `mergeResults` currently prefers `effectiveValue` when both are present, which means the displayed-text axis is implicit. |
| 4 | `userEnteredFormat` | CellFormat | no | `…values(userEnteredFormat)` | partial — see CellFormat walk | Format the user explicitly set. Distinct from `effectiveFormat`, which includes conditional-format overlays. |
| 5 | `effectiveFormat` | CellFormat | no | `…values(effectiveFormat)` | drives-divergence (via `numberFormat.type`) | Critical: `effectiveFormat.numberFormat.type` tells us what *type* the engine inferred for the cell (NUMBER vs DATE vs CURRENCY vs TEXT). Today we cannot tell whether `45000` means "the number 45000" or "Mar 19 2023 displayed as a number" without external context. |
| 6 | `hyperlink` | string (read-only) | **no** | `…values(hyperlink)` | drives-divergence (single-link convenience) | The HYPERLINK silent-pass example. When `=HYPERLINK("url", "text")` runs, the cell has `effectiveValue.stringValue = "text"` *and* `hyperlink = "url"`. **But (per Probe 7) this field is a convenience that populates only when a single link covers the whole cell — it is absent on multi-link cells, which encode links exclusively in `textFormatRuns`.** Schema should rely on textFormatRuns as primary; hyperlink as derived. |
| 7 | `note` | string | no | `…values(note)` | n/a-cross-platform | Cell annotations / comments. Excel has comments too but they're a different model. Not a formula-divergence driver; would be relevant for an authoring-fidelity surface, not for assay's core mandate. |
| 8 | `textFormatRuns[]` | array of TextFormatRun | no | `…values(textFormatRuns)` | **drives-divergence (primary link encoding)** | Per-substring formatting *within* a cell's string value, including per-run `format.link`. **Per Probe 7, this is the *canonical* link encoding** — cell-level `hyperlink` and `effectiveFormat.textFormat.link` only populate as conveniences when a single link covers the whole cell. Multi-link cells encode all links exclusively here. Also carries per-substring bold/italic/underline/color, which gsheets surfaces but most other engines do not. Cross-platform implication: when a formula's output is "rich text," other engines flatten it. |
| 9 | `dataValidation` | DataValidationRule | no | `…values(dataValidation)` | n/a-cross-platform | Input-constraint rule (NUMBER_BETWEEN, ONE_OF_LIST, CUSTOM_FORMULA, etc.). Doesn't affect formula evaluation output; constrains what users can enter. Other engines don't have a runtime-enforced equivalent. Out of scope for assay's core mandate. |
| 10 | `pivotTable` | PivotTable | no | `…values(pivotTable)` | anchor-only | Only the top-left cell of a pivot carries the definition; surrounding cells hold computed `effectiveValue`. Pivot-table divergence is real but is its own axis — the cell-level CellData isn't the right surface to track it. |
| 11 | `dataSourceTable` | DataSourceTable | no | `…values(dataSourceTable)` | anchor-only | External data binding (BigQuery, etc.). Anchor-cell only. Out of scope for formula divergence. |
| 12 | `dataSourceFormula` | DataSourceFormula (output-only) | no | `…values(dataSourceFormula)` | anchor-only | Output-only, surfaces when a cell contains a data-source formula. Out of scope. |
| 13 | `chipRuns[]` | array of ChipRun | no | `…values(chipRuns)` | n/a-cross-platform | Smart Chips — person mentions, Drive links, etc. Each chip occupies one character (an `@` placeholder) at a `startIndex`. Only Drive-file chips are writable via API; others are read-only. Other engines have no equivalent — modeling this would be a gsheets-only fidelity layer. |

## CellFormat walk (sub-fields of #4 and #5)

`effectiveFormat` and `userEnteredFormat` both have the same shape. The sub-fields, in rough order of formula-divergence load-bearing:

| Sub-field | Type | Relevance | Notes |
|---|---|---|---|
| `numberFormat.type` | NumberFormatType enum | **drives-divergence** | NUMBER_FORMAT_TYPE_UNSPECIFIED, TEXT, NUMBER, PERCENT, CURRENCY, DATE, TIME, DATE_TIME, SCIENTIFIC. Tells us the *type* the engine inferred. Without this, "is 45000 a number or a date?" is unanswerable from the value alone. |
| `numberFormat.pattern` | string | drives-divergence | Custom format string. Affects how `formattedValue` is rendered. Different engines have different default locales → different patterns. |
| `textFormat.link` | object `{uri}` | drives-divergence | Cell-level link in textFormat. Distinct from the top-level `hyperlink` field — this is a writable surface (via TextFormat), while `hyperlink` is read-only. |
| `textFormat.foregroundColorStyle` | ColorStyle | cosmetic | Conditional-format color is a legitimate divergence axis (e.g. "is this cell highlighted?"), but it's a different surface from formula-output fidelity. |
| `textFormat.{bold,italic,underline,strikethrough}` | boolean | n/a-cross-platform | Cell-level (i.e. whole-cell) styling. Per-substring lives in `textFormatRuns`. |
| `hyperlinkDisplayType` | enum | drives-divergence (paired with `hyperlink`) | `LINKED` vs `PLAIN_TEXT` — tells whether a URL-shaped value is displayed as a clickable link. |
| `backgroundColorStyle`, `borders`, `padding`, `horizontalAlignment`, `verticalAlignment`, `wrapStrategy`, `textDirection`, `textRotation` | various | cosmetic | None affect formula evaluation. Some (conditional-format backgrounds) might be relevant for a future "conditional-format divergence" surface, but that's a separate workstream. |

## Fields most load-bearing for fidelity

Distilled from the walk — the schema-design phase should plan to carry, at minimum:

1. **Full ExtendedValue with typed errors.** Replace `CellError = {error: string}` with `{type: ErrorType, message?: string}`. Surface `LOADING` as a non-error transient state.
2. **`Null` as a first-class scalar variant.** Distinct from empty string. Generated in computation via `IF(,,)`, `VLOOKUP(..., )`, etc. Detected via `ISBLANK`. Both gsheets and Lattice support it; both engines lose information if the schema collapses Null and `""`.
3. **`Lambda` as a scalar variant for cross-platform coverage.** gsheets degrades cell-boundary lambdas to errors, but Lattice supports Lambda as a cell value. Schema must carry it to keep Lattice fidelity from being silently truncated.
4. **`textFormatRuns[]` as primary link encoding.** Per-substring `format.link` is the canonical place links live in gsheets. The HYPERLINK silent-pass case is expressible here uniformly. Required to make lattice's no-op produce a divergence.
5. **`effectiveFormat.numberFormat.type` (+ pattern).** What type the engine *inferred*. Without this, the difference between "the number 45000" and "the date 3/19/2023 displayed via number formatting" is invisible.
6. **Cell-level `hyperlink` as derived convenience.** Captured for ergonomics ("does this cell have a single whole-cell link?") — but the schema should not treat it as the source of truth. textFormatRuns is canonical; hyperlink is a one-link special case.
7. **`hyperlinkDisplayType`.** `LINKED` vs `PLAIN_TEXT`. Paired with the link info; signals whether the link is rendered actively.

## Out of scope (consciously)

These are real fields that we are choosing not to absorb into the canonical cell value schema, with rationale:

- **`note`** — annotation, not value. If the wiki surfaces notes as a fidelity axis later, it's a separate model.
- **`dataValidation`** — input constraint, not output. No cross-platform analogue worth modeling at the cell-value layer.
- **`pivotTable`, `dataSourceTable`, `dataSourceFormula`** — these are anchor-cell pointers to larger structures. Pivot-table fidelity is a separate workstream; data-source fidelity arguably out of assay's mandate entirely.
- **`chipRuns[]`** — gsheets-only. No analogue on Excel, Lattice, or any of the secondary engines. Modeling would create a one-platform-only surface, which is exactly the asymmetry the superset constraint is meant to avoid.
- **Cosmetic `CellFormat` sub-fields** (background, borders, padding, alignment, rotation, wrap, direction) — no formula-result implication. Could become a separate "visual-fidelity" lane later; not now.

## Open questions — resolved empirically (2026-05-22)

Probe results in [`gsheets-celldata-probes.md`](./gsheets-celldata-probes.md). Probe script at [`scripts/probes/gsheets-celldata.mjs`](../scripts/probes/gsheets-celldata.mjs); re-runnable.

1. **Lambda error code — RESOLVED.** `=LAMBDA(x, x+1)` produces `errorValue.type = "N_A"` with a specific message about needing to be followed by a call. The gsheets driver should map this normally through the errorValue channel.

2. **Null encoding — RESOLVED (Probe 6).** Untouched cells return no `rowData.values[i]` entry at all. Both `=""` and `=IF(,,)` return CellData with `userEnteredValue.formulaValue` set but **no `effectiveValue` and no `formattedValue`** — the API observably conflates them at the wire-format level. The follow-up probes settled the semantic question definitively:

   | Test | `=""` | `=IF(,,)` |
   |---|---|---|
   | `ISBLANK(cell)` | **FALSE** | TRUE |
   | `ISTEXT(cell)` | TRUE | **FALSE** |
   | `"x" & cell` | `"x"` | `"x"` (null coerces to `""`) |
   | `cell = ""` | TRUE | TRUE (coerced equal) |
   | `cell1 = cell2` | — | TRUE |

   **Conclusion:** Empty string and Null are semantically distinct types in Sheets — `ISBLANK` and `ISTEXT` disagree, which is conclusive. But they coerce to equal under `=` and concatenate identically under `&`. The CellData wire format does not surface the distinction at the cell layer. To read the distinction, a driver has to evaluate `ISBLANK(target)` (or `ISTEXT(target)`) as a side-channel probe and fetch the result of that. Cost: 1 extra cell + part of a read per case where the test author specifically cares about the distinction.

3. **Hyperlink encoding — RESOLVED with correction (Probes 3 + 7 + manual A1 read).** Three distinct authoring paths produce three distinct CellData shapes:

   | Source | cell `hyperlink` | cell `textFormat.link` | `hyperlinkDisplayType` | `textFormatRuns` | cell-level styling |
   |---|---|---|---|---|---|
   | `=HYPERLINK("url","text")` formula | `"url"` | set | `LINKED` | **absent** | auto blue+underline |
   | API `updateCells` with bare link-runs | absent | absent | `PLAIN_TEXT` | both runs | bare |
   | User-typed multi-URL cell (auto-recognized) | absent | absent | **`LINKED`** | both runs | blue+underline at cell |

   **Conclusion:** the cell-level `hyperlink` field populates only when a single link covers the whole cell (the HYPERLINK-formula case). It is NOT the canonical encoding. **The canonical encoding is `textFormatRuns[].format.link` per substring**; cell-level `hyperlink` is a derived single-link view. `hyperlinkDisplayType` is a display-layer signal that can be `LINKED` even with multiple links (per the user-typed case) — so it's not a gate for "where to look for link data." textFormatRuns is always primary.

   This changes the schema-design direction: the assay-canonical cell value needs to model textFormatRuns (or an equivalent per-substring link structure) as the primary link representation. Lattice's HYPERLINK no-op is still the load-bearing silent-pass case; with textFormatRuns as canonical, when Lattice implements HYPERLINK it should emit a one-run textFormatRun covering the cell, and absence of that run is the divergence.

4. **numberFormat.type inference — RESOLVED with nuance.** `effectiveFormat.numberFormat.type` IS auto-populated for date-producing formulas (`DATE` → `DATE`, `NOW` → `DATE_TIME`) and **propagates through cell references** (`=A7` where A7 is a date inherits `DATE`). It is **not** populated for literal numbers or plain numeric formula results — `effectiveFormat.numberFormat` is absent entirely for `123`. So **absence is signal**: when numberFormat.type is set, the engine has typed the cell; when absent, it has not. This is exactly the kind of signal that lets assay distinguish "the number 45004" from "the date 3/19/2023 displayed as a number."

5. **errorValue.message contents — RESOLVED (Probes 5 + 8).**
   - All non-trivial errors include rich, locale-specific messages (English here).
   - `NA()` produces `errorValue.type = "N_A"` with **no `message` field** — bare NA().
   - `VLOOKUP` miss produces `N_A` *with* a message ("Did not find value..."). So same type code, different message presence.
   - **`NULL_VALUE` is not produced in gsheets naturally.** Per maintainer: it's listed in the `ErrorType` enum for Excel compatibility (Excel's `#NULL!` results from its intersect operator, which gsheets doesn't have). Probes confirmed: `=A1:Z1 A30:Z30` produces `"ERROR"` ("Formula parse error"), not `NULL_VALUE`. The driver should never see `NULL_VALUE` from gsheets in practice; if it does, treat as bug.
   - **`LOADING` not exercised; IMPORT* is per-sheet-permission-gated, not context-blocked (Probe 8 + manual toggle test).** `=IMPORTHTML(...)` initially evaluates to `errorValue.type = "REF"` with message "Please use a desktop web browser to allow access to fetch data from external urls." That message is misleading — the actual gate is a **per-sheet "allow connections to external sites" toggle** (a Sheets feature for user-controlled external-fetch permission). After the maintainer enables the toggle on the sheet via the UI, **the same API call reads the IMPORT* output successfully** (verified on this probe spreadsheet: B1 = "Country or territory", spill continues B2 = "* World*", B3 = "India", etc.). So IMPORT* IS supportable from assay's existing API driver — it just requires an operational prereq on the test spreadsheet. `LOADING` was still not observed in either pre- or post-toggle state; it likely requires Sheets-server-async-refresh timing that the synchronous API path doesn't catch.
   - The generic `"ERROR"` type is real and produced by parse failures; that's an addition to the ErrorType enum surface visible at runtime.
   - Implication: error-equality in `expect` matchers should match `type` but not require `message` (message text changes with locale + Sheets-version + may be absent).

## Surprises worth noting

- **`"ERROR"` (generic) is a real ErrorType produced at runtime.** Not documented prominently in the published enum but emitted for parse-level failures. The `Cause`/`Category` schema in `@cartularium/contracts` should make sure this round-trips.
- **The API does not let us distinguish `=""` from `=IF(,,)` from "untouched-but-not-blank-formula" at the CellData level.** A driver wanting to distinguish them needs a side-channel (write `=ISBLANK(target)` into a probe cell, fetch *that*, then trust ISBLANK's verdict). Cost: 1 extra cell + 1 extra read per case needing this distinction.
- **The cell-level `hyperlink` field is a *convenience*, not the canonical encoding.** It populates only when a single link covers the whole cell (HYPERLINK formula case). Multi-link cells encode all links exclusively in `textFormatRuns[].format.link` and have no cell-level `hyperlink`. The canonical schema decision: `textFormatRuns` (or an equivalent per-substring structure) is the primary link representation; cell-level hyperlink is derived.
- **`NULL_VALUE` is an Excel-compatibility enum value, not a gsheets-native error.** gsheets doesn't have an intersect operator so it can't produce `#NULL!`. The driver should never see `NULL_VALUE` from gsheets in practice.
- **IMPORT* is supportable via the API driver after a per-sheet permission toggle.** The "use a desktop web browser" error message is misleading — the real gate is the per-sheet "allow connections to external sites" toggle. Once the maintainer enables it on a spreadsheet, the existing API driver reads IMPORT* output natively. No new driver path, no cached-corpus workaround needed. Design implication: tests that depend on IMPORT* declare a `features: ["external-fetch"]` capability, and the driver/runner verifies the prereq at init time.
- **`LOADING` still unobserved.** Even with IMPORT* working post-toggle, the synchronous API path didn't catch a LOADING state — the import was either REF (pre-toggle) or fully resolved (post-toggle). LOADING likely requires Sheets-server-async-refresh timing not reachable from synchronous spreadsheets.get.

## Remaining unexercised cases

- **`NULL_VALUE` ErrorType** — confirmed unproducible in gsheets natively. Listed in the API enum for Excel-compatibility (Excel's `#NULL!` comes from its intersect operator, which gsheets doesn't have). The driver should never see it from gsheets in practice; if it does, treat as bug.
- **`LOADING` ErrorType** — not reached even with IMPORT* working post-toggle. Likely needs Sheets-server-async-refresh timing the synchronous API can't catch. Schema should still carry it (Lattice or other engines may emit equivalent or near-equivalent transient states), but the gsheets driver won't emit it.
- **Per-substring text styling beyond links** — Probe 7 confirmed textFormatRuns round-trips through the API for links. Bold/italic/underline/color per substring was not exercised but the encoding is uniform with links — same `format` object, different fields. Likely safe to assume it round-trips identically; can probe if a real divergence case needs it.

## Schema-design inputs (handoff to next phase)

This investigation produces the following concrete inputs for the assay-canonical cell value schema work:

- **ExtendedValue → CellValue:** scalar variants `number | string | boolean | error | null`. Replace `CellError = {error: string}` with `{type: ErrorType, message?: string}`. `ErrorType` includes the published enum (`ERROR, NULL_VALUE, DIVIDE_BY_ZERO, VALUE, REF, NAME, NUM, N_A, LOADING`) plus runtime-observed additions if any (`ERROR` is real-and-emitted; `NULL_VALUE` is Excel-compat only on gsheets side).
- **Null as a distinct scalar variant.** Required for Lattice (which carries Null as a real cell-value type) and to express the gsheets `IF(,,)` vs `""` semantic distinction. Note that the gsheets API doesn't surface Null vs "" at the cell-data layer — distinguishing them requires a side-channel ISBLANK probe.
- **Lambda as a scalar variant.** Required for Lattice (carries it). The gsheets driver will never emit a Lambda directly — it surfaces as `errorValue.type = "N_A"` instead.
- **textFormatRuns as the primary link encoding.** Per-substring `format.link` is canonical. Cell-level `hyperlink` is a derived single-link convenience.
- **numberFormat.type (with pattern).** High-signal when present; absence is also signal ("the engine has not typed this cell"). Auto-populated for date/datetime formulas, propagates through references, absent for literal numbers.
- **`features: ["external-fetch"]` capability.** New capability name to declare on tests that depend on IMPORT* output. Driver verifies the per-sheet permission prereq at init.

The schema work itself is the next phase, and it has to fold in Excel considerations (the equivalent gap analysis on the xlsx-XML-as-source-of-truth side) before the canonical schema is settled. That's the next session.

## What this enables

This walk is input to the next phase: design the assay-canonical cell-value schema. The minimum-viable shape becomes a `CellValue` that can carry the load-bearing fields above, plus a `Matcher` extension so case-`expect` can assert on those fields selectively. That work touches `@cartularium/contracts` (the cell-value type leaves the assay package), which means it reaches sheets-wiki and the editor as well as assay internals.

## Related

- [[project-assay-driver-fidelity]] memory — the broader fidelity workstream this slots into.
- `packages/assay/src/format/types.ts` — current `CellValue`, `CellError`, `Matcher`.
- `packages/assay/src/drivers/gsheets.ts` — current driver; the values-API capture path.
- `packages/sheets-wiki/content/concept/Data type.md` — platform-model anchor.
