---
name: IMSIN
category: engineering
syntax: IMSIN (number)
status: imported
description: The IMSIN function returns the sine of the given complex number.
tags:
  - modified
  - undocumented
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9198962?hl=en).

The IMSIN function returns the sine of the given complex number. For example, a given complex number "x+yi" returns "sin(x+yi)."

### Syntax
```gse
IMSIN (number)
```

| Part | Description | Notes |
| --- | --- | --- |
| `number` | The complex number for which you want the sine. | This can be either the result of the COMPLEX function, a real number (which will be interpreted as a complex number with imaginary part equal to 0), or a string in the format "x+ yi" where x and y are numeric. |

### Sample formulas

```gse
IMSIN(COMPLEX(4,6))
IMSIN(4)
IMSIN("2+3i")
```

### Notes

The IMSIN function returns an error if the given number isn't a valid complex number.

### Examples

| 1 | Formula | Result |
| --- | --- | --- |
| **2** | =IMSIN(COMPLEX(4,1)) | -1.16780727488952-0.768162763456573i |
| **3** | =IMSIN(3.5) | -0.35078322768962 |
| **4** | IMSIN=("3+2i") | 0.53092108624852-3.59056458998578i |

### Engine compatibility

IMSIN is implemented by every tracked engine except pycel (`#NAME?`). The result is text, so the cross-engine difference is rendering: every engine computes the same complex value, but Excel, Google Sheets, and IronCalc cap each component at ~15 significant digits while `formulas`, HyperFormula, and Lattice emit the full IEEE-754 double. For example `IMSIN("1+1i")` renders `1.29845758141598+0.634963914784736i` (15-digit family) versus `1.2984575814159773+0.6349639147847361i` (full-double family) — the same value (assay: IMSIN forks; IM-TRANSCENDENTAL deep dive, 2026-07-11). Do not string-compare IMSIN output across engines; use [[IMREAL]] and [[IMAGINARY]] for numeric components.

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

- [[IMCOS]]:  The IMCOS function returns the cosine of the given complex number.
- [[COMPLEX]]: The COMPLEX function creates a complex number, given real and imaginary coefficients.