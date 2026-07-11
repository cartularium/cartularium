---
name: ACOTH
category: math
syntax: ACOTH(value)
status: imported
description: The ACOTH function returns the inverse hyperbolic cotangent of a value in radians.
tags:
  - modified
  - undocumented
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9084097?hl=en).

The ACOTH function returns the inverse hyperbolic cotangent of a value in radians.

### Syntax
```gse
ACOTH(value)
```

| Part | Description | Notes |
| --- | --- | --- |
| `value` | The value for which to calculate the inverse hyperbolic cotangent. | * Values must not be a number between -1 and 1. |

### Sample formulas

```gse
ACOTH(2)
ACOTH(10)
ACOTH(A1)
```

### Notes

- If a number between -1 and 1 is passed to ACOTH, then the #NUM error is returned.
- ACOTH is sometimes written as "arccoth" or "coth-1(x)" in mathematics or other programs.
- Use the DEGREES function to convert the result of ACOTH from radians to degrees.

### Examples

| A | B | C |
| --- | --- | --- |
| **1** | **Date** | **Formula** | **Result** |
| **2** | 4 | =ACOTH(A2) | 0.2554128119 |
| **3** | -4 | =ACOTH(A3) | -0.2554128119 |
| **4** |  | =ACOTH(10) | 0.1003353477 |

### Engine compatibility

Unlike [[ACOT]], ACOTH has no branch-cut ambiguity: it is defined only for |x| > 1, and every implementing engine agrees on both the values (`ACOTH(2)` = 0.5493061, `ACOTH(-2)` = -0.5493061) and the domain error. An argument with |x| < 1 (or exactly ±1) returns `#NUM!` — confirmed live on Excel for `ACOTH(0.5)` (probe, 2026-07-11). The only fork is pycel, which does not implement ACOTH.

| Engine | Behavior |
| --- | --- |
| Google Sheets | Supported; `#NUM!` for \|x\| < 1. |
| Excel | Supported; `ACOTH(0.5)` → `#NUM!` (live probe, 2026-07-11). |
| HyperFormula | Supported (live probe, 2026-07-11). |
| IronCalc | Supported (live probe, 2026-07-11). |
| formulas | Supported (live probe, 2026-07-11). |
| pycel | Not implemented; returns `#NAME?` (live probe, 2026-07-11). |
| Lattice | Supported. |

### Related functions

- [[ACOT]]: The ACOT function returns the inverse cotangent of a value in radians.
- [[COTH]]: The COTH function returns the hyperbolic cotangent of any real number.
- [[COT]]: The COT function returns the cotangent of an angle provided in radians.
- [[ATANH]]: The ATANH function returns the inverse hyperbolic tangent of a number.
- [[ATAN]]: The ATAN function returns the inverse tangent of a value in radians.
- [[ASINH]]: The ASINH function returns the inverse hyperbolic sine of a number.
- [[ASIN]]: The ASIN function returns the inverse sine of a value in radians.
- [[ACOSH]]: The ACOSH function returns the inverse hyperbolic cosine of a number.
- [[ACOS]]: The ACOS function returns the inverse cosine of a value in radians.
- [[DEGREES]]: The DEGREES function converts an angle value in radians to degrees.
- [[RADIANS]]: The RADIANS function converts an angle value in degrees to radians.
- [[PI]]: The PI function returns the value of pi to 9 decimal places.