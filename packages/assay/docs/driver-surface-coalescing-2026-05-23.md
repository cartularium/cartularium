# Driver-surface coalescing session — 2026-05-23

Session record (started as prep doc; locked 2026-05-23 with all decisions resolved). Frames the per-engine decisions to combine LIVE driver-surface leads (per [`driver-surface-leads.md`](./driver-surface-leads.md)) into comprehensive per-engine drivers that maximize visible engine state.

**Scope clarification:** this doc DOES design schema — the canonical per-engine `RichCellValue` contract is locked below ("Canonical coalesced output"). What remains downstream is **cross-engine schema unification** — how different engines' rich shapes reconcile semantically (e.g. when Excel `modern_error_detail.sub_type=1` and a hypothetical libreoffice equivalent should both satisfy a single cross-engine assertion). The per-engine contracts ship first; unification later. **A pickup agent should treat the canonical contract + implementation order below as authorized work, not as proposals awaiting further design.**

> **Read order before this doc:** [`audit-session-2026-05-22.md`](./audit-session-2026-05-22.md) → [`driver-surface-leads.md`](./driver-surface-leads.md) → [`driver-surface-verifier-2026-05-23.md`](./driver-surface-verifier-2026-05-23.md). Both fidelity catalogs ([excel-driver-fidelity.md](./excel-driver-fidelity.md), [gsheets-driver-fidelity.md](./gsheets-driver-fidelity.md)) give finding-level detail when needed.

## Goal

For each engine with LIVE / PARTIAL surfaces, decide:

1. Which currently-internal `RichCell` fields become part of the **public driver output**?
2. Which **uncaptured-but-LIVE** surfaces (Surface B for Excel) get wired into the driver?
3. Which **PARTIAL** axes (Apps Script A4 R1C1, Graph A6/A7/A8) are load-bearing enough to add as a second driver path?
4. What does the public per-engine output shape look like after coalescing?

The output of this session is (a) decisions captured in this doc and (b) follow-up driver code changes.

## Current state recap (where the rich data lives)

Both Excel and gsheets drivers already construct internal `RichCell` representations capturing the full LIVE-surface payload, then collapse to scalar `CellValue` at the public boundary. The collapse comments in both drivers explicitly cite "waiting on canonical schema design."

### Excel — `python/excel_driver.py`

