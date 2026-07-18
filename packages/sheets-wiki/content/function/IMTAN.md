---
name: IMTAN
category: engineering
syntax: IMTAN(number)
status: imported
description: The IMTAN function returns the tangent of the given complex number.
tags:
  - modified
  - undocumented
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9203334?hl=en).

The IMTAN function returns the tangent of the given complex number. For example, a given complex number "x+yi" returns "tan(x+yi)."

### Syntax
```gse
IMTAN(number)
```

| **Part** | **Description** | **Notes** |
| --- | --- | --- |
| `number` | The complex number for which you want the tangent. | This can be either the result of the COMPLEX function, a real number (which will be interpreted as a complex number with imaginary part equal to 0), or a string in the format "x+yi" where x and y are numeric. |

### Sample formulas

```gse
IMTAN(COMPLEX(4, 6))
IMTAN(4)
IMTAN("2+3i")
```

### Notes

The IMTAN function returns an error if the given number isn’t a valid complex number or if the tangent function is undefined for the given number.

### Examples

| 1 | Formula | Result |
| --- | --- | --- |
| **2** | =IMTAN(COMPLEX(4, 3)) | 0.00490825806749606+1.00070953606723i |
| **3** | =IMTAN(0.213) | 0.216280749620508 |
| **4** | =IMTAN("2-2i") | -0.0283929528682323-1.02383559457047i |

### Engine compatibility

IMTAN is implemented by every tracked engine except pycel (`#NAME?`). The result is text, so the cross-engine difference is rendering: every engine computes the same complex value, but Excel, Google Sheets, and IronCalc cap each component at ~15 significant digits while `formulas`, HyperFormula, and Lattice emit the full IEEE-754 double (`IMTAN("1+1i")` = `0.271752585319512+1.08392332733869i` on the 15-digit engines). For functions like IMTAN whose complex arithmetic can be decomposed differently (e.g. `sin/cos` vs `1/cot`), the full-double engines sometimes disagree with each other in the last one or two digits as well — all the same value under numeric tolerance (assay: IMTAN forks; IM-TRANSCENDENTAL deep dive, 2026-07-11). Do not string-compare IMTAN output across engines; use [[IMREAL]] and [[IMAGINARY]] for numeric components.

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

- [[COMPLEX]]: The COMPLEX function creates a complex number, given real and imaginary coefficients.
- [[IMSIN]]: The IMSIN function returns the sine of the given complex number.
- [[IMCOS]]: The IMCOS function returns the cosine of the given complex number.