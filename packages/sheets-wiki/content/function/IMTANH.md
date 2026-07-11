---
name: IMTANH
category: engineering
syntax: IMTANH(number)
status: imported
description: The IMTANH function returns the hyperbolic tangent of the given complex number.
tags:
  - modified
  - undocumented
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9366655?hl=en).

The IMTANH function returns the hyperbolic tangent of the given complex number. For example, a given complex number "x+yi" returns "tanh(x+yi)."

### Syntax
```gse
IMTANH(number)
```

| Part | Description | Notes |
| --- | --- | --- |
| `number` | The complex number for which you want the hyperbolic tangent. | This can be either the result of the COMPLEX function, a real number interpreted as a complex number with imaginary parts equal to 0, or a string in the format “x+yi” where x and y are numeric. |

### Sample formulas

```gse
IMTANH(COMPLEX(4,6))
IMTANH(4)
IMTANH("2+3i")
```

### Notes

The `IMTANH` function returns an error if the given number isn't a valid complex number.

### Examples

| A | B |
| --- | --- |
| **1** | **Formula** | **Result** |
| **2** | `=IMTANH(COMPLEX(4,1))` | 1.00027905623447+0.00061024092137626i |
| **3** | `=IMTANH(3.5)` | 0.998177897611199 |
| **4** | `=IMTANH("3+2i")` | 1.00323862735361-0.00376402564150425i |

### Engine compatibility

IMTANH is a **Google Sheets extension**, not part of Microsoft Excel's function library. Only Google Sheets and Lattice compute a value; Excel, `formulas`, HyperFormula, IronCalc, and pycel all return `#NAME?` (assay: IMTANH/imtanh-complex; live probe, 2026-07-11). A workbook using IMTANH will not open cleanly in Excel, and there is no Excel equivalent (Excel has no complex hyperbolic tangent). Where it computes, the string result differs in precision between Google Sheets (~15 significant digits) and Lattice (full IEEE-754 double).

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

- [[IMTAN]]:  The IMTAN function returns the tangent of the given complex number.
- [[COMPLEX]]: The COMPLEX function creates a complex number, given real and imaginary coefficients.