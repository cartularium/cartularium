# SHEET — cross-engine deep dive

**Batch:** lookup · **Refs:** SHEET/sheet-by-name-string, SHEET/sheet-invalid-name, SHEET/sheet-no-arg, SHEET/sheet-self-ref · **Confidence:** medium

## Behavior summary

`SHEET([value])` returns the 1-based index of a sheet within the workbook. With no argument it returns the
index of the sheet containing the formula; with a text argument it returns the index of the sheet of that
name; with a reference it returns the index of the sheet the reference points to. It is a workbook-
introspection function (`features: external-io` in the corpus), so its numeric answer depends on workbook
structure that the assay harness supplies differently across engines. That environment-dependence, not a
disagreement about the algorithm, drives most of the split.

## Divergences

| ref / formula                                | gsheets | hyperformula | ironcalc | formulas | pycel    |
| -------------------------------------------- | ------- | ------------ | -------- | -------- | -------- |
| `=SHEET("Sheet1")` (sheet-by-name-string)    | `1`     | `#N/A`       | `1`      | `#NAME?` | `#NAME?` |
| `=SHEET("NoSuchSheet")` (sheet-invalid-name) | `#REF!` | `#N/A`       | `#N/A`   | `#NAME?` | `#NAME?` |
| `=SHEET()` (sheet-no-arg)                    | `4`     | `1`          | `1`      | `#NAME?` | `#NAME?` |
| `=SHEET(A1)` (sheet-self-ref)                | `35`    | `1`          | `#N/A`   | `#NAME?` | `#NAME?` |

Three mechanisms:

1. **formulas, pycel** — SHEET not implemented → `#NAME?` in every case (missing-function).
2. **hyperformula, ironcalc** — implemented in a single-sheet context. `SHEET()` → `1` on both.
   `SHEET("Sheet1")` → `1` on ironcalc but `#N/A` on hyperformula (name resolution differs).
   `SHEET(A1)` → `1` on hyperformula, `#N/A` on ironcalc. Unknown names → `#N/A`.
3. **gsheets** — runs in the assay harness's many-sheet workbook, so it returns real positional indices
   that reflect where the formula and its argument physically land: `SHEET()` → `4`, `SHEET(A1)` → `35`,
   `SHEET("Sheet1")` → `1`, and `SHEET("NoSuchSheet")` → `#REF!` for an unresolvable name.

Cause bucket: **arg-semantics** — introspection value depends on argument resolution plus workbook
environment. The gsheets numbers `4` and `35` are harness-context artifacts, **not** a claim about SHEET's
algorithm.

## Edges explored beyond the corpus

Live probe (`scratch/lookup-probe1.mts`) confirmed the pure-engine branches: formulas/pycel `#NAME?`;
hyperformula `SHEET()`=1, `SHEET(A1)`=1, `SHEET("Sheet1")`=`#N/A`, `SHEET("NoSuchSheet")`=`#N/A`; ironcalc
`SHEET()`=1, `SHEET(A1)`=`#N/A`, `SHEET("Sheet1")`=1, `SHEET("NoSuchSheet")`=`#N/A`. Note the pure-engine
harness is single-sheet, which is why `SHEET()` = 1 there but 4 on the many-sheet gsheets recording.

## Wiki-facing notes

- SHEET is **not portable** to formulas or pycel (both `#NAME?`).
- Even among implementers the _numeric result_ of SHEET depends entirely on the number and order of sheets
  in the workbook — do not treat an assay-recorded SHEET index as a semantic constant.
- Error handling for a bad sheet name diverges: gsheets → `#REF!`, hyperformula/ironcalc → `#N/A`.
- hyperformula and ironcalc disagree on `SHEET("Sheet1")` and `SHEET(A1)`: authors relying on name-based
  or reference-based SHEET lookups will see engine-specific `#N/A`.

## Open questions

- The gsheets `4` / `35` values are harness-context dependent. A controlled single-sheet live run
  (`=SHEET()`, `=SHEET(A1)`, `=SHEET("Sheet1")`, `=SHEET("NoSuchSheet")` in a 1-sheet workbook) is needed
  to pin gsheets' true baseline semantics and confirm `#REF!` for unknown names (probe lookup-007).
