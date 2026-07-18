---
name: ISPMT
category: financial
syntax: ISPMT(rate, period, number_of_periods, present_value)
status: imported
description: The ISPMT function calculates the interest paid during a particular period of an investment.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9116481?hl=en).

The ISPMT function calculates the interest paid during a particular period of an investment.

### Syntax
```gse
ISPMT(rate, period, number_of_periods, present_value)
```

| Part | Description | Notes |
| --- | --- | --- |
| `rate` | The interest rate. |  |
| `period` | The time frame for which you want to view the interest payment. | Should be number between 1 and number\_of\_periods. |
| `number_of_periods` | The number of payments to be made. |  |
| `present_value` | The current value of the annuity. |  |

### Sample formula

```gse
ISPMT(15%, 2, 5, 1000)
```

### Notes

Make sure that consistent units are used for the rate, period, and number of periods. For example, a car loan for 36 months may be paid monthly, in which case the annual percentage rate (APR) should be divided by 12 and the number of payments is 36. A different type of loan of the same length might be paid quarterly, in which case the APR should be divided by 4 and the number of payments would be 12.

### Example

| A | B |
| --- | --- |
| **1** | **Formula** | **Result** |
| **2** | =ISPMT(B1, B2, B3, B4) | -2400 |

### Related functions

- [[PPMT]]: The PPMT function calculates the payment on the principal of an investment based on constant-amount periodic payments and a constant interest rate.
- [[PMT]]: The PMT function calculates the periodic payment for an annuity investment based on constant-amount periodic payments and a constant interest rate.
- [[NPER]]: The NPER function calculates the number of payment periods for an investment based on constant-amount periodic payments and a constant interest rate.
- [[IPMT]]: The IPMT function calculates the payment on interest for an investment based on constant-amount periodic payments and a constant interest rate.
- [[FVSCHEDULE]]: The FVSCHEDULE function calculates the future value of some principal based on a specified series of potentially varying interest rates.
- [[FV]]: The FV function calculates the future value of an annuity investment based on constant-amount periodic payments and a constant interest rate.