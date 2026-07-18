---
name: XIRR
category: financial
syntax: XIRR(cashflow_amounts, cashflow_dates, [rate_guess])
status: imported
description: Calculates the internal rate of return of an investment based on a specified series of potentially irregularly spaced cash flows.
tags:
  - modified
  - undocumented
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093266?hl=en).

Calculates the internal rate of return of an investment based on a specified series of potentially irregularly spaced cash flows.

### Sample Usage

```gse
XIRR(B2:B25,C2:C25)
XIRR({-4000,200,250,300},{DATE(2012,01,01),DATE(2012,06,23),DATE(2013,05,12),DATE(2014,02,09)},0.09)
```

### Syntax

```gse
XIRR(cashflow_amounts, cashflow_dates, [rate_guess])
```

- `cashflow_amounts` - An array or range containing the income or payments associated with the investment.

  + `cashflow_amounts` must contain at least one negative and one positive cash flow to calculate rate of return.
- `cashflow_dates` - An array or range with dates corresponding to the cash flows in `cashflow_amounts`.
- `rate_guess` - **[** OPTIONAL - 0.1 by default **]** - An estimate for what the internal rate of return will be.

### Notes

- If the days specified in `cashflow_dates` are at a regular interval, use `IRR` instead.
- Each cell in `cashflow_amounts` should be positive if it represents income from the perspective of the owner of the investment (e.g. coupons) or negative if it represents payments (e.g. loan repayment).
- `XNPV` will return zero if `discount` is set to the result of `XIRR` using the same cash flow amounts and schedule.

### Engine compatibility

XIRR is an iterative solver, so where it is implemented the root differs from Excel by roughly `1e-8` — Excel converges to 0.3733625352…, while `formulas`, Google Sheets, and Lattice land on 0.3733625335…, and IronCalc reports a reduced-precision read-back (assay: XIRR/xirr-simple-project; live probe, 2026-07-11). Compare XIRR to a tolerance, never for exact cross-engine equality. **HyperFormula and pycel do not implement XIRR** and return `#NAME?` — notable because HyperFormula *does* have [[XNPV]].

Unlike XNPV, Excel and Google Sheets **coerce** text (ISO string) dates for XIRR rather than rejecting them — an internal asymmetry within the same product, confirmed live on both (2026-07-11). Even so, authoring dates as real serials (or via [[DATE]]) remains the portable choice.

| Engine | Behavior |
| --- | --- |
| Google Sheets | Supported; solver root ≈ 0.3733625335; coerces text dates. |
| Excel | Supported; solver root ≈ 0.3733625352; coerces text dates (live probe, 2026-07-11). |
| HyperFormula | Not implemented; returns `#NAME?` regardless of date type (live probe, 2026-07-11). |
| IronCalc | Supported; reduced-precision read-back (live probe, 2026-07-11). |
| formulas | Supported; solver root ≈ 0.3733625335 (live probe, 2026-07-11). |
| pycel | Not implemented; returns `#NAME?`. |
| Lattice | Supported; solver root ≈ 0.3733625335. |

### See Also

[[XNPV]]: Calculates the net present value of an investment based on a specified series of potentially irregularly spaced cash flows and a discount rate.

[[PV]]: Calculates the present value of an annuity investment based on constant-amount periodic payments and a constant interest rate.

[[NPV]]: Calculates the net present value of an investment based on a series of periodic cash flows and a discount rate.

[[MIRR]]: Calculates the modified internal rate of return on an investment based on a series of periodic cash flows and the difference between the interest rate paid on financing versus the return received on reinvested income.

[[IRR]]: Calculates the internal rate of return on an investment based on a series of periodic cash flows.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdExMWmExcS1jU0RVUnAyb2Z2UktIRlE&amp;output=html" width="500"></iframe>