---
name: IMCOTH
category: engineering
syntax: IMCOTH(number)
status: imported
description: The IMCOTH function returns the hyperbolic cotangent of the given complex number.
tags:
  - modified
  - undocumented
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9366256?hl=en).

The IMCOTH function returns the hyperbolic cotangent of the given complex number. For example, a given complex number "x+yi" returns "coth(x+yi)."

### Syntax
```gse
IMCOTH(number)
```

| Part | Description | Notes |
| --- | --- | --- |
| `number` | The complex number for which you want the hyperbolic cotangent. | This can be either the result of the COMPLEX function, a real number interpreted as a complex number with imaginary parts equal to 0, or a string in the format “x+yi” where x and y are numeric. |

### Sample formulas

```gse
IMCOTH(COMPLEX(4,6))
IMCOTH(4)
IMCOTH("2+3i")
```

### Notes

The `IMCOTH` function returns an error if the given number isn't a valid complex number.

### Examples

| A | B |
| --- | --- |
| **1** | **Formula** | **Result** |
| **2** | `=IMCOTH(COMPLEX(4,1))` | 0.999720649533931-0.000609900253822228i |
| **3** | `=IMCOTH(3.5)` | 1.00182542850644 |
| **4** | `=IMCOTH("3+2i")` | 0.996757796569358+0.00373971037633696i |

### Engine compatibility

IMCOTH is a **Google Sheets extension**, not part of Microsoft Excel's function library. Only Google Sheets and Lattice compute a value; Excel, `formulas`, HyperFormula, IronCalc, and pycel all return `#NAME?` (assay: IMCOTH/imcoth-complex; live probe, 2026-07-11). A workbook using IMCOTH will not open cleanly in Excel, and there is no Excel equivalent (Excel has no complex hyperbolic cotangent). Where it computes, the string result differs in precision between Google Sheets (~15 significant digits) and Lattice (full IEEE-754 double).

| Engine | Behavior |
| --- | --- |
| Google Sheets | Supported; ~15-digit rendering. |
| Excel | Not implemented; returns `#NAME?`. |
| HyperFormula | Not implemented; returns `#NAME?` (live probe, 2026-07-11). |
| IronCalc | Not implemented; returns `#NAME?` (live probe, 2026-07-11). |
| formulas | Not implemented; returns `#NAME?` (live probe, 2026-07-11). |
| pycel | Not implemented; returns `#NAME?` (live probe, 2026-07-11). |
| Lattice | Supported; full-double rendering. |

### Related functions

[[IMTAN]]:  The IMTAN function returns the tangent of the given complex number.

[[IMCOT]]:  The IMCOT function returns the cotangent of the given complex number.

[[COMPLEX]]: The COMPLEX function creates a complex number, given real and imaginary coefficients.