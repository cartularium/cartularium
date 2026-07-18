---
name: ERF.PRECISE
category: engineering
syntax: ERF(lower_bound, [upper_bound])
status: imported
description: The ERF function returns the integral of the Gauss error function over an interval of values.
tags:
  - modified
  - undocumented
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9116267?hl=en).

The ERF function returns the integral of the Gauss error function over an interval of values.

### Syntax
```gse
ERF(lower_bound, [upper_bound])
```

| Part | Description | Notes |
| --- | --- | --- |
| `lower_bound` | If this parameter is the only parameter, the integral is taken between 0 and this value. If z2 is provided, it refers to the lower boundary for the integral. |  |
| `upper_bound` | The upper boundary of the integral. | Upper boundaries are optional. |

### Sample formulas

```gse
ERF(-2.3, -0.7)
ERF(1)
```

### Notes

If the lower or upper boundaries are non-numeric, ERF returns "`#VALUE!`."

### Examples

| A | B |
| --- | --- |
| **1** | **Formula** | **Result** |
| **2** | ERF(-2.3, -0.7) | 0.3210556296 |
| **3** | ERF(1) | 0.8427007929 |

### Engine compatibility

`ERF.PRECISE(x)` is the single-argument variant introduced in Excel 2010; for one argument it equals [[ERF]] to about 15 significant digits (`ERF.PRECISE(1)` ≈ 0.8427007929497149, `ERF.PRECISE(-0.5)` ≈ -0.5204998778130465). Support is narrower than plain ERF: **HyperFormula and pycel do not implement it** and return `#NAME?`. Consumers targeting HyperFormula should prefer `ERF`, which HyperFormula does support.

| Engine | Behavior |
| --- | --- |
| Google Sheets | Supported. |
| Excel | Supported (added in Excel 2010). |
| HyperFormula | Not implemented; returns `#NAME?` (live probe, 2026-07-11). Plain `ERF` works. |
| IronCalc | Supported (live probe, 2026-07-11). |
| formulas | Supported. |
| pycel | Not implemented; returns `#NAME?` (live probe, 2026-07-11). |
| Lattice | Supported. |

### Related functions

- [[ERFC]]: The ERFC function returns the complementary Gauss error function of a value.
- [[NORMDIST]]: The NORMDIST function returns the value of the normal distribution function (or normal cumulative distribution function) for a specified value, mean, and standard deviation.