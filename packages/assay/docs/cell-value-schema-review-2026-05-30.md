# Cell-value schema review — 2026-05-30

A maintainer's-eye review of where the `RichCellValue` schema actually stands:
the contract, what gets tested, and the gap between the two. Grounded in
`packages/contracts/src/cell-value.ts`, the matcher (`src/format/match.ts`),
and the fixture corpus as it really is (empirical survey, 31 suites × 8
platforms).

Companion to [`cell-value-fidelity-roadmap.md`](./cell-value-fidelity-roadmap.md)
(the design forks) and [`driver-surface-coalescing-2026-05-23.md`](./driver-surface-coalescing-2026-05-23.md)
(the D1.A locks + implementation log).

## TL;DR

The migration is **done and clean — for `excel` and `gsheets`.** The contract
faithfully reflects the design (Fork 1–4 + D1.A.1–5 all shipped and
conformant). But: **6 of 8 engines carry no rich signal**, the rich data is
**almost entirely diagnostic-only** (never asserted, never diverges), and a
real slice of the contract is **dead in practice**. The question isn't "is the
schema right" — it's "is the richness earning its keep, and where's the next
leverage."

---

## Part 1 — `RichCellValue` anatomy

Every cell a driver returns is a `RichCellValue`. Three layers:

```
RichCellValue = {
  primitive,        // (1) the discriminated value  — the tested spine
  formula?,         // (2) shared cross-engine fields — capturable everywhere
  formatted?,
  number_format?,
  hyperlink?,
  engine,           // (3) per-engine extras         — diagnostic-only
}
```

### (1) `primitive` — the discriminated union

```
PrimitiveValue =
  | { kind: "number",         value: number }
  | { kind: "string",         value: string }
  | { kind: "boolean",        value: boolean }
  | { kind: "error",          sentinel }                 // classic 7: #DIV/0! #N/A #NAME? #NULL! #NUM! #REF! #VALUE!
  | { kind: "extended-error", sentinel, error_type? }    // non-classic: #SPILL! #CALC! gsheets #ERROR! …
  | { kind: "blank",          reason? }                  // Excel-style cell-state; reason ∈ untouched|spill-recipient|formula-no-effective
  | { kind: "null",           reason? }                  // gsheets propagatable runtime Null; reason ∈ formula-returned-null|spill-null
  | { kind: "rich-text",      collapsed }                // rich runs in engine extras; collapsed is the plain string
```

The **β null model** is the subtle part: `blank` and `null` are *distinct
kinds*. Excel never emits `null` (it has no Null type — empty cell ≡ empty
string); gsheets emits `null` for a runtime Null that survives formula
evaluation. This is the only place the schema encodes a genuine
platform-semantics difference rather than a driver limitation.

### (2) Shared cross-engine fields

`formula` (as the engine saw it, no leading `=`), `formatted` (display
string), `number_format` (`{type?, pattern?}`), `hyperlink`. These are
"shared" in that *any* engine could fill them — they're the common vocabulary
above the primitive.

### (3) `engine` — per-platform extras (discriminated on `platform`)

`ExcelExtras` (`data_type`, `is_date`, `raw_xml`, `modern_error_detail`,
`value2`/`display_format`/`saved_as_array` Surface B, `rich_runs`, `comment`,
`formula_dialect`), `GSheetsExtras` (`wire_kind`, `semantic_null`, `raw_api`),
and 6 minimal stubs (`{platform}` only). This is where platform-specific
fidelity lives so the shared spine stays clean.

### Projection — `projectPrimitive`

The bridge back to the legacy scalar `CellValue`:

```
number/string/boolean → value
error/extended-error  → { error: sentinel }
blank/null            → null
rich-text             → collapsed
```

`projectScalarGrid` maps it over a grid. This is how the rich shape stays
backward-compatible with every scalar consumer.

---

## Part 2 — The shared spine that gets tested

Two testing paths, and they touch very different amounts of the schema.

### Default path: the **primitive axis** (scalar projection)

`gridsEqual` / `cellsEqual` (divergence detection) and legacy scalar matchers
**project to scalar via `projectPrimitive` first**. So by default the *only*
thing that drives a divergence or a scalar match is the primitive, collapsed:

```
driver → RichCellValue → projectPrimitive → CellValue → cellsEqual / divergence
```

`formula`, `formatted`, `number_format`, `hyperlink`, and **all** engine extras
are discarded here — they never trigger a divergence. This is the locked
"primitive-axis-only divergence" decision (D1). It means the tested spine is,
in practice, **the primitive collapsed to a scalar.**

### Opt-in path: the structural-subset rich matcher

A test can assert on rich fields by using any of the rich matcher keys
(`match.ts`): `primitive`, `engine`, `formula`, `formatted`, `number_format`,
`hyperlink`. `matchPrimitive` checks `kind` (required) plus optional `value` /
`sentinel` / `error_type` / `reason` / `collapsed`. `matchStructuralSubset`
deep-matches only the keys the author lists, so `{ engine: { modern_error_detail:
{ sub_type: 1 } } }` asserts just that one nested field.

