# MARGINOFERROR — cross-engine deep dive

**Batch:** stat-analytics · **Refs:** MARGINOFERROR/marginoferror-basic, MARGINOFERROR/marginoferror-wider-data · **Confidence:** high

## Behavior summary

`MARGINOFERROR(range, confidence)` is a **Google Sheets-native** statistical function with no Excel equivalent. Google documents it (support.google.com/docs/answer/12487850) and, importantly, gives its exact definition:

> `MARGINOFERROR(range, confidence) = CONFIDENCE.T(1 - confidence, STDEV(range), COUNT(range))`

i.e. the Student-t half-width of a confidence interval for the mean, using the sample standard deviation and sample size of `range`.

## Divergences

`=MARGINOFERROR(A1:A5, 0.05)` with A1:A5 = 1,2,3,4,5; and `=MARGINOFERROR(A1:A5, 0.01)` with A1:A5 = 10,20,30,40,50:

| engine       | basic (0.05)         | wider (0.01)        | class                                      |
| ------------ | -------------------- | ------------------- | ------------------------------------------ |
| gsheets      | 0.04718417110127355  | 0.09428439626864216 | implements                                 |
| lattice      | 0.047184171101276186 | 0.0942843962686051  | implements (mirrors gsheets, ~11 sig figs) |
| excel        | #NAME?               | #NAME?              | not a function                             |
| formulas     | #NAME?               | #NAME?              | not implemented                            |
| hyperformula | #NAME?               | #NAME?              | not implemented                            |
| ironcalc     | #NAME?               | #NAME?              | not implemented                            |
| pycel        | #NAME?               | #NAME?              | not implemented                            |
| libreoffice  | blank                | blank               | recording gap                              |

Cause: **missing-function** — MARGINOFERROR exists only in the Google Sheets function set, which Lattice deliberately mirrors; every Excel-lineage and OSS engine rejects the name.

## Edges explored beyond the corpus (identity verification)

The wiki claims a `CONFIDENCE.T` identity; I verified it live on two engines that lack MARGINOFERROR but have CONFIDENCE.T:

`=CONFIDENCE.T(0.95, STDEV(A1:A5), COUNT(A1:A5))` with A1:A5 = 1..5:

- hyperformula => **0.047184171101**
- formulas => **0.04718417110127589**

`=CONFIDENCE.T(0.99, STDEV(A1:A5), COUNT(A1:A5))` with A1:A5 = 10,20,30,40,50:

- hyperformula => **0.094284396269**
- formulas => **0.09428439626852442**

Both match the recorded gsheets/lattice `MARGINOFERROR` values to ~13 significant figures. The identity `MARGINOFERROR(r, c) == CONFIDENCE.T(1-c, STDEV(r), COUNT(r))` is confirmed.

**Gotcha for readers:** the corpus passes `confidence = 0.05` / `0.01`, which are _unusually low_ confidence levels — hence the tiny margins (~0.047, ~0.094). Google's own examples use `0.95` / `0.99`. So `MARGINOFERROR(range, 0.95)` gives the large "95% CI half-width" people expect, while the corpus's `0.05` gives the 5%-confidence half-width. This is a semantics-of-the-arg point worth surfacing on the wiki, since a naive reader might pass `0.95` expecting the small number the corpus shows.

## Wiki-facing notes

- MARGINOFERROR is **Google Sheets only** (also on Lattice). It is NOT available in Excel, LibreOffice, HyperFormula, IronCalc, pycel, or the `formulas` library — all return `#NAME?`.
- Portable replacement (works anywhere CONFIDENCE.T exists): `=CONFIDENCE.T(1-confidence, STDEV(range), COUNT(range))`.
- Clarify the `confidence` argument: it is the confidence _level_ (e.g. 0.95), and MARGINOFERROR internally uses `1 - confidence` as the CONFIDENCE.T alpha. The existing wiki page already documents the identity — keep it and add the portable-replacement line.

## Open questions

- Confirm the gsheets value `0.04718417110127355` on live Google Sheets (probe stat-analytics-001) — currently grounded on the documented identity + pure-engine reconstruction, which is strong but not a direct gsheets run.
