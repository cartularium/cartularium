---
name: IMDIV
category: engineering
syntax: IMDIV(dividend, divisor)
status: imported
description: Returns one complex number divided by another.
tags:
  - modified
  - undocumented
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/7411898?hl=en).

Returns one complex number divided by another.

### Sample Usage

```gse
IMDIV("11+16i", "3+2i")
IMDIV("4+2j", 2)
```

### Syntax

```gse
IMDIV(dividend, divisor)
```

- `dividend` - The complex number to be divided.
- `divisor` - The complex number to divide by.

### Notes

- The division between two complex numbers is defined as follows:
  + ![IMDIV Equation](https://lh3.googleusercontent.com/BBZ_bfTHCciVL1mc6XEePQB9P9ZcfgKJCyFWh3kr6Jij52jeoAqT_IO-HD1VyULOHQ=w150)
- You can divide two complex numbers only if they have the same suffix (i or j). For example, you can't do `IMDIV("4+3i", "1+2j")`.

### Engine compatibility

Ordinary complex division is portable, but **division by a zero divisor produces different error codes**. Excel, `formulas`, HyperFormula, and IronCalc treat a zero-modulus denominator as a numeric-domain failure and return `#NUM!`; Google Sheets and Lattice surface the underlying division and return `#DIV/0!` (assay: IMDIV/imdiv-by-zero; live probe, 2026-07-11). A formula guarded with [[IFERROR]] or `ISERR` catches both, but one that branches on the specific error via `ERROR.TYPE` is not portable. pycel does not implement IMDIV.

| Engine | Behavior |
| --- | --- |
| Google Sheets | Ordinary division supported; `IMDIV("1+2i","0")` → `#DIV/0!`. |
| Excel | Ordinary division supported; divide-by-zero → `#NUM!`. |
| HyperFormula | Divide-by-zero → `#NUM!` (live probe, 2026-07-11). |
| IronCalc | Divide-by-zero → `#NUM!` (live probe, 2026-07-11). |
| formulas | Divide-by-zero → `#NUM!` (live probe, 2026-07-11). |
| pycel | Not implemented; returns `#NAME?`. |
| Lattice | Divide-by-zero → `#DIV/0!`. |

### See also

- [[COMPLEX]]: The COMPLEX function creates a complex number, given real and imaginary coefficients.
- [[IMREAL]]: Returns the real coefficient of a complex number.
- [[IMAGINARY]]: Returns the imaginary coefficient of a complex number.
- [[IMPRODUCT]]: Returns the result of multiplying a series of complex numbers together.

### Examples

| 2 | Formula | Result |
| --- | --- | --- |
| **3** | `=IMDIV("11+16i", "3+2i")` | 5+2i |
| **4** | `=IMDIV("4+2j", 2)` | 2+j |
| **5** | `=IMDIV(COMPLEX(11, 16), COMPLEX(3, 2))` | 5+2i |