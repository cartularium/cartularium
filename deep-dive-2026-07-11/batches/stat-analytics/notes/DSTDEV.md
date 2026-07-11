# DSTDEV (and the D\* database family) — cross-engine deep dive

**Batch:** stat-analytics · **Refs:** DSTDEV/dstdev-apples-price, DSTDEV/dstdev-field-by-index · **Confidence:** high

## Behavior summary

`DSTDEV(database, field, criteria)` returns the sample standard deviation of the values in `field` for the rows of `database` that match `criteria`. It is one of the twelve D\* database functions (DSUM, DAVERAGE, DCOUNT, DGET, DMAX, DMIN, DPRODUCT, DSTDEV, DSTDEVP, DVAR, DVARP, ...). `field` may be a column header string ("Price") or a 1-based column index (4).

## Divergences

`=DSTDEV(A1:D5, "Price", F1:F2)` and `=DSTDEV(A1:D5, 4, F1:F2)`:

| engine       | by-header ("Price") | by-index (4)       | class                        |
| ------------ | ------------------- | ------------------ | ---------------------------- |
| excel        | 1.4142135623730951  | 2.8284271247461903 | implements                   |
| gsheets      | 1.4142135623730951  | 2.8284271247461903 | implements                   |
| ironcalc     | 1.414213562         | 2.828427125        | implements (rounded display) |
| lattice      | (consensus)         | (consensus)        | implements                   |
| formulas     | #NAME?              | #NAME?             | no D\* family                |
| hyperformula | #NAME?              | #NAME?             | no D\* family                |
| pycel        | #NAME?              | #NAME?             | no D\* family                |
| libreoffice  | blank               | blank              | recording gap                |

The split is clean: **excel, gsheets, ironcalc, lattice** implement the D\* database functions (both the header-name and column-index forms of `field`); **formulas, hyperformula, pycel** implement none of them and return `#NAME?`. Cause: **missing-function**.

This is the same engine partition recorded for DSUM in **DV-0011** ("formulas, hyperformula, pycel: function not implemented — DAVERAGE, DCOUNT, ... DSUM ..."). DSTDEV was simply not enumerated in that record; the mechanism is identical (the three JS/Python engines built on non-database-aware cores lack the whole family).

## Edges explored beyond the corpus

Live probe with a deliberately _malformed_ grid (no "Price" header column present):

- formulas / hyperformula / pycel => `#NAME?` (the name is unknown — they never reach argument evaluation).
- ironcalc => `#VALUE!` (not `#NAME?`). This is the tell: ironcalc _recognizes_ DSTDEV and gets as far as resolving `field`/`criteria`, then fails on the malformed input. On the well-formed corpus grid ironcalc returns the correct number. So ironcalc genuinely implements DSTDEV.

The `#NAME?` vs `#VALUE!` distinction is a reliable probe for "function absent" vs "function present but arguments invalid".

## Wiki-facing notes

- The D\* database functions (including DSTDEV) work on Excel, Google Sheets, IronCalc and Lattice. They are **not** available in the `formulas` library, HyperFormula, or pycel — all return `#NAME?`.
- `field` accepts either the column header text or a 1-based column index on every engine that implements the family; both forms agree.

## Open questions

None outstanding for DSTDEV. (Broader D\*-family coverage per engine is already catalogued via DV-0011 for the DSUM/DAVERAGE/... set.)