This is the *only* way the shared fields and engine extras get tested — and the
corpus barely uses it (a handful of blank/null and extended-error cases).

### Worked example

A gsheets `=1+1` cell:
```jsonc
{ "primitive": { "kind": "number", "value": 2 },
  "engine": { "platform": "gsheets", "wire_kind": "number", "raw_api": { … } },
  "formula": "1+1", "formatted": "2" }
```
- Default: `projectPrimitive` → `2`; divergence/scalar-match see `2`.
- The `formula`, `formatted`, `wire_kind`, `raw_api` ride along untested unless
  a matcher names them.

An excel `#SPILL!` cell shows the rich axis at work:
```jsonc
{ "primitive": { "kind": "extended-error", "sentinel": "#SPILL!", "error_type": 8 },
  "engine": { "platform": "excel",
    "modern_error_detail": { "error_type": 8, "sub_type": 1, "extras": { "colOffset": "0", "rwOffset": "2" } },
    "saved_as_array": true, "raw_xml": { … } } }
```
- Default: `projectPrimitive` → `{ error: "#SPILL!" }`.
- Opt-in: a test can assert `engine.modern_error_detail.sub_type === 1`.

---

## Part 3 — State of the world (empirical)

**Only `excel` + `gsheets` emit `RichCellValue`.** The other six engines still
hold **legacy scalar fixtures on disk** — the migration lifted the *drivers*
but only regenerated excel/gsheets fixtures; the load-shim lifts the rest to
`{platform}`-only minimal extras at read time.

Cell counts / shape:

| platform | non-null cells | shape on disk |
|---|---|---|
| excel | 2406 | RichCellValue |
| gsheets | 2455 | RichCellValue |
| lattice | 2453 | legacy scalar |
| formulas | 2270 | legacy scalar (+12 nested-array `[["résumé"]]` cells — likely a bug) |
| hyperformula | 2137 | legacy scalar |
| ironcalc | 1925 | legacy scalar |
| pycel | 1925 | legacy scalar |
| libreoffice | **4** | legacy scalar (effectively a non-participant) |

Primitive-kind histogram (rich engines only):

| | number | string | boolean | error | extended-error | blank | null |
|---|---|---|---|---|---|---|---|
| excel | 1586 | 278 | 169 | 354 | 7 | 12 | 0 |
| gsheets | 1687 | 324 | 233 | 201 | 2 | 0 | 8 |

**Dead in practice:**
- `primitive.kind: "rich-text"` — 0 cells anywhere.
- Excel `comment`, `rich_runs`, `value2`, `display_format`, `formula_dialect` —
  never populated (Surface B Mac-disabled by design; rich-text/comment untested).
- `formatted` is gsheets-only (excel emits none); `hyperlink` is 2 cells, both
  gsheets.

**The richness is diagnostic-only:** divergence is primitive-axis, and the
corpus has almost no rich assertions. The schema is *captured* but barely
*tested against*.

---

## Part 4 — Open schema decisions

| Tension | State | The call |
|---|---|---|
| `number_format` typing | Loose `{type?, pattern?}`; gsheets sets the typed enum, excel sets `pattern` only — never reconciled | Keep loose, or tighten to a typed enum the excel driver infers? |
| Engine-matcher soundness | `matchStructuralSubset` doesn't check the `platform` discriminant (`match.ts:216`, `as unknown as Record`) — a `{engine:{…}}` matcher can match the wrong platform | Real bug if engine assertions get used; cheap to gate on `platform` |
| `formatted` asymmetry | Excel emits no display string at all | Should the excel driver populate it (parity + a real display-divergence axis)? |
| Structured types (Linked Data Types / Smart Chips / CUBE) | Unmodeled; per-engine-extras-only, deferred | Largest unmodeled cell-value class; still OK to defer |
| Cross-engine "semantic family" | Deferred; primitive-axis divergence sidesteps it | Only needed once engine-extras assertions matter cross-engine |

**Data-quality quirks:** `formulas` nested-array cells (`[["résumé"]]`); excel
`blank` cells carry `data_type:"str"`; 21 excel error cells lack
`data_type`/`raw_xml`; `libreoffice` essentially un-run.

---

## Part 5 — Strategic fork

Roughly mutually-exclusive directions for "next":

- **Deepen** — lift the 6 engines / per-engine audits. More cross-engine rich
  signal. *(Currently deferred by maintainer.)*
- **Exercise** — add tests that assert on rich fields (number_format,
  extended-error detail, blank/null reason) + fix the engine-matcher soundness
  bug. Turns the schema from "captured" into "tested." Lowest cost, highest
  "does this matter" payoff.
- **Consolidate** — schema-tightening pass: prune/justify dead fields, decide
  `number_format` typing, resolve the `formatted` asymmetry. Pays down the
  contract-vs-reality gap.

**Lean: Exercise → Consolidate.** Prove the rich axis is worth it with a few
real assertions (and fix the matcher soundness gap), then tighten the contract
where the data shows it's loose or dead.
