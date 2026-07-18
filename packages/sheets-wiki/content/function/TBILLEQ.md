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

### Engine compatibility

The Treasury-bill functions are more widely supported than the coupon-bond analytics. TBILLEQ is implemented by Excel, Google Sheets, HyperFormula, IronCalc, `formulas`, and Lattice; only **pycel** lacks it (`#NAME?`). The five full-precision engines agree to about `1e-12` (`TBILLEQ(DATE(2011,2,15), DATE(2011,5,15), 0.065)` = 0.066979094617… on the deep-dive case), and IronCalc returns the same value at a coarser display read-back (0.067). Compare TBILL results to a tolerance, not exact equality (assay: TBILL deep dive, 2026-07-11).

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

[[TBILLPRICE]]: Calculates the price of a US Treasury Bill based on discount rate.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdFlHay1xOWk3aVRYSnJqSmRNamhhLXc&amp;output=html" width="500"></iframe>