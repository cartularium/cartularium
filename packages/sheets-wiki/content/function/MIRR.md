---
name: MIRR
category: financial
syntax: MIRR(cashflow_amounts, financing_rate, reinvestment_return_rate)
status: imported
description: >-
  Calculates the modified internal rate of return on an investment based on a series of periodic cash flows and the difference between the interest rate paid on financing versus the return received on
  reinvested income.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093180?hl=en).

Calculates the modified internal rate of return on an investment based on a series of periodic cash flows and the difference between the interest rate paid on financing versus the return received on reinvested income.

### Sample Usage

```gse
MIRR(A2:A25,B2,B3)
MIRR({-4000,200,250,300,350},0.08,0.11)
```

### Syntax

```gse
MIRR(cashflow_amounts, financing_rate, reinvestment_return_rate)
```

- `cashflow_amounts` - An array or range containing the income or payments associated with the investment.

  + `cashflow_amounts` must contain at least one negative and one positive cash flow to calculate rate of return.
- `financing_rate` - The interest rate paid on funds invested.
- `reinvestment_return_rate` - The return (as a percentage) earned on reinvestment of income received from the investment.

### Notes

- Each cell in `cashflow_amounts` should be positive if it represents income from the perspective of the owner of the investment (e.g. coupons) or negative if it represents payments (e.g. loan repayment).

### See Also

[[XNPV]]: Calculates the net present value of an investment based on a specified series of potentially irregularly spaced cash flows and a discount rate.

[[XIRR]]: Calculates the internal rate of return of an investment based on a specified series of potentially irregularly spaced cash flows.

[[PV]]: Calculates the present value of an annuity investment based on constant-amount periodic payments and a constant interest rate.

[[NPV]]: Calculates the net present value of an investment based on a series of periodic cash flows and a discount rate.

[[IRR]]: Calculates the internal rate of return on an investment based on a series of periodic cash flows.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdGg1ZVFXR0hWT3ZDQW5fQlhodkVmZWc&amp;output=html" width="500"></iframe>