| Layer | Fields | Status |
|---|---|---|
| Public scalar (current `evaluate()` shape) | `CellValue = number\|string\|boolean\|{error:string}\|null` | Stable; matches cross-engine `GridValue` |
| Internal `RichCell` (built by `_build_rich_cell`) | `value`, `data_type`, `number_format`, `is_date`, `hyperlink`, `comment`, `rich_runs`, `raw: RawCellData` | Populated, **not exposed publicly** |
| Internal `RawCellData` (built by `RawXmlReader._parse_sheet`) | `t`, `s`, `cm`, `vm`, `formula_text`, `formula_array_marker`, `formula_array_ref`, `formula_namespaces` | Populated, **not exposed publicly** |
| Internal D9 modern-error descriptor (`RawXmlReader.resolve_vm`) | `{symbol, errorType, subType?, extras?}` for `_error` rich values | **Helper-only; NEVER referenced by the production `read_sheet_result()` scalar path.** Scalar output for a modern-error cell is whatever openpyxl returned for `cell.value` (often a `#X!` error-string fallback that `_value_to_cell`'s regex routes to `{error: "#X!"}`, sometimes `None`). The rich descriptor isn't being stripped — it was never read. D9 emission work in the migration is "wire `resolve_vm` into the production read path for the first time," NOT "switch a collapse to emit richer detail." |
| **Surface B uncaptured** (xlwings live `.api.Range.*`) | `Value2` (bit-accurate raw serial), `DisplayFormat` (CF overlay), `SavedAsArray` (IIE/AE writer-heuristic) | **Documented in F21-F24 only; not yet wired into driver** |

### gsheets — `src/drivers/gsheets.ts`

| Layer | Fields | Status |
|---|---|---|
| Public scalar (current `evaluate()` shape) | Same `CellValue` cross-engine type | Stable |
| Internal `RichCell` (built by `buildRichCell`) | `scalar`, `kind`, `formula`, `formatted`, `numberFormat`, `hyperlink`, `textRuns`, `raw: ApiCellData` | Populated, **not exposed publicly** |
| `kind` semantics | `"number"\|"string"\|"boolean"\|"error"\|"null"\|"spill-null"\|"blank"` | Wire/provenance signal; not a complete semantic value type (`=""` and `=IF(,,)` indistinguishable without side-channel ISBLANK/ISTEXT probe) |
| **Apps Script A4 uncaptured** | `Range.getFormulasR1C1()` returns R1C1 notation; REST API is A1-only | Surface evaluation closed (G6); whether to add an Apps Script bridge is a coalescing decision |

### Other engines (formulas / hyperformula / ironcalc / libreoffice / pycel / lattice)

No ground audit yet — per leads inventory, these are out of scope for this session. Each will get its own per-engine audit before participating in coalescing. **Lattice is deferred per user direction.**

## Decisions confirmed (2026-05-23)

User greenlights from session walkthroughs (two passes):

**First pass:**

- **D2 + D3** ✓ Full promotion (α). All internal `RichCell` / `RawCellData` / D9 modern-error / `ApiCellData` fields go public.
- **D5** ✓ Wire all three Surface B properties (`Value2`, `DisplayFormat`, `SavedAsArray`).
- **D6** ✓ Skip Apps Script R1C1 bridge; document as known gap.
- **D7** ✓ Skip Graph driver path (A6/A7/A8); document as deferred-but-ready.
- **D8** ✓ Keep gsheets `kind` as wire-provenance signal. **D8.β (side-channel `disambiguateBlank` probe) deferred to a future pass but confirmed as genuinely load-bearing for certain tests.**
- **D4** ✗ Symptomatic — collapsed into D1 (extending `CellError` is putting a band-aid on the wrong abstraction).
- **D1** **EXPANDED SCOPE** — see below.

**Second pass:**

- **D1 shape: Candidate A** ✓ — common-fields + engine-tagged extension. Mirrors stated design principles most directly.
- **Q3 fixtures: regenerate all** ✓ — pre-alpha means losing existing fixtures has low cost; single source of truth.
- **Q4 driver delivery: `evaluate()` returns rich directly** ✓ — one method instead of two; consumers get a scalar projection helper.
- **Q5 other engines: stub-then-audit-later** ✓ — ship redesign without blocking on per-engine audits.

**D1.A subdecisions (defaulted to leans; flag if pushback needed before implementation):**

- **D1.A.1** — ✗ **VETOED 2026-05-23.** User: "overengineering; not a testing priority." `text_runs` does NOT appear in the shared top-level. Each engine emits its native text-run shape inside its own engine extras: Excel `rich_runs` in `ExcelExtras`; gsheets `text_format_runs` already carried inside `GSheetsExtras.raw_api`. No cross-engine rich-text vocabulary; tests that care about rich text assert per-engine.
- **D1.A.2** — **β model locked 2026-05-23.** Two distinct kinds — `kind: "blank"` and `kind: "null"` — each carrying a wire-provenance `reason`. Excel emits `kind: "blank"` for ALL nullish output (cell-state that decays through formulas). Gsheets emits `kind: "blank"` for untouched cells / spill recipients without value, and `kind: "null"` for formula-returned propagatable Null. The semantic split between `=""` (empty string) and `=IF(,,)` (Null) is gated on D8.β `disambiguateBlank()` — until then, gsheets's `formula-no-effective` reason flags wire-ambiguous cells. Matches the audit memory's "Excel blank ≠ gsheets Null; both needed."
- **D1.A.3** — `primitive.kind: "extended-error"` exists **cross-engine** (renamed from "modern-error" per user 2026-05-23 — "modern" misimplied chronology for gsheets's `LOADING`/`ERROR`/`GETTING_DATA`/`NULL_VALUE`). The grouping is "non-classic, beyond the original 7-error set"; chronology-neutral. Engine extras carry the rich detail; Excel-side field remains `modern_error_detail` because Microsoft's docs use "modern" for the rich-value family specifically — that engine-level naming is accurate and load-bearing-for-cross-referencing with MS docs.
- **D1.A.4** — `formula` is a **string** at the shared level (the formula as the engine saw it). Engine extras carry dialect details (Excel IIE/AE distinction; gsheets R1C1 if ever surfaced).
- **D1.A.5** — matcher language is **structural subset** matching. Composes with existing `MatcherObject` shape; reads naturally; less novel syntax than dot-paths.

## D1 — Cell-value redesign (expanded scope, 2026-05-23)

**User reframe:** the current `CellValue = number | string | boolean | CellError | null` is the wrong abstraction layer for the post-audit world. The audit revealed driver-internal `RichCell`s substantially richer than the public scalar collapse; D4's "extend `CellError`" was symptomatic of a deeper mismatch. The whole cross-engine cell-value contract needs redesign.

**Design principles (from user):**

1. **Drivers are independently maximal.** Each engine driver exposes the full state observable from its surfaces — NOT a lowest-common-denominator constrained by the least-capable engine.
2. **Shared language.** Common vocabulary for properties that mean the same thing across engines (primitive value, formula text, formatted display string, hyperlink, format type).
3. **Per-test property comparison.** The matcher language extends to address rich properties; tests pick which properties matter rather than comparing whole-cell equality.

**Scope flag:** redesigning `CellValue` is load-bearing for the rest of the project. Touches: all 8 drivers, runner matcher pipeline (`evaluateMatcher` / `gridsEqual` in `src/format/`), fixtures format, `@cartularium/contracts` (re-exports + assay-preview types), `sheets-wiki-editor` (preview UI: `ComparisonBody.tsx`, `ResultGrid.tsx`, `format.ts`), manifest build, benchmark, resolutions. Pre-alpha means breaking changes are cheap — but the migration is real work.

### Candidate shapes

Three shapes that satisfy the design principles. Each ships with a concrete TS sketch + matcher-language implication.

#### Candidate A — Common-fields + engine-tagged extension (recommended)

Top-level fields are the shared language. Nested `engine` field carries engine-specific extras via discriminated union.

```typescript
type RichCellValue = {
  // Shared language — comparable across engines via path-addressed matchers
  primitive: PrimitiveValue;
  formula?: string;                                       // formula text (no leading "=")
  formatted?: string;                                     // display string
  number_format?: { type?: string; pattern?: string };
  hyperlink?: string;                                     // simple single-link; complex in engine extras
  text_runs?: Array<TextRun>;                             // shared rich-text segmentation
  // Engine extras — discriminated union, opaque to cross-engine assertions
  engine: ExcelExtras | GSheetsExtras | HyperformulaExtras | /* ... */ ;
};

type PrimitiveValue =
  | { kind: "number"; value: number }
  | { kind: "string"; value: string }
  | { kind: "boolean"; value: boolean }
  | { kind: "error"; sentinel: string }                                   // classic 7-error set
  | { kind: "modern-error"; sentinel: string; error_type?: number }       // Excel rich-value family
  | { kind: "null"; reason?: "blank" | "spill-null" | "formula-no-effective" }   // wire-provenance
  | { kind: "rich-text"; collapsed: string };                             // runs in shared text_runs

interface ExcelExtras {
  platform: "excel";
  data_type: string;                                      // OOXML t: 'n'/'s'/'str'/'b'/'e'/'d'/'inlineStr'/'f'
  is_date: boolean;
  comment?: { text: string; author: string };
  raw_xml?: { t?: string; s?: number; cm?: number; vm?: number;
              formula_text?: string; formula_array_marker?: string;
              formula_array_ref?: string; formula_namespaces?: string[] };
  modern_error_detail?: { error_type: number; sub_type?: number;
                          extras?: Record<string, string> };              // D9 resolve_vm
  value2?: number | string | boolean | null;                                // Surface B bit-accurate raw value as Excel stores it (dates stay as serials instead of datetime conversion; strings/bools/empties pass through). Error-via-Value2 representation needs empirical verification when Surface B lift lands.
  display_format?: Record<string, unknown>;                                 // Surface B CF overlay
  saved_as_array?: boolean;                                                 // Surface B
}

interface GSheetsExtras {
  platform: "gsheets";
  wire_kind: "number" | "string" | "boolean" | "error" | "null"
           | "spill-null" | "blank";
  raw_api?: ApiCellData;                                  // full Sheets v4 CellData
}
```

**Matcher language (A):** path-addressed dot-notation. Tests assert against any property; engine assertions explicit via `engine.<platform>.*`:

```yaml
expect:
  primitive: {kind: "number", value: 5}
  formula: "SUM(A1:A10)"
overrides:
  excel:
    expect:
      primitive: {kind: "modern-error", sentinel: "#SPILL!"}
      engine:
        excel:
          modern_error_detail: {sub_type: 1, extras: {colOffset: "2", rwOffset: "2"}}
```

**Pros:**
- Mirrors user's stated design ("maximal driver + shared language") most directly
- Shared-vs-engine split is *explicit* in the type
- Matcher extension is *natural* (path-addressed via dot-notation)
- TypeScript discriminated union on `engine.platform` gives engine-extras strong typing

**Cons:**
- Shared set grows over time as more engines audited; some fields may move from engine to shared
- Cross-engine fields that *happen* to overlap structurally (e.g. Excel `modern_error_detail` and a hypothetical libreoffice rich-error) get split across `engine` tags even when semantically parallel — addressable later via shared promotion

#### Candidate B — Pure faceted property bag

No shared/engine hierarchy. Every property is a named independent facet; engines populate the facets their surfaces can fill.

```typescript
type RichCellValue = {
  primitive?: PrimitiveValue;                              // shared
  formula?: { text: string; r1c1?: string; array_ref?: string; namespaces?: string[] };
  display?: { formatted?: string; number_format?: NumberFormat;
              conditional_format?: Record<string, unknown> };
  error_detail?: { engine: "excel-modern"; symbol: string;
                   error_type: number; sub_type?: number;
                   extras?: Record<string, string> };
  rich_text?: { runs: Array<TextRun>; collapsed: string };
  hyperlink?: { target: string; display?: string; tooltip?: string; location?: string };
  metadata?: { comment?: { text: string; author: string };
               cm?: number; vm?: number; data_type?: string;
               saved_as_array?: boolean; value2?: number };
  raw_engine?: Record<Platform, unknown>;                   // escape hatch for unmodeled state
};
```

**Matcher language (B):** test by facet path; engine-conditional via facet's own discriminator:

```yaml
expect:
  primitive: {kind: "number", value: 5}
  error_detail: {sub_type: 1}    # engine-tagged via the facet's shape itself
```

**Pros:**
- Maximum flexibility — every property independent
- Tests address sub-properties without engine-conditional branching at the top
- Facets can be added without touching unrelated structure
- "Per-test property comparison" maps most cleanly onto this shape

**Cons:**
- "Shared language" is *implicit* (the set of named facets) rather than explicit — design discipline less enforceable
- Engine-specific richness lives in `raw_engine` escape hatch with no typing
- Per-engine maximality requires either typing facets per-engine (complex generics) or losing engine-specific structure to `raw_engine`

#### Candidate C — Discriminated union per primitive kind (Microsoft CellValue style)

Each primitive kind is its own discriminated variant. Shared `meta` carried through all.

```typescript
type RichCellValue =
  | NumberCellValue | StringCellValue | BooleanCellValue
  | ClassicErrorCellValue | ModernErrorCellValue
  | NullCellValue | RichTextCellValue;

interface CommonMeta {
  formula?: string;
  formatted?: string;
  number_format?: { type?: string; pattern?: string };
  hyperlink?: string;
  engine: ExcelExtras | GSheetsExtras | /* ... */ ;
}

interface NumberCellValue extends CommonMeta { type: "number"; value: number; }
interface ModernErrorCellValue extends CommonMeta {
  type: "modern-error";
  symbol: string;
  error_type: number;
  sub_type?: number;
  extras?: Record<string, string>;
}
// ... etc
```

**Matcher language (C):** test by `type` + variant fields:

```yaml
expect:
  type: "modern-error"
  sub_type: 1
```

**Pros:**
- Strongest TypeScript discriminated-union typing
- Closest to existing Microsoft Excel.CellValue precedent (schema precedent #1 + #2 from [`schema-design-precedents.md`](./schema-design-precedents.md))
- Variant-specific fields naturally hoisted (e.g. `sub_type` at top level for modern-error)

**Cons:**
- Variants proliferate as engines add kinds (Linked Data Type? Web Image? Entity? Spilled?)
- Cross-variant queries awkward — "any kind of error" requires `type in {"error","modern-error"}` union check
- Adding cross-cutting fields (new shared meta) touches every variant
- "Engine maximality" gets harder: engine extras still need an extension point (the `engine` field on `CommonMeta`), which makes the discriminated union not actually self-contained

### Recommendation: Candidate A

Maps most directly onto user's three principles:
- **Maximal:** `engine` extras can be arbitrarily rich, typed per engine
- **Shared language:** top-level fields are the explicit shared vocabulary
- **Per-test property comparison:** matcher extension is natural via dot-path addressing

C is appealing for type strictness, but variant proliferation under "drivers independently maximal" makes it costly — and the engine-extras extension point on `CommonMeta` means C ends up structurally similar to A but with N variants instead of N kinds. B is the most flexible but loses the explicit shared/engine distinction the user articulated, and the `raw_engine` escape hatch undermines engine typing.

### Open subdecisions inside A (only if A is picked)

These are the second-order questions that resolve in the implementation phase:

- **D1.A.1** — should `text_runs` be a shared top-level field, or moved into engine extras? Argument for shared: rich-text is broadly cross-engine. Argument for engine: per-engine rich-text format vocabulary differs (Excel `b`/`i`/`u`/`color`/`rFont`/`sz` vs gsheets `bold`/`italic`/`fontFamily`/`fontSize`/`foregroundColor`). **Lean: shared with a uniform vocabulary; engine extras carries the raw if needed.** **→ VETOED by user 2026-05-23 (see "Decisions confirmed" section): "overengineering; not a testing priority." Per-engine extras only.**
- **D1.A.2** — should `null` carry a `reason`? It conflates several distinguishable wire shapes if collapsed. **Lean: yes, carry reason as wire-provenance (`blank` / `spill-null` / `formula-no-effective`); matches gsheets `wire_kind` partition. Semantic Null-vs-empty-string is gated on D8.β and not in scope here.** **→ Revised 2026-05-23 to β model (see "Decisions confirmed"): two distinct kinds `kind: "blank"` and `kind: "null"`, surfacing the semantic split at primitive level instead of nesting under reason.**
- **D1.A.3** — does `primitive.kind: "modern-error"` exist cross-engine, or is it Excel-only? Gsheets has `LOADING`, `ERROR`, `NULL_VALUE`, `GETTING_DATA` — arguably modern. **Lean: kind exists cross-engine; engine extras carry rich detail (Excel's `error_type` integer is unique to its rich-value table).** **→ Renamed 2026-05-23 to `kind: "extended-error"` (per user — "modern" misimplied chronology for gsheets's errors).**
- **D1.A.4** — `formula` as a string or as `{text, r1c1?, dialect?}`? IIE-vs-AE dialect is a Excel-specific concern. **Lean: string at the shared level (the formula as the engine saw it); engine extras for dialect details.**
- **D1.A.5** — matcher language: dot-paths (`engine.excel.modern_error_detail.sub_type`) or structural subset matching (`{primitive: {kind: "modern-error"}, engine: {excel: {modern_error_detail: {sub_type: 1}}}}`)? **Lean: structural subset — simpler to read, composes with existing `MatcherObject` shape.**

### Gates downstream of D1 final shape

- `Driver` interface change: `evaluate()` and `evaluateBatch()` return `RichCellValue[][]` instead of `CellValue[][]`. Or: keep scalar `evaluate()` and add `evaluateRich()` (the earlier D1.β framing, now demoted to "delivery mechanism inside the redesign").
- Matcher language extension in `src/format/`: `evaluateMatcher`, `gridsEqual`, classifier all need updating.
- Fixture format: stored fixtures need to round-trip the rich shape (currently scalar JSON).
- `@cartularium/contracts` exports: `RichCellValue` becomes the new canonical type; `CellValue` retired or kept as the `primitive` projection.
- Downstream UI (`sheets-wiki-editor`): preview renderer needs to know how to display rich cells.

### D2 — Excel coalesced public shape ✓ greenlit D2.α

**Question:** which `RichCell` / `RawCellData` / D9 fields go into Excel's public output?

**Options (assume D1.β; this is choosing what `evaluateRichExcel()` returns):**

- **D2.α — Everything internal becomes public** (full `RichCell` + `raw: RawCellData` + D9 modern-error descriptor where `vm` is set). Maximum visible state.
- **D2.β — Curated subset.** Promote: `data_type`, `number_format`, `hyperlink`, `comment`, `rich_runs`, D9 modern-error descriptor. Keep internal: `raw.s` (style index — only meaningful with styles.xml), `raw.formula_namespaces` (audit-debugging detail).
- **D2.γ — Tiered.** Default rich = curated (D2.β); add `evaluateRichExcel({includeRawXml:true})` for the full `RawCellData` payload.

**Recommendation: D2.α.** "Maximum visible state" is the literal goal. The cost of plumbing raw fields the consumer ignores is near-zero; the cost of leaving fields internal and re-relaxing the surface later is higher. Tiering (D2.γ) is premature optimization until we know a consumer actually finds the noise harmful.

**Concrete shape proposal** (Python TypedDict; TS mirror for the runner if needed):

```python
class ExcelRichCell(TypedDict, total=False):
    scalar: CellValue                  # the collapsed value (matches public evaluate())
    data_type: str                      # OOXML t: 'n'/'s'/'str'/'b'/'e'/'d'/'inlineStr'/'f'
    number_format: str
    is_date: bool
    hyperlink: dict                     # {target, display, tooltip, location}
    comment: dict                       # {text, author}
    rich_runs: list[dict]               # [{text, format: {b, i, u, strike, color, rFont, sz}}]
    raw: dict                           # RawCellData fields: t, s, cm, vm, formula_text,
                                        #   formula_array_marker, formula_array_ref,
                                        #   formula_namespaces
    modern_error: dict                  # D9 resolve_vm output: {symbol, errorType, subType?, extras?}
                                        # populated when raw.vm is set + resolves to an _error rich value
```

### D3 — gsheets coalesced public shape ✓ greenlit D3.α

**Question:** which `RichCell` fields go into gsheets's public output?

**Options:**

- **D3.α — Full `RichCell` public.** All fields including `raw: ApiCellData`.
- **D3.β — Curated.** Promote: `kind`, `formula`, `formatted`, `numberFormat`, `hyperlink`, `textRuns`. Keep `raw` internal.

**Recommendation: D3.α.** Same logic as D2.α — promotion cost is near-zero, raw `ApiCellData` is the wire format and is the most defensible "we showed you exactly what Google returned" signal.

**Concrete shape proposal:**

```typescript
interface GSheetsRichCell {
  scalar: CellValue;
  kind: "number" | "string" | "boolean" | "error" | "null" | "spill-null" | "blank";
  formula?: string;
  formatted?: string;
  numberFormat?: { type: string; pattern?: string };
  hyperlink?: string;
  textRuns?: Array<{ startIndex: number; format?: Record<string, unknown> }>;
  raw: ApiCellData;  // promote `raw` from internal to public
}
```

### D4 — D9 emission in scalar `evaluate()` output ✗ collapsed into D1

**Original question:** does scalar `evaluate()` change at all, or stay as today (e.g. extend `CellError` to carry modern-error extras)?

**Status:** **collapsed into D1.** Per user 2026-05-23: "D4 is symptomatic. our cross-engine contract needs to be reworked." Extending `CellError` is a band-aid on the wrong abstraction layer. The D9 emission question dissolves once D1's redesign defines how rich error detail surfaces in the new `RichCellValue` (Candidate A: `engine.excel.modern_error_detail`; B: `error_detail` facet; C: `ModernErrorCellValue` variant).

### D5 — Surface B lift (xlwings live `.api`) ✓ greenlit D5.α

**Question:** wire Surface B (`Range.Value2`, `Range.DisplayFormat`, `Range.SavedAsArray`) into the Excel driver?

**Per leads inventory: high-priority PENDING.** Documented in F21-F24; not yet captured.

**Options:**

- **D5.α — Wire all three.** `Value2` (bit-accurate raw serial — disambiguates date-formatted-numbers from true dates), `DisplayFormat` (conditional-formatting overlay — closest Excel analog to gsheets `effectiveFormat`), `SavedAsArray` (truth signal for the IIE/AE writer heuristic — answers "did Excel decide to persist this as `<f t="array">`?" without re-reading the saved file).
- **D5.β — Wire Value2 + DisplayFormat; skip SavedAsArray.** SavedAsArray is most useful when *debugging* Excel's heuristic; for runtime output it's a single boolean that adds little signal.
- **D5.γ — Skip the lift.** Defer until a specific test/use case demands it.

**Recommendation: D5.α.** Per leads inventory: "Conditional-formatting overlay (F23) is the closest Excel analog to gsheets `effectiveFormat`; capturing it closes a known cross-engine asymmetry." That's load-bearing for divergence assertions on format-dependent behavior. `SavedAsArray` is cheap to capture once xlwings round-trip already exists.

**Implementation cost:** ~100-200 lines in `_run_with_bisect` and adjacent. New: a second xlwings pass between recalc-save and openpyxl-read (or fold into the existing recalc pass by reading `.api` properties before save). Adds 1× xlwings property read per non-empty cell, so ~O(populated-cells) per chunk. Mac sandboxing already in place.

### D6 — Apps Script A4 (R1C1) inclusion ✓ greenlit D6.β (skip with documented gap)

**Question:** add an Apps Script bridge to the gsheets driver to capture R1C1 formula notation?

Per leads inventory G6 + verifier: this is the ONLY load-bearing axis Apps Script adds. Everything else is a strict subset of REST.

**Options:**

- **D6.α — Add Apps Script bridge.** New code path: deploy Apps Script project per spreadsheet, expose `getFormulasR1C1()` via Web App URL, gsheets driver calls it during evaluation.
- **D6.β — Skip.** Document R1C1 as a known gap; revisit when a consumer specifically needs R1C1 notation.

**Recommendation: D6.β.** R1C1 vs A1 is a presentation difference, not a semantic difference (the underlying formula is identical; only the cell-reference notation changes). Apps Script integration cost is high (separate deployment per spreadsheet, separate quota envelope, separate auth). Defer until a concrete test in the catalogue actually depends on observing R1C1.

**Document this as a known gap** in the post-coalescing leads inventory so it's resurfaceable.

### D7 — Graph A6/A7/A8 (function-eval / cloud-source / CI-friendly) inclusion ✓ greenlit D7.γ (skip with deferred-but-ready note)

**Question:** add a Microsoft Graph driver path for any of:
- **A6** — `POST /workbook/functions/{name}` (invoke arbitrary Excel function without writing into a cell)
- **A7** — read OneDrive/SharePoint-hosted workbooks without local download
- **A8** — CI-friendly Excel execution (no local Excel install)

**Options:**

- **D7.α — Add Graph as a second Excel driver.** Becomes available when env has Graph auth; complements xlwings driver.
- **D7.β — Add only A8 (CI-friendly) when xlwings is unavailable.** Graph as a fallback, not a complement.
- **D7.γ — Skip all three.** xlwings + local Excel is the established path; CI runs Excel via Mac mini already (per `runner-ops.md`).

**Recommendation: D7.γ for now.** The Mac mini runner already handles CI Excel (per memory + `runner-ops.md`); A8 is not load-bearing. A7 (cloud workbooks) doesn't appear in any current case-file shape — all assay fixtures are local files authored for the catalog. A6 (function-eval primitive) is interesting for *differential* probing (run the same formula across Excel-via-Graph vs Excel-via-xlwings to detect engine-version drift) but that's a future use case, not current.

**Document this as a deferred but ready-to-go path** so the next person evaluating CI Excel or cloud workbook support knows the spec work is done.

### D8 — `RichCell.kind` clarification (gsheets) ✓ greenlit D8.α (D8.β deferred but confirmed load-bearing)

**Question:** the verifier flagged that `RichCell.kind` is a wire/provenance signal but not a complete semantic type (`=""` and `=IF(,,)` map identically). Does the coalesced public output keep `kind` as-is?

**User confirmation 2026-05-23:** D8.α as-is. D8.β (side-channel `disambiguateBlank(coord)` probe firing ISBLANK/ISTEXT) is **deferred to a future pass** — but explicitly acknowledged as **genuinely load-bearing for certain tests**. Track as a known follow-up; reopen when first test depends on the distinction.

**Options:**

- **D8.α — Keep `kind` as-is** with the existing wire-provenance semantics; document the limitation.
- **D8.β — Add a side-channel `disambiguateBlank(coord)` method** that fires an ISBLANK/ISTEXT probe to semantically split null-vs-empty-string when needed.
- **D8.γ — Replace `kind` with a stricter classification** that fires the side-channel probe automatically for every "null"-classified cell.

**Recommendation: D8.α.** The wire-provenance signal is honest about what the REST API exposed. Auto-probing every "null" cell (D8.γ) explodes API call count; on-demand probing (D8.β) is the right shape but doesn't need to be in scope this session. Document `kind` as wire-provenance, leave the side-channel option as a follow-up TODO.

## Canonical coalesced output (D1=A locked)

Definitive shape, with D1.A subdecisions applied:

```typescript
// packages/contracts/src/cell-value.ts (new file; replaces parts of types.ts)

export interface RichCellValue {
  // Shared language — addressable cross-engine via structural-subset matchers
  primitive: PrimitiveValue;
  formula?: string;                                       // formula as engine saw it; dialect details in engine extras (D1.A.4)
  formatted?: string;                                     // display string
  number_format?: { type?: string; pattern?: string };
  hyperlink?: string;                                     // single-link convenience; multi-link / per-run shape lives in engine extras (D1.A.1 vetoed)
  // Engine extras — discriminated union on `platform`, opaque to cross-engine
  engine: ExcelExtras | GSheetsExtras | LatticeExtras
        | HyperformulaExtras | IroncalcExtras | LibreofficeExtras
        | FormulasExtras | PycelExtras;
}

export type PrimitiveValue =
  | { kind: "number"; value: number }
  | { kind: "string"; value: string }
  | { kind: "boolean"; value: boolean }
  | { kind: "error"; sentinel: string }                                       // classic 7-error set
  | { kind: "extended-error"; sentinel: string; error_type?: number }         // cross-engine non-classic (D1.A.3); Excel rich-value family + gsheets LOADING/ERROR/GETTING_DATA/NULL_VALUE
  | { kind: "blank"; reason?: "untouched" | "spill-recipient" | "formula-no-effective" }  // Excel-style decay-through-formula; ALSO gsheets untouched cells (D1.A.2 β)
  | { kind: "null"; reason?: "formula-returned-null" | "spill-null" }                       // gsheets propagatable Null only; Excel never emits this kind (D1.A.2 β)
  | { kind: "rich-text"; collapsed: string };                                 // engine-native run shape lives in engine extras (D1.A.1 vetoed shared)

// Per-engine extras — each engine ships its own; stubs for unaudited engines
// populate only `platform` until per-engine audit lands (Q5).

export interface ExcelExtras {
  platform: "excel";
  data_type?: string;                                     // OOXML t
  is_date?: boolean;
  comment?: { text: string; author: string };
  rich_runs?: Array<{ text: string; format?: Record<string, string> }>;  // openpyxl CellRichText runs — engine-native shape; D1.A.1 vetoed shared text_runs
  raw_xml?: {
    t?: string; s?: number; cm?: number; vm?: number;
    formula_text?: string;
    formula_array_marker?: string;
    formula_array_ref?: string;
    formula_namespaces?: string[];
  };
  modern_error_detail?: {                                 // D9 resolve_vm output
    error_type: number;
    sub_type?: number;
    extras?: Record<string, string>;
  };
  value2?: number | string | boolean | null;             // Surface B bit-accurate raw value (any cell type); error-via-Value2 shape TBD at lift time
  display_format?: Record<string, unknown>;               // Surface B CF overlay
  saved_as_array?: boolean;                               // Surface B
  formula_dialect?: "iie" | "ae";                         // D1.A.4: formula dialect lives here
}

export interface GSheetsExtras {
  platform: "gsheets";
  wire_kind: "number" | "string" | "boolean" | "error"
           | "null" | "spill-null" | "blank";              // D8.α preserved
  raw_api?: ApiCellData;                                   // full Sheets v4 CellData
}

export interface LatticeExtras { platform: "lattice"; /* stub-only; per-engine ground audit deferred per user (controls separate codebase), but Lattice participates in interface migration to keep Driver implementation valid */ }
export interface HyperformulaExtras { platform: "hyperformula"; /* stub; audit-later */ }
export interface IroncalcExtras { platform: "ironcalc"; /* stub */ }
export interface LibreofficeExtras { platform: "libreoffice"; /* stub */ }
export interface FormulasExtras { platform: "formulas"; /* stub */ }
export interface PycelExtras { platform: "pycel"; /* stub */ }

// 2D grid of rich cells; trailing nulls trimmed by drivers
export type RichGridValue = Array<Array<RichCellValue | null>>;

// Backward-compat projection for scalar callers
export function projectPrimitive(rich: RichCellValue): CellValue { /* impl */ }
export function projectScalarGrid(grid: RichGridValue): CellValue[][] { /* impl */ }
```

**Driver interface (Q4 locked: `evaluate()` returns rich directly):**

```typescript
export interface Driver {
  readonly platform: Platform;
  init(): Promise<void>;
  evaluate(formula: string, grid?: Record<string, CellValue>): Promise<RichGridValue>;
  evaluateBatch?(tasks: DriverTask[]): Promise<RichDriverTaskResult[]>;
  versionString(): Promise<string | null>;
  destroy(): Promise<void>;
}
```

Note: `grid?` input parameter stays as `CellValue` (test authors write scalars when setting up grid context); only the output is rich.

**Matcher language extension (D1.A.5 locked: structural subset):**

```yaml
# Cross-engine assertion (primitive-only)
expect:
  primitive: {kind: "number", value: 5}

# Excel-specific assertion via engine extras
overrides:
  excel:
    expect:
      primitive: {kind: "extended-error", sentinel: "#SPILL!"}
      engine:
        platform: "excel"
        modern_error_detail:                # Excel-side rich-value field; named "modern" per Microsoft docs
          sub_type: 1
          extras:
            colOffset: "2"
            rwOffset: "2"

# Rich-text assertion (per-engine — no cross-engine shared shape per D1.A.1 veto)
overrides:
  excel:
    expect:
      primitive: {kind: "rich-text", collapsed: "hello world"}
      engine:
        platform: "excel"
        rich_runs:
          - {text: "hello", format: {b: "1"}}
          - {text: " world"}
```

## Implementation order (post-D1 lock)

All gating decisions locked. Order revised for foundation-first migration:

1. ~~Lock D1 shape~~ ✓ **DONE 2026-05-23.** Candidate A; canonical type spec'd above.
2. **Land contracts.** New file `packages/contracts/src/cell-value.ts` with `RichCellValue` + `PrimitiveValue` + per-engine `*Extras` interfaces + `RichGridValue` + `projectPrimitive` + `projectScalarGrid`. Build contracts (`pnpm --filter @cartularium/contracts run build`) before downstream packages import.
3. **Migrate `Driver` interface.** `evaluate` returns `RichGridValue`; `evaluateBatch` returns `RichDriverTaskResult[]`. Keep `grid?` input as `CellValue` (test authoring stays scalar-ergonomic for input).
4. **Migrate gsheets driver first** (cleanest baseline). All needed fields already captured internally; promotion is mostly mechanical. Validates the contracts shape end-to-end before touching Excel.
5. **Land Surface B lift in Excel** (D5.α). Capture `Value2`/`DisplayFormat`/`SavedAsArray` during the live xlwings pass before save+close (avoids the data-only-read trap). Internal Python `RichCell` first.
6. **Migrate Excel driver** to emit `RichCellValue` with `ExcelExtras` populated (including new Surface B fields + D9 modern_error_detail). Python ↔ TypeScript JSON interchange shape needs verification.
7. **Stub all 6 non-Excel/non-gsheets engines** (formulas / hyperformula / ironcalc / libreoffice / pycel / lattice). Each emits `RichCellValue` with `primitive` populated + minimal engine extras (`{platform: "..."}`). Lattice's per-engine ground audit is deferred (user controls separate codebase), but Lattice participates in interface migration to keep its `Driver` implementation valid — once `evaluate()` returns `RichGridValue`, every driver class must conform or the build breaks.
8. **Extend matcher language** in `src/format/`. `evaluateMatcher`, `gridsEqual`, and `MatcherObject` need structural-subset matching against rich properties. Cross-engine divergence default = `primitive` axis only; tests opt in to rich comparison.
9. **Regenerate fixtures.** All existing fixtures re-run against new rich shape. `src/fixtures.ts` + `src/manifest/build.ts` updated to round-trip `RichCellValue` JSON. (Q3 locked: regenerate, not sidecar.)
10. **Update downstream consumers:**
    - `sheets-wiki-editor` (`ComparisonBody.tsx`, `ResultGrid.tsx`, `format.ts`): rich-cell renderer + scalar-projection fallback.
    - `src/preview/types.ts` + `src/preview.ts`: contract version bumps; rich shape in `AssayPreviewResult.platforms[*].result`.
    - `src/benchmark.ts`, `src/resolutions.ts`, `src/catalogue-site/*`: audit and migrate.
11. **Doc-as-session-record pass.** This doc flips from session prep → session record. Update `driver-surface-leads.md` (Surface B PENDING → LIVE; PARTIAL leads marked "deferred per coalescing session"). Update `cell-value-fidelity-roadmap.md` to point at the new contracts.
12. **(Out of session)** Per-engine ground audit for the 5 stubbed engines. Each produces its own engine-extras specification + follow-up driver migration.

**Estimated total scope:** ~all 8 driver files, ~contracts package, ~runner+matcher+fixtures pipeline, ~sheets-wiki-editor preview UI. Pre-alpha repo so all of it can break-and-fix safely. Step 8 (matcher) is the most subtle — it's the user-facing test authoring API; structural-subset matching needs to compose with existing `MatcherObject` syntax cleanly.

## Open questions for the user

All major decisions locked. Remaining points are inside the implementation:

- **D1.A subdecisions defaulted to leans** (see "Decisions confirmed" section above). User can override before implementation locks them in code.
- **Divergence semantics with rich cells** (flagged in Risks): with `RichCellValue` carrying many properties, "divergence" needs definition. Options: (a) any property differs → divergence; (b) `primitive` differs → divergence (rich properties are diagnostic only); (c) per-test configurable. **Lean: (b) `primitive` is the default divergence axis; tests opt in to richer comparison via the matcher.** Worth confirming when the matcher language extension lands.
- **Scalar projection helper shape** — implementation detail. Likely `projectPrimitive(rich: RichCellValue) → CellValue` for backward-compat callers; might also need `projectScalarGrid(GridValue<RichCellValue>) → CellValue[][]`.

## Implementation log (2026-05-23)

All 10 implementation tasks landed end-of-day 2026-05-23. Build green; 99/99 assay tests + 37/37 contracts tests pass. Downstream packages (sheets-wiki-editor, sheets-wiki) build clean.

### What shipped

**Contracts (`packages/contracts/src/cell-value.ts` — new):**
- `RichCellValue` interface + `PrimitiveValue` discriminated union (β null model: distinct `kind: "blank"` and `kind: "null"`; `extended-error` cross-engine name).
- 8 per-engine `*Extras` interfaces (`ExcelExtras` includes `modern_error_detail`, `value2`, `display_format`, `saved_as_array`, `formula_dialect`, `raw_xml`, `rich_runs`, etc.).
- `RichGridValue = Array<Array<RichCellValue | null>>`.
- `projectPrimitive` / `projectScalarGrid` scalar-projection helpers + `CellValue` / `CellError` types (mirror legacy assay scalar shape).

**Driver interface (`packages/assay/src/drivers/driver.ts`):**
- `Driver.evaluate(...) → Promise<RichGridValue>` (was `Promise<GridValue>`).
- `Driver.evaluateBatch?(...) → Promise<DriverTaskResult[]>` where `DriverTaskResult.result` is `RichGridValue`.
- `grid?` input parameter stays as `CellValue` (test-authoring ergonomics).

**Per-driver state:**
- **gsheets (`src/drivers/gsheets.ts`):** native rich emission. Internal `RichCell` → `richCellToRichValue` → `RichCellValue` with `GSheetsExtras.wire_kind` + `raw_api`. Classic vs extended error discriminated by sentinel.
- **Excel (`python/excel_driver.py` + `src/drivers/excel.ts`):** native rich emission. New Python helpers `_rich_cell_to_json` / `_excel_extras` / `_primitive_from_rich` build the contract shape. **D9 `resolve_vm` is now wired into the production read path** (first time — was helper-only) producing `extended-error` primitive + `modern_error_detail` engine extras. **Surface B** capture (`_capture_surface_b_for_sheet`) runs during the live xlwings pass before save+close; populates `RichCell.surface_b` → emitted as `value2` / `display_format` / `saved_as_array` in JSON output.
- **Other 6 (lattice, hyperformula, ironcalc, libreoffice, formulas, pycel):** minimal stubs via `liftScalarGrid` / `liftTaskResults` helpers in `src/drivers/lift.ts`. Each driver wraps its existing scalar output; primitive populated + `{platform}` engine extras only. Per-engine maximality remains future work.

**Format / matcher (`src/format/`):**
- `MatcherObject` extended with rich-cell structural-subset keys: `primitive`, `engine`, `formula`, `formatted`, `number_format`, `hyperlink`. Plus `PrimitiveMatcher` discriminated union.
- `evaluateMatcher`: detects rich-key matchers vs legacy scalar matchers; rich path walks `RichCellValue` structurally, scalar path projects rich actual to scalar internally (existing scalar matchers continue working unchanged).
- `gridsEqual`: accepts both rich and scalar; projects rich to scalar internally. **Default divergence semantics = primitive axis only** (engine-extras differences do NOT trigger divergence).
- `formatGrid`: handles both shapes via projection.
- Shared `isRichGrid` / `toScalarGridIfRich` utilities in `src/format/types.ts` (replace inline duplicates).

**Fixtures (`src/fixtures.ts`):**
- `FixtureEntry.result` is `RichGridValue`.
- `loadFixture` has a **backwards-compat shim**: detects legacy scalar shape on disk via `isScalarGrid`, lifts via `liftScalarGrid` per-platform. Existing on-disk fixtures stay readable until regen.
- `saveFixture` writes rich JSON directly (no special handling — JSON.stringify works on the shape).

**Runner / generate (`src/runner.ts`, `src/commands/generate.ts`):**
- No more `projectScalarGrid` at fixture boundary — drivers' rich output flows straight into `FixtureEntry.result`.
- Skip placeholders use `liftScalarGrid([[{error:"#N/A"}]], platform)` to produce valid rich shape.
- `TestResult.actual` and `Divergence.results` are `RichGridValue`.

**Consumers (audited; no breaking changes needed):**
- `src/benchmark.ts`: `ConsensusEntry.expected` / `alternates` updated to `RichGridValue`; `gridsAgree` projects to scalar internally.
- `src/resolutions.ts`: `DriftEntry.observed` is `RichGridValue`; `rewriteRecorded` projects to scalar before YAML emit (author-facing surface stays scalar).
- `src/format/classify.ts`: catalogue site classifier projects rich fixture values to scalar before comparison.
- `src/preview.ts`: projects to scalar at the preview wire-format boundary (AssayPreviewPlatformPayload stays scalar). **Rich preview wire format deferred to a future contracts version bump.**
- `packages/sheets-wiki-editor` + `packages/sheets-wiki`: build clean; consume the unchanged scalar preview wire format.

**Tests:**
- 7 new contracts tests for `projectPrimitive` / `projectScalarGrid` (kind handling, grid projection).
- 14 new matcher tests for legacy-against-rich + structural-subset rich + cross-shape `gridsEqual`.
- Existing 85 assay tests + 30 contracts tests untouched, all still pass.

### What's deferred

- **On-disk fixture regeneration.** Code-complete; needs `assay generate` run on Mac mini (Excel + gsheets auth) to materialize rich fixtures. Backwards-compat shim keeps existing scalar fixtures usable in the meantime.
- **Surface B Mac story (empirical finding 2026-05-23 evening + 2026-05-24 refinement).** Tested on chris's Mac mini through the Terminal-bridge wrapper (`open -a Terminal …` for Aqua context + Excel automation permissions).
  - **Bridge-load discovery:** the xlwings Mac bridge (`appscript` over Apple Events) **cannot sustain live Surface B capture at any scale**. Even one bulk `value2.get()` per sheet crashes Excel after 2-3 invocations (`OSERROR -609 "Connection is invalid"` followed by `-600 procNotFound` on subsequent ops). Per-cell `display_format` / `saved_as_array` at 400 cells × N sheets generates 4800+ Apple Events that crash Excel within ~3 sheets. `_capture_surface_b_for_sheet` short-circuits to `{}` when `sys.platform == "darwin"`.
  - **Property-name discovery (kept for the Windows path and for any future Mac bridge):** Mac AppleScript dictionary exposes `value2` (lowercase) + `display_format.number_format` (Windows COM uses CamelCase `Value2` / `DisplayFormat.NumberFormat`). Discovered via `Excel.sdef`. `_api_attr` tries both naming conventions in preferred order; Mac AS values come back as lazy `appscript.Reference` objects requiring explicit `.get()` (skipped on Mac because of the load issue above).
  - **Mac derived path (`_excel_extras` fallback when `surface_b is None`):** evaluation of each Surface B field on Mac:
    - `value2`: REDUNDANT — non-error cells: identical to `primitive.value` (dates already serial-converted via `_value_to_cell`). Error cells: Windows COM returns CVErr variants which we can't reconstruct from Mac data (openpyxl gives the error-string fallback, which doesn't match Windows semantics). **Skipped to avoid duplication + cross-platform mismatch.**
    - `saved_as_array`: DERIVABLE — equivalent to the persisted `<f t="array">` marker, already read by `RawXmlReader` as `raw_xml.formula_array_marker`. **Emitted on Mac when the marker is "array".**
    - `display_format.number_format`: **MAC GAP** — CF overlay requires runtime rule evaluation against cell values. Not derivable from the saved file. Future work; documented below.
  - **Windows path** (live `_capture_surface_b_for_sheet` with all three properties): unchanged but **untested in this environment** (no Windows runner).
  - **Empirical verification 2026-05-24** via `probe-d9-spill.yaml`: the #SPILL! cell emits the full D9 + Mac-derived Surface B shape (`kind: "extended-error"`, `modern_error_detail: {error_type: 8, sub_type: 1, extras: {colOffset: "2", rwOffset: "2"}}`, `saved_as_array: true`, full `raw_xml` block). The blocker cell at AB1 emits `{kind: "number", value: 42}` with no extraneous Surface B noise.
  - **Mac-native CF overlay is now a future-work item.** Alternative bridges: Office.js (`Range.valuesAsJson` is the audit's existing Office.js PENDING lead — Mac-friendly via headless-browser host); bulk-friendly osascript that fetches all CF overlay number-format strings in a single Apple Event; Excel-for-Web JS SDK.
- **D8.β disambiguateBlank()** side-channel for gsheets `=""` vs `=IF(,,)` distinction. Confirmed load-bearing for certain tests; gated on first test that needs it.
- **Rich preview wire format** (`AssayPreviewResultPayload` → v2). Defer until rich preview rendering is a priority; current scalar wire is sufficient for the existing preview UI.
- **Per-engine ground audit** for the 5 stubbed engines (formulas / hyperformula / ironcalc / libreoffice / pycel). Each will grow its own `*Extras` post-audit. Lattice deferred per user direction.
- **Apps Script R1C1 bridge** (D6.β) and **Microsoft Graph driver path** (D7.γ) — confirmed skipped per coalescing decisions; documented as known gaps for future reopening.

### Runner-side full regen + greenfield (2026-05-24)

Executed on chris's Mac mini via the Terminal-bridge wrapper (`open -a Terminal …` for Aqua/automation context). 33 YAML suites × 2 platforms.

**Regen** (`assay generate tests/*.yaml --platform excel,gsheets`):
- excel: 1936/1957 ok + 21 skip in 120.0s
- gsheets: 1952/1952 ok in 131.6s
- Total wall: ~4 minutes
- Exit 0

**Initial `assay run` surfaced 6 failures** — each triaged in this session:
1. **errorType=6 unmapped** (regex/REGEXEXTRACT-no-match × 2 cells). Excel 2024+ emits rich-value errorType=6 (UI displays as `#N/A`) for REGEXEXTRACT-no-match. MS-XLSX 29.1 marked 0-3/5-7/15-16 as "reserved/unallocated" — spec is outdated. Added `6: "#N/A"` to `_RICH_VALUE_ERROR_TYPE_MAP` with empirical-discovery comment.
2. **FILTER-returns-no-rows expects `#VALUE!`, Excel actually returns `#CALC!`** (spill-edge.yaml). Pre-coalescing the old driver read openpyxl's `#VALUE!` fallback for unknown modern errors; the D9 wire-in correctly surfaces `#CALC!` as the real Excel modern-error code. Updated `expect: {error: "#CALC!"}`.
3. **SPLIT-empty-tokens gsheets middle = null vs ""** (text-longtail.yaml). gsheets wire format ambiguates empty-string and null; without D8.β disambiguateBlank the driver projects to null. Added gsheets override with `recorded: [[a, null, b]]` + note pointing at D8.β as the resolver.
4. **probe-d9-spill.yaml × 2 cells** — the D9 verify-the-wire probe I added wasn't a catalog test; removed it (probe served its purpose).

**Post-fix re-regen + re-run:** 1955 tests, 2711 passed, **0 failed**, 1194 recorded, 277 divergences. Full greenfield.

### Verification artifacts

Future agents picking up here can verify by:

1. Build green: `pnpm --filter @cartularium/contracts test` (37/37), `pnpm --filter assay test` (99/99).
2. Local Excel xlsx file output matches contract (regen any suite via `assay generate tests/<suite>.yaml --platform excel` — requires Mac Terminal context for Apple Events; OR run on Windows where xlwings COM works directly).
3. D9 wire-in: regen any test producing a modern error (e.g. anything `#SPILL!` / `#CALC!` / `#FIELD!`). Inspect fixture for `primitive.kind: "extended-error"` + `engine.modern_error_detail.{error_type, sub_type, extras}`.
4. Mac Surface B derived path: any cell with `<f t="array">` should show `engine.saved_as_array: true`. `value2` should NOT appear on Mac (intentionally omitted as redundant with primitive).
5. Cross-engine matcher: `assay run --platform excel,gsheets` should show ~0 false-positive divergences (gridsEqual is primitive-axis default; only real semantic disagreements register).

## Pickup for the next session

Prioritized open work after the coalescing session closes. Each item is scoped + names where to start.

### High value, well-scoped

- **D8.β `disambiguateBlank()` side-channel probe (gsheets).** ✅ **Shipped 2026-05-30 (PR #32).** Implemented as a lazy ISBLANK probe on an ambiguous-blank set per chunk; `false` recovers `{string,""}`, `true` promotes to a null primitive; `GSheetsExtras.semantic_null` records the verdict. The SPLIT-empty-tokens test fix in this session added a gsheets override because the wire format ambiguates `""` vs `null`. D8.β would resolve via ISBLANK/ISTEXT probes injected during the read pass. Likely structure: after `spreadsheetsGetRich`, find all cells classified as `wire_kind: "blank"` or `"null"` with no formula, batch a single `setCellContents` with `=ISBLANK(AA1)`, `=ISBLANK(AB1)`, ... at temp cells, read back, populate a `semantic_null: bool` on `GSheetsExtras` and tighten the `primitive.kind` accordingly. Quota implication is one extra API round trip per chunk. Test that flips from override → primary-match: `tests/text-longtail.yaml#split-empty-tokens` (currently gsheets-override with `recorded: [[a, null, b]]`).

- **Mac CF overlay for Surface B `display_format.number_format`.** ✅ **Decided 2026-05-30: documented as a known limitation, not implemented (see below).** `display_format.number_format` is the number format *after* conditional formatting is applied; it diverges from the cell's base `number_format` (already captured via openpyxl, surfaced as `engine.number_format`/`pattern`) **only** when a CF rule carries a number-format `dxf` whose condition evaluates true for that cell. Conditional formatting that changes a *number format* (rather than fill/font/border) is itself rare, and **no formula-fidelity test in the corpus sets up conditional formatting at all** — so for every current test this field is strictly redundant with the base `number_format`, including on the Windows path that does capture it. On Mac the live `.api` read is additionally blocked by the AppleEvents bridge crash (`_capture_surface_b_for_sheet` short-circuits to `{}` on Darwin). Net: closing the Mac gap adds zero signal until a test actually exercises a CF number-format overlay. **Revisit only when such a test exists**; the candidate implementation paths at that point:
  - **osascript bulk fetch**: write a single AppleScript that returns `display_format.number_format` for every cell in the SPILL region in one Apple Event. Risk: AppleScript syntax for grid-style "give me a list of N values" is awkward, and the bridge volume that crashed `_capture_surface_b_for_sheet` might still apply.
  - **Office.js host**: the audit's existing high-priority PENDING lead (`Range.valuesAsJson`). Office.js runs in-process inside Excel for Web / a headless add-in host and exposes the full 15-variant CellValue. Would give Mac CF overlay + a lot more besides.
  - **CF rule re-computation from saved file**: read `xl/worksheets/sheet*.xml` `<conditionalFormatting>` blocks via `RawXmlReader`, evaluate the rules against cell values, derive the overlay. Doesn't need Excel running. Complex (CF DSL is rich) but engine-version-stable.

- **Windows Surface B verification.** `_capture_surface_b_for_sheet` Windows path landed but untested without a Windows runner. When/if a Windows runner is available: regen any small suite (e.g. `tests/arithmetic.yaml`) with `--platform excel` and confirm `engine.value2` / `engine.display_format` / `engine.saved_as_array` populate from the live `.api.Range.*` calls.

- **errorType=6 confirmation.** The session added `6: "#N/A"` empirically (Excel 2024+ REGEXEXTRACT-no-match displays as `#N/A`). Worth cross-checking via the Excel UI on a fresh fixture — open the regenerated `fixtures/regex/excel.json` source workbook in Excel and confirm the displayed sentinel matches. If wrong, update the mapping. Also worth: re-running an extended-error sweep when new Excel functions land (Excel 2024+ adds new modern errors faster than the MS-XLSX spec updates).

### Medium value, larger scope

- **Per-engine ground audit for the 5 stubbed open-source engines** (formulas / hyperformula / ironcalc / libreoffice / pycel). Each currently emits minimal stubs via `liftScalarGrid`. Per-engine audit identifies what state the engine internally tracks vs what the driver currently captures; the delta becomes new `*Extras` fields. Lattice deferred per user (sibling codebase). Per leads inventory's "Per-engine ground audit" note; do one at a time.

- **Schema unification across engines.** The original "downstream of coalescing" item. Now that each engine has its own `RichCellValue` shape with engine-tagged extras, decide how cross-engine matchers reconcile semantically-overlapping concepts (e.g. Excel `modern_error_detail` vs a hypothetical libreoffice rich-error equivalent). Adds a "semantic family" layer above the per-engine extras. Probably starts with a separate design doc.

### Operational / housekeeping

- **Auditor review feedback.** This session ended with an auditor review in flight; if findings come back, triage them against the doc + migration code.

- **Runner-side rsync ergonomics.** This session used in-place rsync over the runner's git checkout, which left the runner's working tree dirty. For a less ad-hoc workflow: push migration commits to a branch on origin, runner does `git fetch + git checkout <branch>`, run, commit/PR. Especially worth doing if multiple agents need to iterate on the runner over time.

- **Terminal-bridge wrapper as a runner utility.** The `open -a Terminal /path/to/wrapper.command` pattern (see `~/cartularium-runner/run-*.command` files staged this session) is the way to invoke Apple-Events-requiring commands from non-Aqua SSH contexts. Worth promoting to a reusable helper in `runner-ops.md`. Pattern: SSH stages a `.command` script + log/sentinel paths; `open -a Terminal` kicks it; SSH polls the sentinel from the local box.

### Reference: artifact map (post-coalescing)

| What | Where |
|---|---|
| Canonical type | `packages/contracts/src/cell-value.ts` |
| Per-engine extras | Same file, `ExcelExtras`/`GSheetsExtras`/etc. |
| Mac Surface B derived path | `packages/assay/python/excel_driver.py` `_excel_extras` Mac branch |
| Matcher rich extensions | `packages/assay/src/format/match.ts` `matchRichCell`, `matchPrimitive`, `matchStructuralSubset` |
| Fixture load-time shim | `packages/assay/src/fixtures.ts` `isScalarGrid` + `liftScalarGrid` on read |
| D9 modern-error map | `packages/assay/python/excel_driver.py` `_RICH_VALUE_ERROR_TYPE_MAP` |
| Test fixes from triage | `tests/spill-edge.yaml` (FILTER `#CALC!`), `tests/text-longtail.yaml` (SPLIT gsheets override) |
| Implementation log + runner verification | This doc, sections above |

## Session metadata

- **Date:** 2026-05-23
- **Author context:** picked up immediately after verifier pass landed; both Excel + gsheets drivers re-read; consumer-side check completed (`src/runner.ts`, `src/preview/types.ts`, full grep of `CellValue`/`GridValue` consumers).
- **2026-05-23 reframe:** user expanded D1 from "delivery mechanism for existing scalar shape + side-channel rich data" to "redesign `CellValue` entirely." D4 collapsed into D1 as symptomatic. The whole cross-engine cell-value contract is in scope, and is "load-bearing for the rest of the project" (user's words). D2/D3/D5/D6/D7/D8 confirmed at the same time.
- **Out of scope (still):** schema unification across engines (downstream of all per-engine coalescing); per-engine ground audits for the 5 unaudited open-source engines (separate work each); Lattice per-engine ground audit (user controls separate codebase). **Lattice DOES participate in the interface migration** — see step 7 — only the per-engine maximality audit is deferred.
- **Risks worth flagging:**
  - Migration is **cross-package**: `packages/assay/`, `packages/contracts/`, `packages/sheets-wiki-editor/`. Per CLAUDE.md `@cartularium/contracts` must be rebuilt before consumers see new types.
  - Matcher language extension is the user-facing test authoring API — changes to `MatcherObject` shape touch every test suite YAML. Need a clear migration path (parallel matcher syntaxes during transition? or one-shot migration?).
  - Surface B lift requires xlwings to read live cell `.api` properties; if a cell is *cached* (data-only read after save), `.api.Range` may not exist. Need to either (a) capture B during the live xlwings pass before save+close, or (b) re-open the workbook for a second xlwings pass. (a) is cheaper; (b) is closer to the post-save state Excel actually persists.
  - The runner currently does `gridsEqual` for divergence detection (scalar comparison). With rich cells, divergence detection becomes per-property — multiple engines can agree on `primitive` but disagree on `engine.*.modern_error_detail.sub_type`. Need to decide what counts as "divergence" semantically (any property? primitive-only? user-configurable per test?).
