# RRI & IPMT error edges — cross-engine deep dive

**Batch:** financial · **Refs:** RRI/rri-invalid-periods, IPMT/ipmt-last-period-mortgage · **Confidence:** high

## RRI(0, 1000, 2000) — error-code split

`RRI(nper, pv, fv)` returns the equivalent interest rate for an investment's growth,
`(fv/pv)^(1/nper) - 1`. With `nper = 0` the `1/nper` exponent is undefined, so every engine that
implements RRI fails — but they label the failure differently.

| engine                                           | result  | class            |
| ------------------------------------------------ | ------- | ---------------- |
| excel, formulas, hyperformula, ironcalc, lattice | #NUM!   | invalid-argument |
| gsheets                                          | #DIV/0! | division-by-zero |
| pycel                                            | #NAME?  | not implemented  |
| libreoffice                                      | (blank) | harness gap      |

Confirmed live: HyperFormula, IronCalc, and the `formulas` library all return `#NUM!`. Google
Sheets alone maps the same invalid input to `#DIV/0!` — it surfaces the literal `1/0` in the
exponent, whereas the others classify a zero period count as an out-of-domain argument. **Cause
bucket: error-code.** Same failing computation, two different error sentinels.

## IPMT(0.05/12, 360, 360, -200000) — formulas library errors on the last period

`IPMT(rate, per, nper, pv)` returns the interest portion of payment `per`. Here `per = nper = 360`,
the final payment of a 30-year monthly loan, whose interest portion is a small positive residual.

| engine                                          | result        | class                     |
| ----------------------------------------------- | ------------- | ------------------------- |
| excel, gsheets, hyperformula, ironcalc, lattice | ~4.4549512283 | compute residual interest |
| formulas                                        | #NUM!         | library edge failure      |
| pycel                                           | #NAME?        | not implemented           |
| libreoffice                                     | (blank)       | harness gap               |

Confirmed live: the `formulas` Python library returns `#NUM!` for this last-period IPMT, while the
five other implementing engines all return the small positive interest (IronCalc reports it as the
reduced-precision 4.454951228). This is a `formulas`-library-specific edge — most likely its IPMT
implementation mishandles the `per == nper` boundary. **Cause bucket: error-attribution.**

## Wiki-facing notes

- **RRI:** guard against `nper = 0`. The error you get depends on the engine — `#NUM!` in Excel,
  HyperFormula, IronCalc, Lattice, and the `formulas` library; `#DIV/0!` in Google Sheets. A model
  that branches on the specific error code will not be portable.
- **IPMT last period:** portable everywhere except the `formulas` Python library, which returns
  `#NUM!` at `per == nper`. If a pipeline uses `formulas`, compute final-period interest as
  `PMT - PPMT` (or `pmt - principal`) instead of calling IPMT at the last period.

## Open questions

- `financial-003`: confirm Excel `#NUM!` vs Google Sheets `#DIV/0!` for RRI on live engines.
- `financial-005`: confirm Excel/gsheets IPMT last-period returns ~4.4550 (isolating the `#NUM!` to
  the `formulas` library).
