---
name: NPV
category: financial
syntax: NPV(discount, cashflow1, [cashflow2, ...])
status: imported
description: Calculates the net present value of an investment based on a series of periodic cash flows and a discount rate.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093184?hl=en).

Calculates the net present value of an investment based on a series of periodic cash flows and a discount rate.

### Sample Usage

```gse
NPV(0.08,200,250,300)
NPV(A2,A3,A4,A5)
```

### Syntax

```gse
NPV(discount, cashflow1, [cashflow2, ...])
```

- `discount` - The discount rate of the investment over one period.
- `cashflow1` - The first future cash flow.
- `cashflow2, ...` - **[** OPTIONAL **]** - Additional future cash flows.

### Notes

- `NPV` is similar to `PV` except that `NPV` allows variable-value cash flows.
- Each `cashflow` argument should be positive if it represents income from the perspective of the owner of the investment (e.g. coupons) or negative if it represents payments (e.g. loan repayment).
- Each `cashflow` argument may be either a value, a reference to a value, or a range containing values. Cashflows are considered in the order they are referenced.
- `IRR` under the same conditions calculates the internal rate of return for which the net present value is zero.
- If the cash flows of an investment are irregularly spaced, use `XNPV` instead.

### See Also

[[XNPV]]: Calculates the net present value of an investment based on a specified series of potentially irregularly spaced cash flows and a discount rate.

[[XIRR]]: Calculates the internal rate of return of an investment based on a specified series of potentially irregularly spaced cash flows.

[[PV]]: Calculates the present value of an annuity investment based on constant-amount periodic payments and a constant interest rate.

[[MIRR]]: Calculates the modified internal rate of return on an investment based on a series of periodic cash flows and the difference between the interest rate paid on financing versus the return received on reinvested income.

[[IRR]]: Calculates the internal rate of return on an investment based on a series of periodic cash flows.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdFJySGJlamRMc2pVbVllem82TzF0S3c&amp;output=html" width="500"></iframe>