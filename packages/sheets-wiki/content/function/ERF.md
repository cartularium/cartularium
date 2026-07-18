---
name: ERF
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

The numeric answer is portable within tolerance wherever a form is implemented — `ERF(1)` ≈ 0.8427007929497149, `ERF(0)` = 0 — so the forks are entirely about which of the three call forms each engine accepts. The single non-negative argument works everywhere. The **negative** single argument works everywhere except pycel. The two-argument `ERF(lower, upper)` form is the narrowest: Excel, Google Sheets, HyperFormula, IronCalc, and `formulas` accept it, but Lattice returns `#N/A` and pycel `#NAME?` (assay: ERF/erf-two-arg-lower-upper; live probe, 2026-07-11).

| Engine | Behavior |
| --- | --- |
| Google Sheets | Single argument (including negatives) and the two-argument form. |
| Excel | Same. |
| HyperFormula | Single (including negatives) and two-argument forms; does **not** implement [[ERF.PRECISE]] (`#NAME?`). |
| IronCalc | Single and two-argument forms; also implements ERF.PRECISE. |
| formulas | Single and two-argument forms. |
| pycel | Single **non-negative** argument only. `ERF(-1)` and the two-argument form return `#NAME?` (live probe, 2026-07-11). |
| Lattice | Single argument (including negatives). The two-argument `ERF(lower, upper)` form returns `#N/A`. |

### Related functions

- [[ERFC]]: The ERFC function returns the complementary Gauss error function of a value.
- [[NORMDIST]]: The NORMDIST function returns the value of the normal distribution function (or normal cumulative distribution function) for a specified value, mean, and standard deviation.