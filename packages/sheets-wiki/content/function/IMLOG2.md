---
name: IMLOG2
category: engineering
syntax: IMLOG2(value)
status: imported
description: The IMLOG2 function returns the logarithm of a complex number with base 2.
tags:
  - modified
  - undocumented
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9366426?hl=en).

The IMLOG2 function returns the logarithm of a complex number with base 2.

### Syntax
```gse
IMLOG2(value)
```

| Part | Description | Notes |
| --- | --- | --- |
| `value` | The input value of the logarithm function. | * The number can be written as plain numbers, for example 1, to be interpreted as a real number. * The number can be written as quoted text in order to specify both the real and complex coefficients. |

### Sample formulas

```gse
IMLOG2("1+i", 3.5)
IMLOG2(COMPLEX(25, 34), 2.3)
IMLOG2(100, 10)
```

### Notes

`IMLOG2` is equivalent to `IMLOG` given base of 2 for all numbers.

### Examples

| A | B |
| --- | --- |
| **1** | **Formula** | **Result** |
| **2** | `=IMLOG2("1+i")` | 0.5+1.1330900354568i |
| **3** | `=IMLOG2(COMPLEX(25, 34))` | 5.39923590055081+1.35147863744424i |
| **4** | `=IMLOG2(100)` | 6.64385618977473 |

### Engine compatibility

Unlike its general-base sibling [[IMLOG]] (Google-Sheets-only), IMLOG2 is a standard complex function: it is implemented by every tracked engine except pycel (`#NAME?`). The result is text, so rendering diverges the same way as the rest of the complex family — Excel, Google Sheets, and IronCalc cap at ~15 significant digits; `formulas`, HyperFormula, and Lattice emit full IEEE-754 double.

IMLOG2 also shows the rendering artifact at its sharpest: `IMLOG2("8")` is mathematically exactly 3, and most engines print `"3"`, but `formulas` computes `ln(8)/ln(2)` in double precision — the division lands one ULP low — and round-trips it to the string `"2.9999999999999996"` (assay: IMLOG-family; IM-TRANSCENDENTAL deep dive, 2026-07-11). It is a display artifact, not a wrong answer. Do not string-compare IMLOG2 output across engines.

| Engine | Behavior |
| --- | --- |
| Google Sheets | Supported; ~15-digit rendering. |
| Excel | Supported; ~15-digit rendering. |
| HyperFormula | Supported; full-double rendering (live probe, 2026-07-11). |
| IronCalc | Supported; ~15-digit rendering (live probe, 2026-07-11). |
| formulas | Supported; full-double; `IMLOG2("8")` prints `2.9999999999999996` (live probe, 2026-07-11). |
| pycel | Not implemented; returns `#NAME?` (live probe, 2026-07-11). |
| Lattice | Supported; full-double rendering. |

### Related functions

[[IMLOG]]: The IMLOG function returns the logarithm of a complex number for a specified base.

[[IMLOG10]]: The IMLOG10 function returns the logarithm of a complex number with base 10.

[[COMPLEX]]: The COMPLEX function creates a complex number, given real and imaginary coefficients.

[[IMAGINARY]]: Returns the imaginary coefficient of a complex number.

[[IMREAL]]: Returns the real coefficient of a complex number.