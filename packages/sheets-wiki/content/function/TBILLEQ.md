---
name: TBILLEQ
category: financial
syntax: TBILLEQ(settlement, maturity, discount)
status: imported
description: Calculates the equivalent annualized rate of return of a US Treasury Bill based on discount rate.
tags:
  - modified
  - undocumented
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093249?hl=en).

Calculates the equivalent annualized rate of return of a US Treasury Bill based on discount rate.

### Sample Usage

```gse
TBILLEQ(DATE(2010,1,2), DATE(2010,12,31), .09)
TBILLEQ(A2,B2,C2)
```

### Syntax

```gse
TBILLEQ(settlement, maturity, discount)
```

- `settlement` - The settlement date of the security, the date after issuance when the security is delivered to the buyer.
- `maturity` - The maturity or end date of the security, when it can be redeemed at face or par value.
- `discount` - The discount rate of the bill at time of purchase.

### Notes

- `settlement` and `maturity` should be entered using `DATE`, `TO_DATE` or other date parsing functions rather than by entering text.

### See Also

[[TBILLYIELD]]: Calculates the yield of a US Treasury Bill based on price.

[[TBILLPRICE]]: Calculates the price of a US Treasury Bill based on discount rate.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdFlHay1xOWk3aVRYSnJqSmRNamhhLXc&amp;output=html" width="500"></iframe>