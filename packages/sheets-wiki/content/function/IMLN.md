---
name: IMLN
category: math
syntax: IMLN(number)
status: imported
description: The `IMLN` function returns the logarithm of a complex number, base e (Euler's number).
tags:
  - modified
  - undocumented
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9000651?hl=en).

The `IMLN` function returns the logarithm of a complex number, base e (Euler's number).

### Syntax

```gse
IMLN(number)
```

- `number` - The input value of the logarithm function.
  + The number can be written as plain numbers, e.g. 1, to be interpreted as a real number.
  + The number can be written as quoted text in order to specify both the real and complex coefficients.

### Sample formulas

```gse
IMLN("3+4i")
IMLN(A2)
IMLN("4+2j")
```

### Notes

- `IMLN` is equivalent to `LN` for all non-complex values that are greater than zero.
- `IMLN` is equivalent to `LOG` given base of `e`, or `EXP(1)`, for all non-complex values that are greater than zero.
- The natural logarithm of a complex number is defined as follows:
  + ln(x+yi) = √(x2+y2) + i tan-1(y/x)

### Examples

|  | A | B |
| --- | --- | --- |
| 1 | **Formula** | **Result** |
| 2 | `=IMLN("1+i")` | 0.346573590279973+0.785398163397448i |
| 3 | `=IMLN("4+2j")` | 1.497866136777+0.463647609000806i |
| 4 | `=IMLN("-4.6")` | 1.52605630349505+3.14159265358979i |

### Engine compatibility

IMLN is implemented by every tracked engine except pycel (`#NAME?`). The result is returned as **text**, so the cross-engine difference is in rendering, not value: every engine computes the same complex number, but Excel, Google Sheets, and IronCalc cap each component at ~15 significant digits while `formulas`, HyperFormula, and Lattice emit the full IEEE-754 double. For example `IMLN("3+4i")` renders as `1.6094379124341+0.927295218001612i` (15-digit family) versus `1.6094379124341003+0.9272952180016122i` (full-double family) — the same value (assay: IMLN/imln-of-complex; IMLN-IMPOWER-IMSQRT deep dive, 2026-07-11). Do not string-compare IMLN output across engines; use [[IMREAL]] and [[IMAGINARY]] to get numeric components.

| Engine | Behavior |
| --- | --- |
| Google Sheets | Supported; ~15-significant-digit rendering. |
| Excel | Supported; ~15-significant-digit rendering. |
| HyperFormula | Supported; full-double rendering (live probe, 2026-07-11). |
| IronCalc | Supported; ~15-digit rendering (live probe, 2026-07-11). |
| formulas | Supported; full-double rendering (live probe, 2026-07-11). |
| pycel | Not implemented; returns `#NAME?` (live probe, 2026-07-11). |
| Lattice | Supported; full-double rendering. |

### Related functions

[[LN]]: Returns the logarithm of a number, base e (Euler's number).

[[COMPLEX]]: The COMPLEX function creates a complex number, given real and imaginary coefficients.

[[IMAGINARY]]: Returns the imaginary coefficient of a complex number.

[[IMREAL]]: Returns the real coefficient of a complex number.

[[LOG10]]: Returns the logarithm of a number, base 10.

[[LOG]]: Returns the logarithm of a number given a base.

[[EXP]]: Returns Euler's number, e (~2.718) raised to a power.
