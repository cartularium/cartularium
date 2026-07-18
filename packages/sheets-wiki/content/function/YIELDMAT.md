---
name: YIELDMAT
category: financial
syntax: YIELDMAT(settlement, maturity, issue, rate, price, [day_count_convention])
status: imported
description: The `YIELDMAT` function calculates the annual yield of a security paying interest at maturity, based on price.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9000132?hl=en).

The `YIELDMAT` function calculates the annual yield of a security paying interest at maturity, based on price.

### Syntax

```gse
YIELDMAT(settlement, maturity, issue, rate, price, [day_count_convention])
```

- `settlement` - The settlement date of the security, the date after issuance when the security is delivered to the buyer.
- `maturity` - The maturity or end date of the security, when it can be redeemed at face or par value.
- `issue` - The date the security was initially issued.
- `rate` - The annualized rate of interest.
- `price` - The price at which the security is bought.
- `day_count_convention` - **[** OPTIONAL - `0` by default **]** - An indicator of what day count method to use.
  + `0` indicates U.S. (NASD) 30/360 - assumes 30-day months and 360-day years per the National Association of Securities Dealers standard and performs specific adjustments to entered dates which fall at the end of months.
  + `1` indicates Actual/Actual - calculates based on the actual number of days between the specified dates and the actual number of days in the intervening years. Used for U.S. Treasury Bonds and Bills, but also the most relevant for non-financial use.
  + `2` indicates Actual/360 - calculates based on the actual number of days between the specified dates, but assumes a 360-day year.
  + `3` indicates Actual/365 - calculates based on the actual number of days between the specified dates, but assumes a 365-day year.
  + `4` indicates European 30/360 - similar to `0`, calculates based on a 30-day month and 360-day year, but adjusts end-of-month dates according to European financial conventions.

### Sample formulas

```gse
YIELDMAT(DATE(2010,01,02),DATE(2039,12,31),DATE(2010,01,01),3,100.47)
YIELDMAT(A2,B2,C2,D2,E2,1)
```

### Notes

- `settlement`, `maturity`, and `issue` should be entered using `DATE`, `TO_DATE`, or other date parsing functions rather than by entering text.

### Examples

|  | **A** | **B** | C | D |
| --- | --- | --- | --- | --- |
| 1 |  |  | **Formula** | **Result** |
| 2 | `settlement` | 1/2/2010 | =YIELDMAT(B2, B3, B4, B5, B6, B7) | 0.13 |
| 3 | maturity | 12/31/2010 |  |  |
| 4 | `issue` | 1/1/2008 |  |  |
| 5 | `rate` | 2% |  |  |
| 6 | `price` | 90 |  |  |
| 7 | `day_count_convention` | 2 |  |  |

### Related functions

[[PRICEMAT]]: Calculates the price of a security paying interest at maturity, based on expected yield.

[[YIELDDISC]]: Calculates the annual yield of a discount (non-interest-bearing) security, based on price.
