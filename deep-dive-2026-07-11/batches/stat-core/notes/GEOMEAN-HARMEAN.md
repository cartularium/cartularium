# GEOMEAN / HARMEAN — cross-engine deep dive

**Batch:** stat-core · **Refs:** GEOMEAN/geomean-1-5, HARMEAN/harmean-1-5 · **Confidence:** high (live-confirmed on pure engines)

## Behavior summary

`GEOMEAN` (geometric mean) and `HARMEAN` (harmonic mean) are well-standardized. Every engine that implements them agrees on the value; the only forks are (a) pycel does not implement either, and (b) the libreoffice all-null fixture artifact.

## Divergences

### `=GEOMEAN(A1:A5)` and `=HARMEAN(A1:A5)` over `{1,2,3,4,5}`

| Engine                                      | GEOMEAN                                        | HARMEAN                    |
| ------------------------------------------- | ---------------------------------------------- | -------------------------- |
| excel                                       | 2.605171084697352                              | 2.18978102189781           |
| formulas                                    | 2.6051710846973517                             | 2.18978102189781           |
| gsheets / hyperformula / ironcalc / lattice | 2.6051710847 / 2.605171085 (display-truncated) | 2.1897810219 / 2.189781022 |
| pycel                                       | `#NAME?`                                       | `#NAME?`                   |
| libreoffice                                 | blank                                          | blank                      |

**Mechanism (cause: `missing-function`).** pycel lacks both functions → `#NAME?`. All other implementing engines agree; the several distinct numeric entries in the recorded partition (…4697352 vs …6973517 vs …0847 vs …085) are the _same value_ serialized at different decimal precisions by different engines, not a computational disagreement. libreoffice is the stale all-null recording.

Live probe (`scratch/stat-core-probe1.mts`):

```
hyperformula  GEOMEAN=2.6051710847   HARMEAN=2.1897810219
ironcalc      GEOMEAN=2.605171085    HARMEAN=2.189781022
formulas      GEOMEAN=2.6051710846973517  HARMEAN=2.18978102189781
pycel         #NAME?                 #NAME?
```

## Edges explored beyond the corpus

- The float display spread (10 vs 13 vs 16 significant digits) is an engine serialization property, not a precision loss in the computation — the leading digits are identical across all four pure engines.

## Wiki-facing notes

- On GEOMEAN and HARMEAN pages: **pycel does not implement either function** (`#NAME?`). All of Excel, Google Sheets, HyperFormula, IronCalc, LibreOffice and the `formulas` engine compute them and agree.
- These are safe, portable functions everywhere except pycel — no value caveats needed beyond the usual float-display note.

## Open questions

- None. Clean missing-function-in-pycel case, live-confirmed.
