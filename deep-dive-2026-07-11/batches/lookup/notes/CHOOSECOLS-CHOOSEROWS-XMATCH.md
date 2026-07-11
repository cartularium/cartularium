# CHOOSECOLS / CHOOSEROWS / XMATCH — cross-engine deep dive

**Batch:** lookup · **Refs:** CHOOSECOLS/choosecols, CHOOSEROWS/chooserows, XMATCH/xmatch-not-found · **Confidence:** high

## Behavior summary

These are modern Excel dynamic-array functions: XMATCH (2020) is the successor to MATCH with a not-found
default of `#N/A`; CHOOSECOLS / CHOOSEROWS (2022) pick a subset of columns / rows from an array. The forks
here are entirely about **availability**: the four newer-generation engines (excel, gsheets, lattice, and
the JS `formulas` engine) implement them; the three older/embedded engines (hyperformula, ironcalc, pycel)
do not recognize the function names and return `#NAME?`. Where a function _is_ implemented, the engines
agree on the result.

## Divergences

### `=CHOOSECOLS({1,2,3;4,5,6}, 1, 3)` (CHOOSECOLS/choosecols)

Selects columns 1 and 3 → `[[1,3],[4,6]]`.

| engine                            | result          | mechanism                |
| --------------------------------- | --------------- | ------------------------ |
| excel, gsheets, lattice, formulas | `[[1,3],[4,6]]` | implemented (reference)  |
| hyperformula, ironcalc, pycel     | `#NAME?`        | function not implemented |
| libreoffice                       | _blank_         | recording artifact       |

### `=CHOOSEROWS({1,2;3,4;5,6}, 1, 3)` (CHOOSEROWS/chooserows)

Selects rows 1 and 3 → `[[1,2],[5,6]]`.

| engine                            | result          | mechanism                |
| --------------------------------- | --------------- | ------------------------ |
| excel, gsheets, lattice, formulas | `[[1,2],[5,6]]` | implemented (reference)  |
| hyperformula, ironcalc, pycel     | `#NAME?`        | function not implemented |
| libreoffice                       | _blank_         | recording artifact       |

### `=XMATCH(99, {1,2,3})` — not found (XMATCH/xmatch-not-found)

| engine                            | result   | mechanism                                     |
| --------------------------------- | -------- | --------------------------------------------- |
| excel, gsheets, lattice, formulas | `#N/A`   | value absent → not-found sentinel (reference) |
| hyperformula, ironcalc, pycel     | `#NAME?` | function not implemented                      |
| libreoffice                       | _blank_  | recording artifact                            |

Cause bucket for all three: **missing-function**.

## Edges explored beyond the corpus

Live probe (`scratch/lookup-probe1.mts`) confirmed:

- `formulas` computes CHOOSECOLS `[[1,3],[4,6]]` and CHOOSEROWS `[[1,2],[5,6]]`; hyperformula, ironcalc,
  pycel each return `#NAME?`.
- XMATCH: `formulas` returns `#N/A` for the not-found case and `2` for the in-range `=XMATCH(20,A1:A3)`
  case; hyperformula, ironcalc, pycel return `#NAME?` in both — i.e. the `#NAME?` is unconditional
  (missing function), not a data-dependent not-found.

## Wiki-facing notes

- CHOOSECOLS, CHOOSEROWS, and XMATCH are **not portable** to HyperFormula, IronCalc, or pycel — all three
  return `#NAME?`. Authors targeting broad engine coverage should provide INDEX/MATCH fallbacks.
- Where these functions are supported, the results are consistent; there is no semantic disagreement, only
  presence/absence.
- The `formulas` (JS "formulas" library) engine tracks the modern Excel surface here — it implements all
  three — which distinguishes it from the other pure engines in this batch.

## Open questions

None material — the availability split is confirmed by live probe against the recorded excel/gsheets/
lattice results.
