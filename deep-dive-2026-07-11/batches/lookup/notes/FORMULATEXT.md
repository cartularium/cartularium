# FORMULATEXT — cross-engine deep dive

**Batch:** lookup · **Refs:** FORMULATEXT/formulatext-of-formula-cell, FORMULATEXT/formulatext-of-value-cell, FORMULATEXT/formulatext-of-empty, FORMULATEXT/formulatext-sum-formula · **Confidence:** medium

## Behavior summary

`FORMULATEXT(reference)` returns the source formula text of the referenced cell as a string, or `#N/A`
when the cell holds no formula (a plain value or empty). It is a workbook-introspection function
(`features: external-io`), so its result depends on whether the referenced cell actually contains a _live
formula_ — a condition the assay harness, which mostly seeds cell _values_, does not reproduce uniformly
across engines.

## Divergences

| ref                         | referenced cell    | formulas | pycel    | gsheets | hyperformula    | ironcalc        |
| --------------------------- | ------------------ | -------- | -------- | ------- | --------------- | --------------- |
| formulatext-of-formula-cell | `A1 = =1+2`        | `#NAME?` | `#NAME?` | `#N/A`  | `"=1+2"`        | `"=1+2"`        |
| formulatext-sum-formula     | `B1 = =SUM(A1:A2)` | `#NAME?` | `#NAME?` | `#N/A`  | `"=SUM(A1:A2)"` | `"=SUM(A1:A2)"` |
| formulatext-of-value-cell   | `A1 = 42`          | `#NAME?` | `#NAME?` | `#N/A`  | `#N/A`          | `#N/A`          |
| formulatext-of-empty        | `A1` empty         | `#NAME?` | `#NAME?` | `#N/A`  | `#N/A`          | `#N/A`          |

Two layers:

1. **formulas, pycel** — FORMULATEXT not implemented → `#NAME?` in every case (missing-function).
2. Among implementers, the result tracks whether the referenced cell holds a live formula:
   - **hyperformula, ironcalc** return the formula text on the formula-seeded cases (`"=1+2"`,
     `"=SUM(A1:A2)"`) and `#N/A` on the value/empty cases — i.e. they preserve the seeded formula.
   - **gsheets** returns `#N/A` on _all four_, including the formula cases, because the gsheets recording
     harness seeds A1/B1 as **values**, so from gsheets' perspective the cell has no formula.

The gsheets-vs-hyperformula/ironcalc split on the two formula-cell cases is therefore partly a **seeding
artifact**: the engines were not all given a live formula in the referenced cell. Cause bucket:
**missing-function** for the formulas/pycel branch; the remaining split is an external-io/seeding effect.

## Edges explored beyond the corpus

Pure-engine probe cannot seed a live formula through the scalar grid (a `"=1+2"` grid entry is ingested as
the string `"=1+2"`). In that probe hyperformula/ironcalc returned the string `"=1+2"` — i.e. they echoed
the string content, not a genuine formula readout — while formulas/pycel returned `#NAME?`. This confirms
only the missing-function branch; the formula-vs-value distinction for gsheets needs a live run.

## Wiki-facing notes

- FORMULATEXT is **not portable** to formulas or pycel (`#NAME?`).
- Whether FORMULATEXT returns text or `#N/A` depends on the referenced cell holding a _live formula_, not a
  value that merely looks like one. Engines and import pipelines that flatten formulas to values will make
  FORMULATEXT return `#N/A` — a real-world portability hazard for round-tripped workbooks.
- Do not read the corpus gsheets `#N/A` as "gsheets can't do FORMULATEXT"; it reflects the value-seeding
  harness. gsheets does implement FORMULATEXT.

## Open questions

- Live gsheets run with A1 genuinely containing `=1+2` as a formula (probe lookup-002) to confirm gsheets
  returns the formula text there.
- Live Excel reference for `=FORMULATEXT(A1)` over a formula cell vs a value cell (probe lookup-003) to
  anchor the hyperformula/ironcalc comparison.
