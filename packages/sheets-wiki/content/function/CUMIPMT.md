---
name: CUMIPMT
category: financial
syntax: CUMIPMT(rate, number_of_periods, present_value, first_period, last_period, end_or_beginning)
status: imported
description: Calculates the cumulative interest over a range of payment periods for an investment based on constant-amount periodic payments and a constant interest rate.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093211?hl=en).

Calculates the cumulative interest over a range of payment periods for an investment based on constant-amount periodic payments and a constant interest rate.

### Sample Usage

```gse
CUMIPMT(0.12,12,100,1,5,0)
CUMIPMT(A2,B2,C2,D2,E2,1)
```

### Syntax

```gse
CUMIPMT(rate, number_of_periods, present_value, first_period, last_period, end_or_beginning)
```

- `rate` - The interest rate.
- `number_of_periods` - The number of payments to be made.
- `present_value` - The current value of the annuity.
- `first_period` - The number of the payment period to begin the cumulative calculation.

  + `first_period` must be greater than or equal to `1`.
- `last_period` - The number of the payment period to end the cumulative calculation.

  + `last_period` must be greater than `first_period`.
- `end_or_beginning` - Whether payments are due at the end (`0`) or beginning (`1`) of each period.

### Notes

- Ensure that consistent units are used for `rate` and `number_of_periods`. For example, a car loan for 36 months may be paid monthly, in which case the annual percentage rate should be divided by 12 and the number of payments is 36. On the other hand, a different type of loan of the same length might be paid quarterly, in which case the annual percentage rate should be divided by 4 and the number of payments would be 12.

### See Also

[[RATE]]: Calculates the interest rate of an annuity investment based on constant-amount periodic payments and the assumption of a constant interest rate.

[[PV]]: Calculates the present value of an annuity investment based on constant-amount periodic payments and a constant interest rate.

[[PMT]]: The PMT function calculates the periodic payment for an annuity investment based on constant-amount periodic payments and a constant interest rate.

[[NPER]]: The NPER function calculates the number of payment periods for an investment based on constant-amount periodic payments and a constant interest rate.

[[IPMT]]: The IPMT function calculates the payment on interest for an investment based on constant-amount periodic payments and a constant interest rate.

[[FVSCHEDULE]]: The FVSCHEDULE function calculates the future value of some principal based on a specified series of potentially varying interest rates.

[[FV]]: The FV function calculates the future value of an annuity investment based on constant-amount periodic payments and a constant interest rate.

[[CUMPRINC]]: Calculates the cumulative principal paid over a range of payment periods for an investment based on constant-amount periodic payments and a constant interest rate.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdDJFeERTWjFvUFhFYzRoMFFHdEtlQ1E&amp;output=html" width="500"></iframe>