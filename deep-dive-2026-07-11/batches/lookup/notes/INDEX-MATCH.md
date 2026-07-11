# INDEX / MATCH — cross-engine deep dive

**Batch:** lookup · **Refs:** INDEX/index-out-of-bounds, INDEX/index-row-and-column, INDEX/index-single-column, MATCH/match-exact, MATCH/match-approximate, MATCH/match-not-found · **Confidence:** high

## Behavior summary

INDEX and MATCH are the portable backbone of spreadsheet lookup. `INDEX(range, row, [col])` returns the
element at a position; `MATCH(value, range, [type])` returns the 1-based position of a value (exact when
type 0, largest `<=` in ascending data when type 1). Across all seven engines that actually evaluate, the
in-range cases agree exactly. Only two things create forks here: one genuine error-code split on
out-of-bounds INDEX, and the pervasive libreoffice blank recording artifact.

## Divergences

### `=INDEX(A1:A2, 5)` — out of bounds (INDEX/index-out-of-bounds)

Requesting the 5th row of a 2-row range. All engines agree the call is invalid; they disagree on the
sentinel.

| engine       | result  | mechanism                                                 |
| ------------ | ------- | --------------------------------------------------------- |
| excel        | `#REF!` | out-of-array index → reference error (reference)          |
| formulas     | `#REF!` | same                                                      |
| ironcalc     | `#REF!` | same                                                      |
| lattice      | `#REF!` | same                                                      |
| pycel        | `#REF!` | same                                                      |
| gsheets      | `#NUM!` | out-of-range index treated as an invalid numeric argument |
| hyperformula | `#NUM!` | same as gsheets                                           |
| libreoffice  | _blank_ | recording artifact                                        |

Cause bucket: **error-code**. Live probe confirmed hyperformula=`#NUM!`, ironcalc/formulas/pycel=`#REF!`.

### In-range INDEX/MATCH — libreoffice artifact only

`=INDEX(A1:B2, 2, 1)` → 3, `=INDEX(A1:A3, 2)` → 20, `=MATCH(20, A1:A3, 0)` → 2,
`=MATCH(25, A1:A3, 1)` → 2, `=MATCH(99, {1,2,3}, 0)` → `#N/A`. All seven evaluating engines agree on each
of these. The only reason they register as forks is that the libreoffice recording returns blank for the
whole suite (see notes/RECORDING-ARTIFACT-libreoffice-blank.md). These are **not** semantic divergences.
Cause bucket for that branch: TODO (re-record libreoffice).

## Edges explored beyond the corpus

Probe (`scratch/lookup-probe1.mts`): hyperformula/ironcalc/pycel all return `3` for `=INDEX(A1:B2,2,1)`
and `#N/A` for `=MATCH(99,{1,2,3},0)`, confirming full agreement on the in-range and not-found cases and
isolating the out-of-bounds error-code split as the sole real INDEX divergence.

## Wiki-facing notes

- INDEX and MATCH are among the most portable lookup functions — exact and approximate MATCH, single- and
  two-dimensional INDEX all agree across excel, gsheets, hyperformula, ironcalc, lattice, formulas, pycel.
- The **one caveat**: an out-of-bounds INDEX index yields `#REF!` in Excel/ironcalc/formulas/lattice/pycel
  but `#NUM!` in Google Sheets and HyperFormula. Code that branches on the specific error sentinel (e.g.
  `IFERROR` is fine, but `ERROR.TYPE`-based dispatch is not) is not portable.
- MATCH-not-found is uniformly `#N/A` everywhere — safe to rely on.

## Open questions

- Re-record the libreoffice lookup / lookup-longtail suites; the 2026-05-11 recording is blank throughout.
- Confirm on live Excel/gsheets whether the `#REF!` vs `#NUM!` split also holds for index 0 and negative
  indices (probe lookup-005).
