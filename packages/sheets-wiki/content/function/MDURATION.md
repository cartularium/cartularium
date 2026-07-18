---
name: MDURATION
category: financial
syntax: MDURATION(settlement, maturity, rate, yield, frequency, [day_count_convention])
status: imported
description: Calculates the modified Macaulay duration of a security paying periodic interest, such as a US Treasury Bond, based on expected yield.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093178?hl=en).

Calculates the modified Macaulay duration of a security paying periodic interest, such as a US Treasury Bond, based on expected yield.

### Sample Usage

```gse
MDURATION(DATE(2010,01,02), DATE(2039,12,31), 3, 1.2, 2)
MDURATION(A2, B2, C2, D2, E2, 1)
```

### Syntax

```gse
MDURATION(settlement, maturity, rate, yield, frequency, [day_count_convention])
```

- `settlement` - The settlement date of the security, the date after issuance when the security is delivered to the buyer.
- `maturity` - The maturity or end date of the security, when it can be redeemed at face or par value.
- `rate` - The annualized rate of interest.
- `yield` - The expected annual yield of the security.
- `frequency` - The number of interest or coupon payments per year (1, 2, or 4).
- `day_count_convention` - **[** OPTIONAL - `0` by default **]** - An indicator of what day count method to use.

  + 0 indicates US (NASD) 30/360 - This assumes 30 day months and 360 day years as per the National Association of Securities Dealers standard, and performs specific adjustments to entered dates which fall at the end of months.
  + 1 indicates Actual/Actual - This calculates based upon the actual number of days between the specified dates, and the actual number of days in the intervening years. Used for US Treasury Bonds and Bills, but also the most relevant for non-financial use.
  + 2 indicates Actual/360 - This calculates based on the actual number of days between the specified dates, but assumes a 360 day year.
  + 3 indicates Actual/365 - This calculates based on the actual number of days between the specified dates, but assumes a 365 day year.
  + 4 indicates European 30/360 - Similar to `0`, this calculates based on a 30 day month and 360 day year, but adjusts end-of-month dates according to European financial conventions.

### Notes

- `settlement` and `maturity` should be entered using `DATE`, `TO_DATE`, or other date parsing functions rather than by entering text.
- The modified duration is different from Macaulay duration (`DURATION`) in that it measures volatility, or price sensitivity, of an investment. The modified duration is related to the Macaulay duration in the following way: `MDURATION = DURATION / [1 + (yield / frequency)]`.

### See Also

[[YIELD]]: Calculates the annual yield of a security paying periodic interest, such as a US Treasury Bond, based on price.

[[PRICE]]: Calculates the price of a security paying periodic interest, such as a US Treasury Bond, based on expected yield.

[[DURATION]]: Calculates the number of compounding periods required for an investment of a specified present value appreciating at a given rate to reach a target value.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdFY1ZkEyTXB2UngwZTFXcEdYeG1NeUE&amp;output=html" width="500"></iframe>