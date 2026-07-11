# HSTACK / VSTACK / SORT / TOCOL / TOROW / WRAPCOLS / WRAPROWS — cross-engine deep dive

**Batch:** arrays · **Refs:** HSTACK/hstack, VSTACK/vstack, SORT/sort-array, TOCOL/tocol-2x2-scan-by-column, TOCOL/tocol-2x2-scan-by-row, TOCOL/tocol-ignore-blanks, TOCOL/tocol-row, TOROW/torow-2x2-scan-by-column, TOROW/torow-2x2-scan-by-row, TOROW/torow-col, TOROW/torow-ignore-blanks, WRAPCOLS/{basic,exact-fit,single-col,with-pad}, WRAPROWS/{basic,exact-fit,single-row,with-pad} · **Confidence:** high

## Behavior summary

These are the modern Excel/Google-Sheets dynamic-array construction and reshape functions:
HSTACK/VSTACK concatenate arrays horizontally/vertically; SORT orders an array; TOCOL/TOROW
flatten a 2-D array into a single column/row; WRAPCOLS/WRAPROWS fold a vector into a 2-D grid of
a given height/width. Excel, Google Sheets, Lattice, and the `formulas` npm library all implement
this family and agree on the spilled result (shape and values). The divergence in every case is an
**availability** split, not a semantics split: HyperFormula, IronCalc, and pycel do not implement
any of these names.

## Divergences

Every ref in this group has the same three-branch shape. Representative case `=HSTACK(1, 2, 3)`:

| Engine                                  | Result                                                           |
| --------------------------------------- | ---------------------------------------------------------------- |
| Excel, Google Sheets, Lattice, formulas | `[[1, 2, 3]]` (values, correct shape)                            |
| HyperFormula, IronCalc, pycel           | `#NAME?`                                                         |
| LibreOffice                             | `blank` — recording artifact (see INDEX-libreoffice-artifact.md) |

Cause bucket: **missing-function** for the `#NAME?` branch. Live-probe confirmation (HyperFormula,
IronCalc, pycel) returned `#NAME?` for `SEQUENCE(2,3)`, `HSTACK(1,2,3)`, `VSTACK(1,2,3)`,
`SORT({3;1;2})`, `TOCOL({1,2;3,4},0,TRUE)`, `TOROW({1,2;3,4},0,FALSE)`, `WRAPCOLS({1,2,3,4},2)`,
`WRAPROWS({1,2,3},2,"x")` — a uniform absence across the whole family. `formulas` returned the
spilled arrays and matched Excel/gsheets shape and order.

Note the FREQUENCY/frequency-inline ref rides in the same missing-function annotation (its inline
`{...}` array form spills 3 rows in Excel/gsheets/Lattice/formulas and is `#NAME?` in
HyperFormula/IronCalc/pycel). FREQUENCY's _range-based_ cases and its LibreOffice **shape**
quirk are already catalogued in DV-0003/DV-0051/DV-0084; the inline form is the uncovered fork.

## Edges explored beyond the corpus

Probed live on `formulas` (the pure engine that implements the family) with HyperFormula as the
absent contrast:

| Formula                                     | formulas result    | Meaning                                   |
| ------------------------------------------- | ------------------ | ----------------------------------------- |
| `=WRAPROWS({1,2,3}, 2)` (no pad)            | `[[1,2],[3,#N/A]]` | default pad_with is **#N/A**, not blank/0 |
| `=WRAPCOLS({1,2,3}, 2)` (no pad)            | `[[1,3],[2,#N/A]]` | same default pad                          |
| `=TOCOL({1,2;3,4})` (default scan)          | `[1;2;3;4]`        | default scan is **by row** (row-major)    |
| `=TOROW({1,2;3,4})` (default scan)          | `[1,2,3,4]`        | row-major default                         |
| `=TOCOL({1,2;3,4},0,TRUE)` (scan_by_column) | `[1;3;2;4]`        | the 3rd arg TRUE switches to column-major |
| `=SORT({3;1;2}, 1, -1)`                     | `[3;2;1]`          | descending sort supported                 |
| `=HSTACK({1;2},{3;4})`                      | `[[1,3],[2,4]]`    | 2-D horizontal stack                      |
| `=VSTACK({1,2},{3,4})`                      | `[[1,2],[3,4]]`    | 2-D vertical stack                        |

HyperFormula returned `#NAME?` for every one of these — confirming the family is entirely absent,
including the default-argument forms.

The corpus's `tocol-2x2-scan-by-column` vs `-by-row` pair captures exactly this scan_by_column
toggle: `TOCOL({1,2;3,4},0,TRUE)` = `[1;3;2;4]` (column-major) while `...,FALSE)` = `[1;2;3;4]`
(row-major). Excel/gsheets/Lattice/formulas all agree.

## Wiki-facing notes

- HSTACK, VSTACK, SORT, TOCOL, TOROW, WRAPCOLS, WRAPROWS are **not available in HyperFormula,
  IronCalc, or pycel** — a formula using them returns `#NAME?` there. Portable only across
  Excel / Google Sheets / Lattice (and the `formulas` JS library).
- WRAPCOLS/WRAPROWS default `pad_with` is **#N/A** when the source vector does not exactly fill the
  grid; supply the 3rd argument to pad with something else (e.g. `"x"`).
- TOCOL/TOROW default to **row-major** scan order; pass the `scan_by_column` (3rd) argument `TRUE`
  to read column-major.

## Open questions

- Excel/gsheets default-pad and scan-order for WRAPROWS/TOCOL are inferred from `formulas` +
  vendor docs; probe arrays-004 requests live Excel/gsheets confirmation that the default pad is
  #N/A (not blank).
- The LibreOffice `blank` branch is a capture artifact, not real behavior — needs a LibreOffice
  re-record of the arrays/array-longtail suites (see INDEX-libreoffice-artifact.md).
