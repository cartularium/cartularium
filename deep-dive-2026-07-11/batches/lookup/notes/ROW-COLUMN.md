# ROW / COLUMN — cross-engine deep dive

**Batch:** lookup · **Refs:** COLUMN/column-range-first-col, ROW/row-range-first-row, COLUMN/column-no-arg, plus the artifact-only refs COLUMN/column-a1, COLUMN/column-c1, COLUMN/column-z1, ROW/row-a1, ROW/row-a5, ROW/row-c10, ROW/row-no-arg · **Confidence:** high

## Behavior summary

`ROW([ref])` / `COLUMN([ref])` return the row / column number of a reference (or of the formula's own cell
when the argument is omitted). Single-cell and no-argument scalar cases are unanimous across all evaluating
engines. Two things produce forks: a genuine **shape** divergence when the argument is a multi-cell range,
and two harness artifacts (libreoffice blank; a cell-placement difference on the no-arg case).

## Divergences

### `=COLUMN(D2:F4)` and `=ROW(B7:D9)` — range argument (shape)

Passing a multi-cell range. Dynamic-array engines spill the full vector of column/row numbers; legacy
engines collapse to the first scalar.

| engine       | `=COLUMN(D2:F4)` | `=ROW(B7:D9)` | mechanism                    |
| ------------ | ---------------- | ------------- | ---------------------------- |
| excel        | `[4,5,6]`        | `[7;8;9]`     | spills the array (reference) |
| formulas     | `[4,5,6]`        | `[7;8;9]`     | spills the array             |
| lattice      | `[4,5,6]`        | `[7;8;9]`     | spills the array             |
| gsheets      | `4`              | `7`           | returns first scalar         |
| hyperformula | `4`              | `7`           | returns first scalar         |
| ironcalc     | `4`              | `7`           | returns first scalar         |
| pycel        | `4`              | `7`           | returns first scalar         |
| libreoffice  | _blank_          | _blank_       | recording artifact           |

Cause bucket: **shape**. This is the same mechanism DV-0249 recorded for hyperformula under different test
names (`row/column-over-range-returns-array`); these two refs extend it to gsheets, ironcalc, and pycel on
the `first-col` / `first-row` test variants. Live probe confirmed formulas spills `[4,5,6]` / `[7;8;9]`
while hyperformula, ironcalc, pycel each return the single scalar `4` / `7`.

### `=COLUMN()` — no argument (COLUMN/column-no-arg): cell-placement artifact

Returns the column of the formula's own cell, so the answer depends on where each driver writes the probe
formula.

| engine                                                  | result  | mechanism                                   |
| ------------------------------------------------------- | ------- | ------------------------------------------- |
| excel, gsheets, hyperformula, ironcalc, formulas, pycel | `27`    | formula placed in column AA (27)            |
| lattice                                                 | `26`    | lattice writes the formula to column Z (26) |
| libreoffice                                             | _blank_ | recording artifact                          |

Cause bucket: **TODO** (test-harness cell-placement artifact). Every engine correctly returns its own
column; lattice simply sits one column left. The `tests/lookup-longtail.yaml` note documents this
placement dependence. Live probe: hyperformula/ironcalc/formulas/pycel all return `27`.

### Single-cell ROW/COLUMN — libreoffice artifact only

`=COLUMN(A1)`→1, `=COLUMN(C1)`→3, `=COLUMN(Z1)`→26, `=ROW(A1)`→1, `=ROW(A5)`→5, `=ROW(C10)`→10,
`=ROW()`→1. All seven evaluating engines agree; the fork exists only because libreoffice recorded blank.
See notes/RECORDING-ARTIFACT-libreoffice-blank.md. Cause: TODO (re-record).

## Wiki-facing notes

- Scalar ROW/COLUMN (single cell, or no argument) is fully portable.
- **ROW/COLUMN over a multi-cell range is a spill/shape trap.** Excel, Google Sheets' newer behavior via
  ARRAYFORMULA aside, the assay recording shows gsheets, HyperFormula, IronCalc, and pycel collapse the
  range to its first element, whereas Excel, lattice, and the `formulas` engine spill the full vector.
  Formulas that feed `COLUMN(range)`/`ROW(range)` into `SUMPRODUCT`, `LARGE`, etc. will behave differently.
- `COLUMN()`/`ROW()` with no argument are inherently position-dependent; never compare their raw values
  across recordings from different harnesses.

## Open questions

- Re-record libreoffice for the single-cell cases.
- No live-Excel probe needed — the spill vs scalar split is confirmed against recorded excel/lattice and
  live pure engines.
