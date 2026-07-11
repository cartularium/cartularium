---
name: IMEXP
category: engineering
syntax: IMEXP(exponent)
status: imported
description: The IMEXP function returns Euler's number, e (~2.
tags:
  - modified
  - undocumented
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9198277?hl=en).

The IMEXP function returns Euler's number, e (~2.718) raised to a complex power.

### Syntax

```gse
IMEXP(exponent)
```

- `exponent` - The exponent to raise e to.

### Sample formulas

```gse
IMEXP("2+3i")
IMEXP("2-4j")
IMEXP(COMPLEX(2, 3))
```

### Notes

- The exponential of a complex number is defined as follows:

IMEXP(x+yi) = excos(y) + iexsin(y)

### Examples

| 1 | Formula | Result |
| --- | --- | --- |
| **2** | =IMEXP("1+i") | 1.46869393991589+2.28735528717884i |
| **3** | =IMEXP("2-2j") | -3.07493232063936-6.71884969742825j |

### Engine compatibility

IMEXP is implemented by every tracked engine except pycel, which returns `#NAME?` for the whole transcendental complex family. Because the result is returned as **text**, the portability trap is rendering, not value: every engine computes the same complex number to ~15 significant digits, but they serialize it differently. Excel, Google Sheets, and IronCalc cap each component at ~15 significant digits (Excel's classic display precision), while `formulas`, HyperFormula, and Lattice print the raw IEEE-754 double (16–17 digits). The 15-digit cap holds at larger magnitudes too: `IMEXP("10+3i")` = -21806.035863485+3108.37503049351i on Excel (live probe, 2026-07-11). Do not string-compare or hash IMEXP output across engines; if you need the components, use [[IMREAL]] and [[IMAGINARY]], which return numbers (assay: IMEXP forks; IM-TRANSCENDENTAL deep dive, 2026-07-11).

| Engine | Behavior |
| --- | --- |
| Google Sheets | Supported; components rendered to ~15 significant digits. |
| Excel | Supported; ~15 significant digits, e.g. `IMEXP("10+3i")` = -21806.035863485+3108.37503049351i (live probe, 2026-07-11). |
| HyperFormula | Supported; full-double rendering (live probe, 2026-07-11). |
| IronCalc | Supported; ~15-digit rendering (live probe, 2026-07-11). |
| formulas | Supported; full-double rendering (live probe, 2026-07-11). |
| pycel | Not implemented; returns `#NAME?` (live probe, 2026-07-11). |
| Lattice | Supported; full-double rendering. |

### Related functions

- [[EXP]]: Returns Euler's number, e (~2.718) raised to a power.
- [[IMLN]]: The `IMLN` function returns the logarithm of a complex number, base e (Euler's number).
- [[COMPLEX]]: The COMPLEX function creates a complex number, given real and imaginary coefficients.
- [[IMAGINARY]]: Returns the imaginary coefficient of a complex number.
