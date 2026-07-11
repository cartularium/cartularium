# TBILLEQ / TBILLPRICE / TBILLYIELD — cross-engine deep dive

**Batch:** financial · **Refs:** TBILLEQ/tbilleq-short-maturity, TBILLEQ/tbilleq-standard, TBILLPRICE/tbillprice-short-maturity, TBILLYIELD/tbillyield-short-maturity, TBILLYIELD/tbillyield-standard · **Confidence:** high

## Behavior summary

The Treasury-bill functions — bond-equivalent yield (TBILLEQ), price per $100 (TBILLPRICE), and
yield (TBILLYIELD) — are more widely supported than the coupon-bond family. Unlike PRICE/YIELD/etc.
(absent from HyperFormula and IronCalc), the TBILL functions are implemented by **five** engines:
Excel, `formulas`, Google Sheets, HyperFormula, and Lattice, plus IronCalc (at reduced precision).
Only pycel lacks them.

| tier              | engines                                         | behavior                      |
| ----------------- | ----------------------------------------------- | ----------------------------- |
| full precision    | excel, formulas, gsheets, hyperformula, lattice | agree to float noise          |
| reduced precision | ironcalc                                        | same value, display read-back |
| absent            | pycel                                           | `#NAME?`                      |
| harness gap       | libreoffice                                     | blank                         |

## Divergences

`=TBILLEQ(DATE(2011,2,15), DATE(2011,5,15), 0.065)`

| engine                 | result              |
| ---------------------- | ------------------- |
| excel                  | 0.06697909461767572 |
| formulas               | 0.066979094617676   |
| gsheets / hyperformula | 0.066979094618      |
| ironcalc               | 0.067               |
| pycel                  | #NAME?              |
| libreoffice            | (blank)             |

The five full-precision engines agree to ~1e-12; the class split among them is only how many
digits the recording retained (Google Sheets/HyperFormula recorded fewer). IronCalc's `0.067` is
the display-precision read-back described in `ironcalc-display-precision.md` (confirmed live:
IronCalc returns `0.0616` for the tbillyield-short-maturity case, matching its fixture). **Cause
bucket: precision** (float noise + IronCalc read-back), with pycel missing-function.

`tbillprice-short-maturity` and the two `tbillyield` cases follow the identical pattern
(TBILLPRICE: 98.39305555555555 for the full-precision engines vs IronCalc 98.39; TBILLYIELD:
0.0615981292420008 vs IronCalc 0.0616).

## Wiki-facing notes

- TBILL\* functions are portable across Excel, Google Sheets, HyperFormula, IronCalc, and Lattice —
  a wider set than the coupon-bond analytics. Only pycel lacks them.
- IronCalc returns the correct value but at coarse display precision; compare TBILL\* results to a
  tolerance across engines, not exact equality.

## Open questions

- None blocking. TBILL day-count is actual/360 by definition and the engines agree on it here.
