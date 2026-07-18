# Cell-value fidelity roadmap

Working artifact, not committed. Answers "what does the final excel driver look like" — by working backward from the canonical cell-value schema it has to fill, since the driver's shape is dictated by the contract.

**State as of 2026-05-23 (post-thread-closure, post-reframe, post-C9):** Phase 0 (investigation) substantially complete, including all three originally-queued research threads (Graph REST + Apps Script reframed as PARTIAL via multi-axis re-eval; OOXML metadata.xml → LIVE — D9 helper landed + VERIFIED per F26 + probe C9). Phase 2 driver lifts landed: Excel A1+A2+A3, gsheets B, Excel D9 (`RawXmlReader.resolve_vm`, including verified `#SPILL!` spill-geometry extras). Important emission caveat: some rich ground is captured internally or via helper functions but still collapsed at the public scalar boundary until coalescing/schema work decides how to expose it. **Reframe:** the next major work item is NOT schema design (Phase 1) — it's a **driver-surface coalescing session** combining LIVE + PARTIAL leads into comprehensive per-engine drivers maximizing visible state. Schema (Phase 1) is downstream of the coalescing — it models whatever ground the drivers end up able to expose. See [`audit-session-2026-05-22.md`](./audit-session-2026-05-22.md) for the comprehensive handoff index, and [`driver-surface-leads.md`](./driver-surface-leads.md) for the inventory the coalescing session will draw from.

Draws on:

