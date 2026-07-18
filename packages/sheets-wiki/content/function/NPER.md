---
name: NPER
category: financial
syntax: NPER(rate, payment_amount, present_value, [future_value, end_or_beginning])
status: imported
description: The NPER function calculates the number of payment periods for an investment based on constant-amount periodic payments and a constant interest rate.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093183?hl=en).

The NPER function calculates the number of payment periods for an investment based on constant-amount periodic payments and a constant interest rate.

### Sample Usage

```gse
NPER(2,500,40000)
NPER(A2,B2,C2,D2,1)
```

### Syntax

```gse
NPER(rate, payment_amount, present_value, [future_value, end_or_beginning])
```

- `rate` - The interest rate.
- `payment_amount` - The amount of each payment made.
- `present_value` - The current value of the annuity.
- `future_value` - **[** OPTIONAL **]** - The future value remaining after the final payment has been made.
- `end_or_beginning` - **[** OPTIONAL - `0` by default **]** - Whether payments are due at the end (`0`) or beginning (`1`) of each period.

### Notes

- Ensure that consistent units are used for `rate` and `payment_amount`. For example, a car loan for 36 months may be paid monthly, in which case the annual percentage rate should be divided by 12 and the `payment_amount` is the amount of each monthly payment. On the other hand, a different type of loan of the same length and principal might be paid quarterly, in which case the annual percentage rate should be divided by 4 and the amount paid each period would be adjusted accordingly..

### See Also

[[PV]]: Calculates the present value of an annuity investment based on constant-amount periodic payments and a constant interest rate.

[[PPMT]]: The PPMT function calculates the payment on the principal of an investment based on constant-amount periodic payments and a constant interest rate.

[[PMT]]: The PMT function calculates the periodic payment for an annuity investment based on constant-amount periodic payments and a constant interest rate.

[[IPMT]]: The IPMT function calculates the payment on interest for an investment based on constant-amount periodic payments and a constant interest rate.

[[FVSCHEDULE]]: The FVSCHEDULE function calculates the future value of some principal based on a specified series of potentially varying interest rates.

[[FV]]: The FV function calculates the future value of an annuity investment based on constant-amount periodic payments and a constant interest rate.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdGlfV3I1NUlXSFVXX0YxU2ZvSUJnbEE&amp;output=html" width="500"></iframe>