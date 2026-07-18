---
name: XNPV
category: financial
syntax: XNPV(discount, cashflow_amounts, cashflow_dates)
status: imported
description: Calculates the net present value of an investment based on a specified series of potentially irregularly spaced cash flows and a discount rate.
tags:
  - modified
  - undocumented
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093268?hl=en).

Calculates the net present value of an investment based on a specified series of potentially irregularly spaced cash flows and a discount rate.

### Sample Usage

```gse
XNPV(A2,B2:B25,C2:C25)
XNPV(0.08,{200,250,300},{DATE(2012,06,23),DATE(2013,05,12),DATE(2014,02,09)})
```

### Syntax

```gse
XNPV(discount, cashflow_amounts, cashflow_dates)
```

- `discount` - The discount rate of the investment over one period.
- `cashflow_amounts` - A range of cells containing the income or payments associated with the investment.
- `cashflow_dates` - A range of cells with dates corresponding to the cash flows in `cashflow_amounts`.

### Notes

- `XNPV` is similar to `PV` except that `XNPV` allows variable-value cash flows and cash flow intervals.
- If the days specified in `cashflow_dates` are at a regular interval, use `NPV` instead.
- Each cell in `cashflow_amounts` should be positive if it represents income from the perspective of the owner of the investment (e.g. coupons) or negative if it represents payments (e.g. loan repayment).
- `XIRR` under the same conditions calculates the internal rate of return for which the net present value is zero.

### Engine compatibility

The **type** of the `cashflow_dates` cells decides whether XNPV works. Excel, Google Sheets, and HyperFormula are strict: they require real date serials and return `#VALUE!` if the dates are text (e.g. ISO strings like `"2020-01-01"`). `formulas`, IronCalc, and Lattice are lenient — they parse ISO strings and compute. pycel does not implement XNPV (assay: XNPV/xnpv-standard; live probe, 2026-07-11). This is verified live: on real date serials HyperFormula's XNPV computes correctly, and it errors only on text. For portability, wrap text dates in [[DATEVALUE]] (or reference cells holding real dates) — a model authored with ISO text will compute in a lenient engine and then break when opened in a strict one.

Note the intra-vendor asymmetry: Excel and Google Sheets **coerce** text dates for [[XIRR]] but **reject** them for XNPV (Excel and gsheets live probes, 2026-07-11). "Same dates argument" does not mean "same coercion rules," even within one product.

| Engine | Behavior |
| --- | --- |
| Google Sheets | Requires date serials; text dates → `#VALUE!`. |
| Excel | Requires date serials; text dates → `#VALUE!`. |
| HyperFormula | Requires date serials; text dates → `#VALUE!`; computes on serials (live probe, 2026-07-11). |
| IronCalc | Coerces ISO text dates and computes (live probe, 2026-07-11). |
| formulas | Coerces ISO text dates and computes (live probe, 2026-07-11). |
| pycel | Not implemented; returns `#NAME?`. |
| Lattice | Coerces ISO text dates and computes. |

### See Also

[[XIRR]]: Calculates the internal rate of return of an investment based on a specified series of potentially irregularly spaced cash flows.

[[PV]]: Calculates the present value of an annuity investment based on constant-amount periodic payments and a constant interest rate.

[[NPV]]: Calculates the net present value of an investment based on a series of periodic cash flows and a discount rate.

[[MIRR]]: Calculates the modified internal rate of return on an investment based on a series of periodic cash flows and the difference between the interest rate paid on financing versus the return received on reinvested income.

[[IRR]]: Calculates the internal rate of return on an investment based on a series of periodic cash flows.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdDZrelc5UkM3N3dZSVpKX3BDQXZ0UVE&amp;output=html" width="500"></iframe>