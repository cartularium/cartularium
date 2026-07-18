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

### Engine compatibility

Only **Excel, Google Sheets, `formulas`, and Lattice** implement ACCRINT; HyperFormula, IronCalc, and pycel return `#NAME?` (assay: ACCRINT deep dive; live probe, 2026-07-11). More surprising: even among the engines that do implement it, the accrued amount is **not guaranteed identical**, because ACCRINT's answer depends entirely on the day-count `basis` and the engines disagree on the edge rules. With `basis 0` (US 30/360) and an issue or first-interest date on the 30th/31st, Excel returns 295.8333…, Google Sheets and Lattice return 295.5555…, and `formulas` returns 295.2777… for the same inputs — a ~0.2% spread, far larger than floating-point noise. Excel and Google Sheets disagreeing on a 30/360 ACCRINT is the headline. With `basis 1` (actual/actual) Excel and Google Sheets agree on the exact-one-year case (57.5) but Lattice and `formulas` compute a slightly smaller actual-day fraction. Reconcile ACCRINT across engines to a tolerance, not to the cent.

| Engine | Behavior |
| --- | --- |
| Google Sheets | Supported; 30/360 basis-0 gives 295.5556 on the deep-dive case. |
| Excel | Supported; 30/360 basis-0 gives 295.8333 on the same case. |
| HyperFormula | Not implemented; returns `#NAME?` (live probe, 2026-07-11). |
| IronCalc | Not implemented; returns `#NAME?` (live probe, 2026-07-11). |
| formulas | Supported; day-count edges differ from Excel and Google Sheets (295.2778 on the same case) (live probe, 2026-07-11). |
| pycel | Not implemented; returns `#NAME?` (live probe, 2026-07-11). |
| Lattice | Supported; matches Google Sheets on the 30/360 case (295.5556). |

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