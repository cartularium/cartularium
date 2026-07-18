---
name: IRR
category: financial
syntax: IRR(cashflow_amounts, [rate_guess])
status: imported
description: Calculates the internal rate of return on an investment based on a series of periodic cash flows.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093231?hl=en).

Calculates the internal rate of return on an investment based on a series of periodic cash flows.

### Sample Usage

```gse
IRR(A2:A25)
IRR({-4000,200,250,300,350},0.1)
```

### Syntax

```gse
IRR(cashflow_amounts, [rate_guess])
```

- `cashflow_amounts` - An array or range containing the income or payments associated with the investment.

  + `cashflow_amounts` must contain at least one negative and one positive cash flow to calculate rate of return.
- `rate_guess` - **[** OPTIONAL - 0.1 by default **]** - An estimate for what the internal rate of return will be.

### Notes

- Each cell in `cashflow_amounts` should be positive if it represents income from the perspective of the owner of the investment (e.g. coupons) or negative if it represents payments (e.g. loan repayment).
- `NPV` will return zero if `discount` is set to the result of `IRR` using the same cash flow amounts.
- If the cash flows of an investment are irregularly spaced, use `XIRR` instead.

### See Also

[[XNPV]]: Calculates the net present value of an investment based on a specified series of potentially irregularly spaced cash flows and a discount rate.

[[XIRR]]: Calculates the internal rate of return of an investment based on a specified series of potentially irregularly spaced cash flows.

[[PV]]: Calculates the present value of an annuity investment based on constant-amount periodic payments and a constant interest rate.

[[NPV]]: Calculates the net present value of an investment based on a series of periodic cash flows and a discount rate.

[[MIRR]]: Calculates the modified internal rate of return on an investment based on a series of periodic cash flows and the difference between the interest rate paid on financing versus the return received on reinvested income.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdEZFRXRpYWxSLVRqUW96WGdIN3FOMEE&amp;output=html" width="500"></iframe>