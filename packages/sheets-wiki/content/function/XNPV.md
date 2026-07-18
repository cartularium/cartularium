---
name: XNPV
category: financial
syntax: XNPV(discount, cashflow_amounts, cashflow_dates)
status: imported
description: Calculates the net present value of an investment based on a specified series of potentially irregularly spaced cash flows and a discount rate.
tags: []
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

### See Also

[[XIRR]]: Calculates the internal rate of return of an investment based on a specified series of potentially irregularly spaced cash flows.

[[PV]]: Calculates the present value of an annuity investment based on constant-amount periodic payments and a constant interest rate.

[[NPV]]: Calculates the net present value of an investment based on a series of periodic cash flows and a discount rate.

[[MIRR]]: Calculates the modified internal rate of return on an investment based on a series of periodic cash flows and the difference between the interest rate paid on financing versus the return received on reinvested income.

[[IRR]]: Calculates the internal rate of return on an investment based on a series of periodic cash flows.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdDZrelc5UkM3N3dZSVpKX3BDQXZ0UVE&amp;output=html" width="500"></iframe>