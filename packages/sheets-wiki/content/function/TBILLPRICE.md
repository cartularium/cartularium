---
name: TBILLPRICE
category: financial
syntax: TBILLPRICE(settlement, maturity, discount)
status: imported
description: Calculates the price of a US Treasury Bill based on discount rate.
tags:
  - modified
  - undocumented
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093251?hl=en).

Calculates the price of a US Treasury Bill based on discount rate.

### Sample Usage

```gse
TBILLPRICE(DATE(2010,1,2), DATE(2010,12,31), .0125)
TBILLPRICE(A2,B2,C2)
```

### Syntax

```gse
TBILLPRICE(settlement, maturity, discount)
```

- `settlement` - The settlement date of the security, the date after issuance when the security is delivered to the buyer.
- `maturity` - The maturity or end date of the security, when it can be redeemed at face or par value.
- `discount` - The discount rate of the bill at time of purchase.

### Notes

- `settlement` and `maturity` should be entered using `DATE`, `TO_DATE` or other date parsing functions rather than by entering text.
- `TBILLPRICE` is equivalent to using `PRICEDISC` with US Treasury Bill conventions for the absent parameters.
- `maturity` must be one year or less from the `settlement` date.
- `discount` is a percentage and must be entered as a positive number from zero to one.

### Engine compatibility

The Treasury-bill functions are more widely supported than the coupon-bond analytics (PRICE, YIELD, and the like, which HyperFormula and IronCalc lack). TBILLPRICE is implemented by Excel, Google Sheets, HyperFormula, IronCalc, `formulas`, and Lattice; only **pycel** lacks it (`#NAME?`). The day-count is actual/360 by definition and the engines agree on it — the only cross-engine difference is precision: the full-precision engines agree to about `1e-12` (`TBILLPRICE` = 98.39305555555555 on the deep-dive case), while IronCalc returns the same value at a coarser display read-back (98.39). Compare TBILL results to a tolerance (assay: TBILL deep dive, 2026-07-11).

| Engine | Behavior |
| --- | --- |
| Google Sheets | Supported. |
| Excel | Supported. |
| HyperFormula | Supported. |
| IronCalc | Supported; reduced display precision. |
| formulas | Supported. |
| pycel | Not implemented; returns `#NAME?`. |
| Lattice | Supported. |

### See Also

[[TBILLYIELD]]: Calculates the yield of a US Treasury Bill based on price.

[[PRICEDISC]]: Calculates the price of a discount (non-interest-bearing) security, based on expected yield.

[[PRICE]]: Calculates the price of a security paying periodic interest, such as a US Treasury Bond, based on expected yield.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdFdnRzhHdmNyc0owekFyQnk5aFdUYUE&amp;output=html" width="500"></iframe>