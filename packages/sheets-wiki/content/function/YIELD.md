---
name: YIELD
category: financial
syntax: YIELD(settlement, maturity, rate, price, redemption, frequency, [day_count_convention])
status: imported
description: Calculates the annual yield of a security paying periodic interest, such as a US Treasury Bond, based on price.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093255?hl=en).

Calculates the annual yield of a security paying periodic interest, such as a US Treasury Bond, based on price.

### Sample Usage

```gse
YIELD(DATE(2010,01,02),DATE(2039,12,31),3,93.45,100,2)
YIELD(A2,B2,C2,D2,E2,F2,1)
```

### Syntax

```gse
YIELD(settlement, maturity, rate, price, redemption, frequency, [day_count_convention])
```

- `settlement` - The settlement date of the security, the date after issuance when the security is delivered to the buyer.
- `maturity` - The maturity or end date of the security, when it can be redeemed at face, or par value.
- `rate` - The annualized rate of interest.
- `price` - The price at which the security is bought per 100 face value.
- `redemption` - The redemption amount per 100 face value, or par.
- `frequency` - The number of interest or coupon payments per year (1, 2, or 4).
- `day_count_convention` - **[** OPTIONAL - `0` by default **]** - An indicator of what day count method to use.

  + 0 indicates US (NASD) 30/360 - This assumes 30 day months and 360 day years as per the National Association of Securities Dealers standard, and performs specific adjustments to entered dates which fall at the end of months.
  + 1 indicates Actual/Actual - This calculates based upon the actual number of days between the specified dates, and the actual number of days in the intervening years. Used for US Treasury Bonds and Bills, but also the most relevant for non-financial use.
  + 2 indicates Actual/360 - This calculates based on the actual number of days between the specified dates, but assumes a 360 day year.
  + 3 indicates Actual/365 - This calculates based on the actual number of days between the specified dates, but assumes a 365 day year.
  + 4 indicates European 30/360 - Similar to `0`, this calculates based on a 30 day month and 360 day year, but adjusts end-of-month dates according to European financial conventions.

### Notes

- `settlement` and `maturity` should be entered using `DATE`, `TO_DATE` or other date parsing functions rather than by entering text.

### See Also

[[YIELDDISC]]: Calculates the annual yield of a discount (non-interest-bearing) security, based on price.

[[TBILLYIELD]]: Calculates the yield of a US Treasury Bill based on price.

[[PRICEMAT]]: Calculates the price of a security paying interest at maturity, based on expected yield.

[[PRICEDISC]]: Calculates the price of a discount (non-interest-bearing) security, based on expected yield.

[[PRICE]]: Calculates the price of a security paying periodic interest, such as a US Treasury Bond, based on expected yield.

[[DISC]]: Calculates the discount rate of a security based on price.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdE9COXRFTjNlem50b3VBNURCT3VSZ0E&amp;output=html" width="500"></iframe>