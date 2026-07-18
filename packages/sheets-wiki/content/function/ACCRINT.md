---
name: ACCRINT
category: financial
syntax: ACCRINT(issue, first_payment, settlement, rate, redemption, frequency, [day_count_convention])
status: imported
description: Calculates the accrued interest of a security that has periodic payments.
tags:
  - modified
  - undocumented
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093200?hl=en).

Calculates the accrued interest of a security that has periodic payments.

### Sample Usage

```gse
ACCRINT(DATE(2010,01,01),DATE(2010,02,01),DATE(2012,12,31),0.05,100,4)
ACCRINT(A2,B2,C2,D2,E2,F2,2)
```

### Syntax

```gse
ACCRINT(issue, first_payment, settlement, rate, redemption, frequency, [day_count_convention])
```

- `issue` - The date the security was initially issued.
- `first_payment` - The first date interest will be paid.
- `settlement` - The settlement date of the security, the date after issuance when the security is delivered to the buyer.

  + `settlement` is the maturity date of the security if it is held until maturity rather than sold.
- `rate` - The annualized rate of interest.
- `redemption` - The redemption amount per 100 face value, or par.
- `frequency` - The number of interest or coupon payments per year (1, 2, or 4).
- `day_count_convention` - **[** OPTIONAL - `0` by default **]** - An indicator of what day count method to use.

  + 0 indicates US (NASD) 30/360 - This assumes 30 day months and 360 day years as per the National Association of Securities Dealers standard, and performs specific adjustments to entered dates which fall at the end of months.
  + 1 indicates Actual/Actual - This calculates based upon the actual number of days between the specified dates, and the actual number of days in the intervening years. Used for US Treasury Bonds and Bills, but also the most relevant for non-financial use.
  + 2 indicates Actual/360 - This calculates based on the actual number of days between the speficied dates, but assumes a 360 day year.
  + 3 indicates Actual/365 - This calculates based on the actual number of days between the specified dates, but assumes a 365 day year.
  + 4 indicates European 30/360 - Similar to `0`, this calculates based on a 30 day month and 360 day year, but adjusts end-of-month dates according to European financial conventions.

### Notes

- `issue`, `first_payment` and `settlement` should be entered using `DATE`, `TO_DATE` or other date parsing functions rather than by entering text.

### See Also

[[YIELDDISC]]: Calculates the annual yield of a discount (non-interest-bearing) security, based on price.

[[YIELD]]: Calculates the annual yield of a security paying periodic interest, such as a US Treasury Bond, based on price.

[[RECEIVED]]: Calculates the amount received at maturity for an investment in fixed-income securities purchased on a given date.

[[PRICEMAT]]: Calculates the price of a security paying interest at maturity, based on expected yield.

[[PRICEDISC]]: Calculates the price of a discount (non-interest-bearing) security, based on expected yield.

[[PRICE]]: Calculates the price of a security paying periodic interest, such as a US Treasury Bond, based on expected yield.

[[DURATION]]: Calculates the number of compounding periods required for an investment of a specified present value appreciating at a given rate to reach a target value.

[[DISC]]: Calculates the discount rate of a security based on price.

[[COUPPCD]]: Calculates last coupon, or interest payment, date before the settlement date.

[[COUPNUM]]: Calculates the number of coupons, or interest payments, between the settlement date and the maturity date of the investment.

[[COUPNCD]]: Calculates next coupon, or interest payment, date after the settlement date.

[[COUPDAYSNC]]: Calculates the number of days from the settlement date until the next coupon, or interest payment.

[[COUPDAYBS]]: Calculates the number of days from the first coupon, or interest payment, until settlement.

[[COUPDAYS]]: Calculates the number of days in the coupon, or interest payment, period that contains the specified settlement date.

[[ACCRINTM]]: Calculates the accrued interest of a security that pays interest at maturity.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdEJ6UmFHZ0phSUxkaExFbG9NZnBCM1E&amp;output=html" width="500"></iframe>