- [`gsheets-celldata-gap.md`](./gsheets-celldata-gap.md) — gsheets walk + probes (closed-set ErrorType, single API surface, per-substring link encoding).
- [`excel-celldata-gap.md`](./excel-celldata-gap.md) — Excel walk + capture-surface analysis (open-set errors, three reachable surfaces A/B/C with Mac/Win asymmetry).
- Lattice walk: **skipped** (maintainer's first-hand knowledge is the source).

The roadmap is dependency-ordered, not time-ordered ([per maintainer feedback](../../../.claude/...) — no week/quarter grids).

## Investigation constraint: SME asymmetry

The maintainer is a gsheets SME but not an Excel SME (can route to one but wants to handle as much as possible solo first). This shapes how the Excel investigation runs:

- **Solo-resolvable** — anything grounded in spec (ECMA-376), library introspection (openpyxl 3.1.5, xlwings 0.34.0), and on-Mac probing against the existing driver pipeline. This is the bulk of the work.
- **SME-required** — Linked Data Types behavior (needs Microsoft account + signed-in Excel + data service), Windows-only COM properties (`HasSpill`/`SpillingToRange`/`LinkedDataTypeState` reachability), Excel-Win-vs-Mac save-time deviations, calc-engine version drift (365 vs 2019 vs 2021), some VBA/xlsm internals. Catalog these in [`excel-calibration-deficits.md`](./excel-calibration-deficits.md) (TBD) and pass to the SME in one batch later.

The gsheets investigation could be definitive because Google controls the API and publishes the spec. The Excel investigation cannot — it triangulates between spec, raw XML, and library reports, and accepts that some answers require external calibration. **That's intrinsic, not a methodology defect.**

## The picture: the final excel driver

Concretely, post-roadmap, [`packages/assay/src/drivers/excel.ts`](../src/drivers/excel.ts) + [`packages/assay/python/excel_driver.py`](../python/excel_driver.py) emit a `Grid<CellValue>` conforming to a richer canonical schema. The external API of `ExcelDriver` doesn't change (`init` / `evaluate` / `evaluateBatch` / `versionString` / `destroy`); only the *shape of values inside the grid* changes.

The pipeline becomes:

```
1. BUILD xlsx via openpyxl (~same as today; richer inputs if a test declares rich-text or numFmt input)
2. RECALC via xlwings (~same as today)
3. READ-A: openpyxl per-cell over the spill window
     - cell.value (incl. CellRichText for per-run reads)
     - cell.data_type   (OOXML `t`: distinguishes b/e/s/str/n)
     - cell.number_format + cell.is_date  (inferred-type signal)
     - cell.hyperlink   (sheet-level <hyperlinks> resolved to cell)
     - cell.comment     (legacy comments)
   Worksheet-level: ws.data_validations, ws.conditional_formatting, ws.merged_cells
4. READ-C: raw OOXML pass over the saved xlsx (zipfile + ElementTree, stdlib)
     - <c cm="..."> for spill recipients
     - <c vm="..."> + xl/richData/ for Linked Data Types
     - xl/threadedComments for modern comments (optional)
   Scope: only fields openpyxl drops. ~50ms per chunk overhead.
5. READ-B [DEFERRED]: xlwings .api reads pre-save for live-only state
     - #GETTING_DATA transients (Linked Data Types, Power Query, STOCKHISTORY)
     - Range.HasSpill / SpillingToRange (Windows COM only — Mac AppleEvents lacks them)
   Holds Excel process attached during reads. Not in v1 schema delivery.
```

Each cell that reads back contributes a `CellValue` of shape (full canonical form; details under "Schema shape" below):

```
CellValue =
  | { kind: 'number',   value: number, numFmt?: NumberFormat }
  | { kind: 'string',   value: string, runs?: RichRun[], hyperlink?: string }
  | { kind: 'boolean',  value: boolean }
  | { kind: 'error',    code: ErrorCode, message?: string }
  | { kind: 'null' }
  | { kind: 'structured', subtype: 'linked-data-type' | 'cube' | 'lambda', detail: ... }

NumberFormat =
  | { type: 'NUMBER' | 'PERCENT' | 'CURRENCY' | 'DATE' | 'TIME' | 'DATE_TIME' | 'SCIENTIFIC' | 'TEXT', pattern?: string }

RichRun = { startIndex: number, text: string, format?: { bold?, italic?, underline?, color?, link? } }

ErrorCode = '#DIV/0!' | '#N/A' | '#NAME?' | '#NULL!' | '#NUM!' | '#REF!' | '#VALUE!' | '#SPILL!' | '#CALC!' | '#GETTING_DATA' | string  // open-set
```

This is the strawman. The actual shape comes out of the schema-design phase below — the strawman is here so the picture is concrete, not because it's settled.

## What changes vs today

| Field | Today | Final | How |
|---|---|---|---|
| Scalar value | yes | yes | unchanged |
| Boolean vs 0/1 | yes (via Python `isinstance`) | yes (via OOXML `t="b"`) | openpyxl `cell.data_type` |
| Error sentinel | string `"#DIV/0!"` only | discriminated `{kind:'error', code:'#DIV/0!'}` with open-set tolerance for `#SPILL!`/`#CALC!`/future | openpyxl `cell.data_type` + `cell.value` |
| Error message | dropped | `message?` populated only when live-engine reads it (B); never from saved-file (A) | Surface B optional, default null |
| Inferred type (date vs number) | **destroyed** by `_dt_to_serial` flattening | preserved as `numFmt.type`; `_dt_to_serial` only runs when caller wants scalar | openpyxl `cell.number_format` + built-in table lookup |
| Per-run rich text | dropped | `runs[]` with per-run formatting | openpyxl `CellRichText` |
| Cell hyperlink (manual) | dropped | `hyperlink` field on string CellValue | openpyxl `cell.hyperlink` |
| HYPERLINK formula URL | dropped — only `display` survives | preserved when test declares it as a divergence axis | Raw `<f>` re-read or the test author asserts on it explicitly |
| Spill anchor / recipient | flattened (recipients read as bare values) | `spillIdentity: 'anchor' \| 'recipient'` | Raw XML `<c cm="...">` |
| Linked Data Types | display string only | `{kind:'structured', subtype:'linked-data-type', detail:{...}}` | Raw XML `xl/richData/` (or platform-tagged as Excel-only-fidelity) |
| `#GETTING_DATA` transient | unreachable | reachable via Surface B (deferred to v2) | xlwings pre-save `.api` reads |

## Schema shape — three forks

The strawman above is one of several possible shapes. The real fork:

### Fork 1 — Tagged union vs scalar+sidecar

**Option A (tagged union):** `CellValue = { kind, value, ...rich }`. Every cell is a record. Today's `CellValue = number | string | boolean | {error} | null` becomes the `kind` discriminator.

**Option B (scalar with metadata sidecar):** keep `CellValue = number | string | boolean | error | null` as-is; add a parallel `CellMetadata` channel that drivers fill and matchers opt into. `Grid<CellValue>` stays the same shape; a new `Grid<CellMetadata | undefined>` accompanies it.

| | A (tagged) | B (sidecar) |
|---|---|---|
| Honesty | high — types reflect the actual variant | medium — primitive cells look schemaless |
| Migration cost | high — every consumer touches `CellValue` (sheets-wiki catalogue, editor, formulary refs) | low — existing consumers unchanged; new consumers opt in |
| Matcher complexity | one matcher language extension | two channels to compose |
| Pre-alpha leverage | strong — break it now while breaking is cheap [memory](../../../.claude/...) | weak — incrementalism is friction, not safety |

**Lean: A (tagged union).** Pre-alpha makes the migration cost cheap; sidecar tends to permanently bifurcate the surface; matcher language is simpler with one channel. The `pre-alpha` memory makes this a low-cost vote.

**Why not B:** the sidecar plan reads as "let's not commit to the schema yet" — but the gap walks have done the commitment work. Deferring the type-level commitment means living with two-channel ergonomics forever.

### Fork 2 — Excel-only types in the canonical schema

Linked Data Types (Stocks/Geography/Image) and CUBE functions have no gsheets or Lattice analog. The gsheets walk made the parallel call for Smart Chips (excluded as gsheets-only).

**Option A (model generically):** add `kind: 'structured'` to the canonical schema. Excel emits it for Linked Data Types; gsheets emits it for Smart Chips; Lattice emits it for whatever it has.

**Option B (platform-tagged sidecar):** schema covers what all platforms can express; each platform emits an `extra.<platform>` namespace for platform-specific fidelity that doesn't generalize.

| | A (generic structured) | B (platform-tagged) |
|---|---|---|
| Cross-platform fidelity | clean — same shape everywhere | clean — extras are explicitly scoped |
| One-platform asymmetry | hidden — schema implies cross-platform meaning that doesn't exist | visible — `extra.excel.linkedDataType` is honest about being Excel-only |
| Schema surface | bigger, but unified | smaller core; bigger total surface |
| Matcher | `kind: 'structured'` matchers work everywhere | platform-aware matchers |

**Lean: B (platform-tagged).** The gsheets walk's Smart Chips exclusion sets the precedent. Trying to model Linked Data Types and Smart Chips and "future-Lattice-type-X" as one variant invites pretending they're commensurable.

**Why not A:** generic-structured is a tax on cross-platform assertions that don't apply. A test asserting on `kind: 'string'` shouldn't have to think about whether some platform emitted `kind: 'structured'` for the same logical content.

### Fork 3 — Fidelity tier: per-driver or per-test

`TestCase.features?: string[]` already exists ([`format/types.ts:131`](../src/format/types.ts)) — designed for capability gates ("test requires external-fetch"). Extend it for fidelity tiers?

**Option A (fixed driver tier):** every driver always emits everything it can. Cheap fields run on every test.

**Option B (per-test fidelity capability):** tests opt in to richer fields via `features: ['numFmt-type', 'text-runs']`. Drivers skip the lift for tests that don't ask.

| | A (always-on) | B (opt-in) |
|---|---|---|
| Read cost | constant per-cell overhead | per-test branching |
| Matcher correctness | matcher can always assert on rich fields | matcher must check capability before assertion |
| Authoring ergonomics | simpler — no capability bookkeeping | explicit — test author thinks about what they're asserting on |
| Driver complexity | uniform pipeline | conditional pipeline |

**Lean: A (always-on) for Surface A + C; B (opt-in) for Surface B.** Reasoning: Surface A and C add no measurable cost beyond the current pipeline (per-cell openpyxl vs `iter_rows` is single-digit-ms on a 20×20 window; raw XML pass is sub-100ms). Surface B holds Excel attached and adds COM round-trips, so opt-in makes sense.

**Why not pure A:** Surface B's cost is non-trivial; making `#GETTING_DATA` capture always-on penalizes the 99% of tests that don't need it.

**Why not pure B:** the bookkeeping cost of tagging every test with `features: ['numFmt-type']` is permanent friction for a one-time pipeline change.

### Fork 4 — Mac-first or Windows-first for Surface B

Maintainer is on Mac. Mac AppleEvents lacks several modern Excel properties (`HasSpill`, `SpillingToRange`, `LinkedDataTypeState`). Per [project-assay-driver-fidelity](../../../.claude/...), Windows behavior needs external calibration.

**Option A (Mac-first, then Windows):** v1 reads only what Mac AppleEvents exposes. Document Windows-additions as upgrades.

**Option B (Windows-first, defer Mac):** v1 reads everything COM exposes on Windows. Mac driver stub-emits "live-only state unsupported on this platform."

**Option C (defer Surface B entirely):** v1 schema carries the variants (`#GETTING_DATA`, spill identity), no driver emits them yet. Both platforms come online together in v2.

| | A (Mac-first) | B (Win-first) | C (defer) |
|---|---|---|---|
| What ships in v1 | partial Surface B | partial Surface B | no Surface B |
| Calibration burden | none (Mac local) | external (no Windows host) | none until v2 |
| Schema integrity | schema-can-emit > drivers-emit | same | schema-defines, drivers-don't-emit-yet |
| Velocity | slow (Mac AppleEvents workarounds) | blocked | fastest |

**Lean: C (defer Surface B).** The user is solo + monitoring-bottlenecked; opening a calibration dependency to ship v1 is the wrong tradeoff. The schema can carry `#GETTING_DATA` and `spillIdentity` without any driver emitting them — the gsheets walk already noted `LOADING` is similar (in the enum, not observed). Spec-then-implement is the right order.

**Why not A:** Mac AppleEvents gaps mean v1 ships with capability holes that are individually-debuggable but collectively confusing ("why does HasSpill work on Win but not Mac?"). Better to ship with no Surface B than partial.

**Why not B:** blocking on Windows calibration ([memory](../../../.claude/...)) is the wrong constraint to take on right now.

## Phases

Dependency-ordered, no timelines.

### Phase 0 — Investigation (substantially complete post-2026-05-22)

The Excel side was structurally bigger than gsheets because of the multi-surface trust problem (no single API ground truth; the libraries we use to read are themselves part of the uncertainty). Investigation phase wrapped via empirical probes + 7-research-agent cross-validation against MS-XLSX spec, Excel JS API, VBA reference, Office support pages, M365 release notes, and Google Workspace docs.

| Item | State | Notes |
|---|---|---|
| gsheets gap walk + probes | done (commits 9261770b → c9d3252f) | 11 probes via `gsheets-celldata.mjs` |
| Excel gap walk scaffold | done | [`excel-celldata-gap.md`](./excel-celldata-gap.md); also superseded by the live catalog |
| Lattice walk | **skipped** | maintainer call; Lattice is user's solo project |
| Excel driver-fidelity audit | **done** | [`excel-driver-fidelity.md`](./excel-driver-fidelity.md); F1–F24 + D1–D9 |
| Excel behavior probes | done | 15 scenarios via `excel-driver-fidelity.py`; data in same file |
| Excel calibration-deficits catalog | inline in catalog | C2 resolved by research; C3/C4/C6 remaining (SME or external env) |
| Excel-native concept expansion | done | research agents covered the gaps |
| gsheets driver-fidelity audit | **done** | [`gsheets-driver-fidelity.md`](./gsheets-driver-fidelity.md); G1–G5 + D1–D6 |
| Research-agent validation pass | **done** | 7 agents dispatched; all five clean two-engine divergences spec-grounded |
| Schema-design precedents distillation | **done** | [`schema-design-precedents.md`](./schema-design-precedents.md) |
| Queued threads (Microsoft Graph, Apps Script, OOXML metadata.xml) | **closed** | Synthesized into F25/F26/G6; original prompts retained in [`queued-research-threads.md`](./queued-research-threads.md) |

**Driver-fidelity audit** answers: where do openpyxl and xlwings lie or omit relative to the raw OOXML XML? Methodology: build a probe xlsx, recalc via xlwings, read three ways (openpyxl per-cell, raw XML, optionally xlwings live `.api`), record disagreements. Disagreements are findings — each one is either a known limitation to document or a switch-to-different-surface signal.

**Behavior probes** answer: what does Excel-the-engine do (null vs "", error sentinel surface, numFmt inference, etc.)? Methodology mirrors the gsheets probe doc structurally, but probes record findings at multiple layers — "openpyxl says X, raw XML says Y" — not just behavior assertions.

**Calibration-deficits catalog** is where SME-only questions go. Not blocking; grows continuously.

### Excel-native concepts the gap walk has to cover

Things Excel has that gsheets doesn't, or has very differently. The current gap walk scaffold treats these patchily; needs explicit treatment:

- **Implicit intersection / `@` operator.** Pre-365 Excel collapsed `=A1:A10` in a single-cell context to the row-aligned scalar. Post-365 `@` explicit-intersects; bare reference spills. Major calc-engine behavior break between Excel-2019 and Excel-365. Probable solo-resolvable: probe `@A1:A10` vs `A1:A10` in the file.
- **`_xlfn.` / `_xlws.` / `_xlbgnm.` function-name prefixing.** Modern functions stored in the xlsx with namespace prefixes for backward-compat. Display strips them. openpyxl may or may not. Probable solo-resolvable.
- **CSE arrays vs dynamic arrays.** Two distinct array models that coexist in modern Excel. `{=...}` (Ctrl-Shift-Enter, `t="array"` in OOXML) vs `=SEQUENCE(5)` (modern spill, `cm`-marked recipients). Different shape, different file encoding. Solo-resolvable.
- **R1C1 reference style.** App-level setting; some xlsxes carry formulas in R1C1 form. Solo-resolvable but rare in practice.
- **Defined Name scope** — workbook-level vs sheet-level. Same name can mean two things. Solo-resolvable via openpyxl `wb.defined_names` + raw `definedName` XML inspection.
- **Tables / ListObjects with structured references.** `Table1[Column1]` resolves to a range *and* carries header/totals semantics. No gsheets analog. Solo-resolvable via `xl/tables/`.
- **1900 vs 1904 date system.** Workbook-level setting. Shifts all date serials by ~1462 days. **The current driver's `_DATE_EPOCH = datetime(1899,12,30)` is hardcoded to 1900** ([`excel_driver.py:33`](../python/excel_driver.py)) — would silently corrupt date reads from a 1904-mode workbook. Probable real driver bug, solo-resolvable.
- **Threaded comments vs legacy comments.** Two models coexist in modern files. openpyxl reads only legacy; modern is `xl/threadedComments/` + `xl/persons/`. Solo-resolvable via raw XML.
- **Iterative calculation + circular references.** Workbook-level option. Persisted. gsheets has a similar option but different semantics. Solo-resolvable in principle; needs probing to confirm round-trip.
- **Precision-as-displayed.** Excel workbook option to round all values to displayed precision. No gsheets analog. Solo-resolvable.
- **`#FIELD!` and `#UNKNOWN!`** — additional modern error sentinels beyond the historical 7 + spill/calc/getting-data. `#FIELD!` comes from Linked Data Types missing a sub-field; needs SME context to verify. `#UNKNOWN!` for cross-version cells; solo-checkable in principle.
- **LET / LAMBDA / MAKEARRAY / MAP / REDUCE / SCAN / BYROW / BYCOL.** Modern functional sub-language. Some gsheets analogs (LAMBDA, LET); recent additions have different semantics. Mostly solo-resolvable.
- **XLOOKUP/XMATCH match modes including regex** — file-level option-set per call. Solo-resolvable, but cross-engine semantics is a wider question.
- **VBA macros / xlsm.** Likely out of scope for assay (we're a formula-fidelity tool); flag and move on.
- **Data Model / Power Pivot / Power Query / CUBE functions.** Excel-only embedded sub-engines. Schema decision per Fork 2 (platform-tagged extras). Audit-relevant only if these can corrupt cell reads on the main sheet (unlikely).
- **The `.xlsb` binary format.** Different on-disk encoding; same logical model. Probably out of scope for assay.

### Phase 1 — Schema design

| Item | Blocked on |
|---|---|
| Resolve Forks 1–4 | maintainer decisions on this doc |
| Write schema design spec (lives at `internal/superpowers/specs/<dated>-cell-value-schema.md`) | Phase 0 done; forks resolved |
| Implement in `@cartularium/contracts` (`CellValue`, `NumberFormat`, `RichRun`, `ErrorCode`) | spec written |
| Extend `Matcher` language with new field assertions (numFmt.type, runs[], hyperlink, structured.subtype) | contracts implementation |
| Build + publish contracts package; verify type-only consumers compile | contracts changes |

### Phase 2 — Driver lifts

Per-driver. Each driver's lift is independent once the contract is settled.

#### Excel driver lift

| Item | Blocked on |
|---|---|
| Switch `read_sheet_result` from `iter_rows(values_only=True)` to per-cell openpyxl reads | Phase 1 contracts |
| Map openpyxl per-cell properties to canonical CellValue (numFmt-type lookup table, CellRichText → runs, cell.hyperlink → hyperlink) | per-cell read switch |
| Add raw-XML pass for `cm`/`vm`/`xl/richData/` | contracts settled |
| Decide Linked Data Type modeling (informed by Fork 2 resolution) | Fork 2 resolved |
| Surface B (xlwings pre-save reads) | **deferred per Fork 4** |
| Unit tests for the new read path against fixture xlsxes (build, recalc, read, assert shape) | Phase 1 + read implementation |

#### gsheets driver lift

| Item | Blocked on |
|---|---|
| Profile current `spreadsheets.get?includeGridData` quota usage (post-lift B) | — |
| Switch API path to `spreadsheets.get?includeGridData` with field mask | quota profile |
| Implement adaptive backoff for the heavier API | API switch |
| Map gsheets API response to canonical CellValue (ErrorType enum, effectiveFormat.numberFormat, textFormatRuns → runs) | Phase 1 contracts |
| Decide Smart Chips modeling (Fork 2 precedent applies) | Fork 2 |
| ISBLANK side-channel probe for Null disambiguation (gsheets walk's resolution) | API switch |

#### Lattice driver lift

| Item | Blocked on |
|---|---|
| Lattice walk if Phase 0 decision = "yes, write it" | Phase 0 decision |
| Map Lattice cell values to canonical CellValue (Lambda variant lives here) | Phase 1 contracts + walk |

#### Secondary drivers (formulas, hyperformula, ironcalc, libreoffice, pycel)

Per [`packages/assay/CLAUDE.md`](../CLAUDE.md): preview pipeline is only gsheets/excel/hyperformula; full corpus is all 8.

| Item | Blocked on |
|---|---|
| Decide whether secondary drivers conform to the canonical schema or stay on the legacy shape | Phase 1 done; observe what the lift costs for the primaries |

Rejected: forcing all 8 drivers to the new schema in lockstep. Too much surface to migrate atomically; primaries are where compatibility evidence actually drives decisions.

### Phase 3 — Case-file migration

| Item | Blocked on |
|---|---|
| Audit existing test cases against the new schema; catalog silent-pass corrections | Phase 2 drivers landed |
| Per-fixture: keep loose matcher (current behavior) or tighten with new fields | audit done |
| Document the new matcher language in case-authoring docs ([`writing-tests.md`](./writing-tests.md)) | Phase 1 matcher extension |

Expectation: a lot of tests pass under the new schema as-is. The cases that *change* outcome are exactly the silent-pass cases — HYPERLINK divergence, the `=""` vs Null distinction on gsheets, etc. Those are the wins the whole exercise was for.

### Phase 4 — Follow-on: Surface B + secondary drivers

| Item | Blocked on |
|---|---|
| Windows calibration host for Surface B (or accept Mac-only with documented holes) | external dependency |
| xlwings pre-save reads for `#GETTING_DATA` + spill identity (Win) | calibration available |
| Lift secondary drivers to canonical schema | Phase 3 outcome — do divergences against them matter enough to justify? |

## Open decisions needing your call

Listed in dependency order. Resolving these unblocks Phase 1.

1. ~~Lattice walk written or not?~~ → **skipped** (your call).
2. **Fork 1: tagged union or sidecar?** Lean: tagged.
3. **Fork 2: generic structured or platform-tagged extras?** Lean: platform-tagged.
4. **Fork 3: fidelity tier per-driver or per-test?** Lean: per-driver for A+C, per-test for B.
5. **Fork 4: Mac-first / Win-first / defer Surface B?** Lean: defer.
6. **Schema design doc location:** `internal/superpowers/specs/<date>-cell-value-schema.md` per CLAUDE.md, or here under `packages/assay/docs/`?
7. **Phase 2 ordering — Excel first, gsheets first, or parallel?** Excel is cheaper per the gap walks (already-saved-file, openpyxl exposes most of what we need). gsheets has the quota-profile precondition that's its own work item.

These are gating Phase 1 only; Phase 0 (investigation) can proceed in parallel.

## Rejected approaches (design archaeology)

Things considered and not chosen, with reasoning.

- **Skip the schema design; just deepen each driver's read independently.** Rejected: the matcher language has to be uniform across drivers for case-file fixtures to portable, which means there has to be a shared contract, which means the schema is unavoidable. Putting it off just defers the same work plus the consumers built against the interim shape.

- **Make the schema gsheets-shaped (since gsheets has the most public spec).** Rejected: the Excel walk surfaced real Excel-only structure (`#SPILL!`, `#CALC!`, Linked Data Types, open-set errors) that doesn't fit a gsheets-shaped schema. Forcing gsheets shape would either drop these or smuggle them into "stringly-typed" backdoors.

- **Skip Surface B forever.** Considered (Surface B is the most expensive). Rejected: `#GETTING_DATA` and the live-engine error sub-types are real fidelity signal; even if v1 doesn't emit them, the schema needs the slot so v2 can. The deferral is on implementation, not on schema-level expressivity.

- **Use Python-side type hints / Pydantic to enforce schema in the driver.** Considered. Probably worth doing in Phase 2's Excel-driver lift; not roadmap-level decision.

- **Capture full OOXML round-trip (write the entire file back from CellValue grids).** Out of scope. The driver is read-side; round-trip is a different concern (closer to formulary's territory).

## What this enables

- The "silent pass" class of bugs (HYPERLINK in gsheets vs Lattice; `=""` vs Null on gsheets; LinkedDataType on Excel) becomes assertable — case-file authors can write expectations against the rich fields.
- The compatibility evidence assay produces becomes higher-resolution: not "do these engines all return `"click"`" but "does the cell carry a hyperlink, and are the per-engine answers the same?"
- The matcher language gets richer without breaking existing fixtures (assuming Fork 1=tagged with sensible defaults).
- Future drivers (e.g. if formulary ever needs one, or if Numbers or Quip enter the corpus) have a clear contract to fill.

## Related

- [[project-assay-driver-fidelity]] — broader fidelity workstream this slots into.
- [`gsheets-celldata-gap.md`](./gsheets-celldata-gap.md), [`excel-celldata-gap.md`](./excel-celldata-gap.md) — Phase 0 inputs.
- [`packages/assay/src/format/types.ts`](../src/format/types.ts) — current `CellValue`, `Matcher`.
- `@cartularium/contracts` package — where the schema lands.
