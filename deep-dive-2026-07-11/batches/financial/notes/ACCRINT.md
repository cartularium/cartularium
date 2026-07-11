# ACCRINT — cross-engine deep dive

**Batch:** financial · **Refs:** ACCRINT/accrint-annual-basis-1, ACCRINT/accrint-semiannual · **Confidence:** high

## Behavior summary

`ACCRINT(issue, first_interest, settlement, rate, par, frequency, [basis], [calc_method])`
returns the accrued interest on a security that pays periodic interest. The result depends
on the day-count `basis` (0 = US 30/360, 1 = actual/actual, 2 = actual/360, 3 = actual/365,
4 = European 30/360) and, in modern Excel, on `calc_method`. This is exactly the kind of
function where "compute the day fraction between two dates" is defined differently by each
implementation, so it is a reliable source of genuine (non-floating-point) divergence.

Only four engines implement ACCRINT at all: **Excel, Google Sheets, the `formulas` Python
library, and Lattice**. HyperFormula, IronCalc, and pycel return `#NAME?`. LibreOffice recorded
blank (a suite-wide harness gap — see `libreoffice-financial-gap.md`).

## Divergences

### accrint-annual-basis-1 (basis 1 = actual/actual)

`=ACCRINT(DATE(2011,2,15), DATE(2011,8,15), DATE(2012,2,15), 0.0575, 1000, 1, 1)`

| engine                        | result             | class                           |
| ----------------------------- | ------------------ | ------------------------------- |
| excel, gsheets                | 57.5               | full annual coupon              |
| formulas                      | 57.4208024552736   | actual-day fraction             |
| lattice                       | 57.421340629274965 | actual-day fraction (different) |
| hyperformula, ironcalc, pycel | #NAME?             | not implemented                 |
| libreoffice                   | (blank)            | harness gap                     |

Issue 2011-02-15 to settlement 2012-02-15 is exactly one year. Excel/Google Sheets return
`1000 * 0.0575 = 57.5`, treating the elapsed span as a whole coupon period. `formulas` and
Lattice instead compute an actual/actual day fraction that lands just under 1.0 (≈0.99862 and
≈0.99863 respectively), and they do not even agree with each other — they differ in the third
significant digit, which means they disagree on the denominator (days in the reference coupon
year) as well as the numerator. **Cause bucket: arg-semantics** (day-count interpretation).

### accrint-semiannual (basis 0 = 30/360)

`=ACCRINT(DATE(2008,3,1), DATE(2008,8,31), DATE(2011,2,15), 0.1, 1000, 2, 0)`

| engine                        | result            | class            |
| ----------------------------- | ----------------- | ---------------- |
| excel                         | 295.8333333333333 | 30/360 variant A |
| gsheets, lattice              | 295.5555555555555 | 30/360 variant B |
| formulas                      | 295.2777777777778 | 30/360 variant C |
| hyperformula, ironcalc, pycel | #NAME?            | not implemented  |
| libreoffice                   | (blank)           | harness gap      |

Three different answers from three implementations of the _same_ 30/360 basis. The disagreement
comes from two classic 30/360 ambiguities present in this input: (1) the issue date is 2008-03-01
while `first_interest` is 2008-08-31 — the 31st-of-month gets clamped to 30 differently across
engines; (2) with `frequency = 2` (semiannual) and a settlement almost three years after issue,
the engines count the number of whole accrual periods plus the stub differently. The spread is
about 0.2% of the value, far larger than any floating-point effect. **Cause bucket: arg-semantics.**

## Edges explored beyond the corpus

Live probe (`formulas` library) reproduced both recorded values exactly: 57.4208024552736 and
295.2777777777778. This rules out a stale fixture on the `formulas` side and confirms the day-count
difference is deterministic engine behavior. HyperFormula/IronCalc/pycel `#NAME?` for ACCRINT was
also confirmed live.

## Wiki-facing notes

- ACCRINT is **not portable to HyperFormula, IronCalc, or pycel** — those engines have no ACCRINT.
- Even among engines that implement it, the accrued-interest amount is **not guaranteed identical**:
  with `basis 0` (30/360) Excel, Google Sheets, and the `formulas` library can each return a
  different number when the issue or first-interest date is the 30th/31st of a month. Do not rely
  on ACCRINT agreeing to the cent across Excel and Google Sheets for 30/360 securities.
- With `basis 1` (actual/actual) Excel and Google Sheets agree with each other but other engines
  (Lattice, `formulas`) compute a slightly smaller accrued value on the exact-one-year span.
- Advice for portable models: prefer explicit day-count where possible, and reconcile ACCRINT
  outputs to a tolerance, not to exact equality, when a workbook may be opened in multiple engines.

## Open questions

- `financial-004` requests live Excel + Google Sheets confirmation that the semiannual case really
  splits 295.8333 (Excel) vs 295.5556 (gsheets) — the fixtures say so, but a live re-confirm makes
  this a citable divergence. Excel vs Google Sheets disagreeing on a 30/360 ACCRINT is the headline.
- Which 30/360 clamping rule each engine uses (NASD vs European vs the Excel "day 31 -> 30 only if
  the other day is 30/31" rule) would be worth documenting per engine; needs source inspection.
