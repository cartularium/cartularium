---
name: RATE
category: financial
syntax: RATE(number_of_periods, payment_per_period, present_value, [future_value, end_or_beginning, rate_guess])
status: imported
description: Calculates the interest rate of an annuity investment based on constant-amount periodic payments and the assumption of a constant interest rate.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093257?hl=en).

Calculates the interest rate of an annuity investment based on constant-amount periodic payments and the assumption of a constant interest rate.

### Sample Usage

```gse
RATE(12,-100,400,0,0,0.1)
RATE(A2,B2,C2,D2,1,0.08)
```

### Syntax

```gse
RATE(number_of_periods, payment_per_period, present_value, [future_value, end_or_beginning, rate_guess])
```

- `number_of_periods` - The number of payments to be made.
- `payment_per_period` - The amount per period to be paid.
- `present_value` - The current value of the annuity.
- `future_value` - **[** OPTIONAL **]** - The future value remaining after the final payment has been made.
- `end_or_beginning` - **[** OPTIONAL - `0` by default **]** - Whether payments are due at the end (`0`) or beginning (`1`) of each period.
- `rate_guess` - **[** OPTIONAL - 0.1 by default **]** - An estimate for what the interest rate will be.

### See Also

[[PV]]: Calculates the present value of an annuity investment based on constant-amount periodic payments and a constant interest rate.

[[PPMT]]: The PPMT function calculates the payment on the principal of an investment based on constant-amount periodic payments and a constant interest rate.

[[PMT]]: The PMT function calculates the periodic payment for an annuity investment based on constant-amount periodic payments and a constant interest rate.

[[NPER]]: The NPER function calculates the number of payment periods for an investment based on constant-amount periodic payments and a constant interest rate.

[[IPMT]]: The IPMT function calculates the payment on interest for an investment based on constant-amount periodic payments and a constant interest rate.

[[FVSCHEDULE]]: The FVSCHEDULE function calculates the future value of some principal based on a specified series of potentially varying interest rates.

[[FV]]: The FV function calculates the future value of an annuity investment based on constant-amount periodic payments and a constant interest rate.

[[CUMPRINC]]: Calculates the cumulative principal paid over a range of payment periods for an investment based on constant-amount periodic payments and a constant interest rate.

[[CUMIPMT]]: Calculates the cumulative interest over a range of payment periods for an investment based on constant-amount periodic payments and a constant interest rate.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdFByaGFyOTZycTZYN1pUTjNaVGMxbWc&amp;output=html" width="500"></iframe>