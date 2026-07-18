---
name: PRICEMAT
category: financial
syntax: PRICEMAT(settlement, maturity, issue, rate, yield, [day_count_convention])
status: imported
description: Calculates the price of a security paying interest at maturity, based on expected yield.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093191?hl=en).

Calculates the price of a security paying interest at maturity, based on expected yield.

### Sample Usage

```gse
PRICEMAT(DATE(2010,01,02),DATE(2039,12,31),DATE(2010,01,01),3,1.2)
PRICEMAT(A2,B2,C2,D2,E2,1)
```

### Syntax

```gse
PRICEMAT(settlement, maturity, issue, rate, yield, [day_count_convention])
```

- `settlement` - The settlement date of the security, the date after issuance when the security is delivered to the buyer.
- `maturity` - The maturity or end date of the security, when it can be redeemed at face or par value.
- `issue` - The date the security was initially issued.
- `rate` - The annualized rate of interest.
- `yield` - The expected annual yield of the security.
- `day_count_convention` - **[** OPTIONAL - `0` by default **]** - An indicator of what day count method to use.

  + 0 indicates US (NASD) 30/360 - This assumes 30 day months and 360 day years as per the National Association of Securities Dealers standard, and performs specific adjustments to entered dates which fall at the end of months.
  + 1 indicates Actual/Actual - This calculates based upon the actual number of days between the specified dates, and the actual number of days in the intervening years. Used for US Treasury Bonds and Bills, but also the most relevant for non-financial use.
  + 2 indicates Actual/360 - This calculates based on the actual number of days between the specified dates, but assumes a 360 day year.
  + 3 indicates Actual/365 - This calculates based on the actual number of days between the specified dates, but assumes a 365 day year.
  + 4 indicates European 30/360 - Similar to `0`, this calculates based on a 30 day month and 360 day year, but adjusts end-of-month dates according to European financial conventions.

### Notes

- `settlement`, `maturity`, and `issue` should be entered using `DATE`, `TO_DATE` or other date parsing functions rather than by entering text.

### See Also

[[YIELDDISC]]: Calculates the annual yield of a discount (non-interest-bearing) security, based on price.

[[YIELD]]: Calculates the annual yield of a security paying periodic interest, such as a US Treasury Bond, based on price.

[[PRICEDISC]]: Calculates the price of a discount (non-interest-bearing) security, based on expected yield.

[[PRICE]]: Calculates the price of a security paying periodic interest, such as a US Treasury Bond, based on expected yield.

[[DISC]]: Calculates the discount rate of a security based on price.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdGhWMnpNVjE3UGRyQlV5eUxqZXc2M1E&amp;output=html" width="500"></iframe>