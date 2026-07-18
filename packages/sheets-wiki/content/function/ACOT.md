---
name: ACOT
category: math
syntax: ACOT(value)
status: imported
description: The ACOT function returns the inverse cotangent of a value in radians.
tags:
  - modified
  - undocumented
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9084227?hl=en).

The ACOT function returns the inverse cotangent of a value in radians.

### Syntax
```gse
ACOT(value)
```

| Part | Description | Notes |
| --- | --- | --- |
| `value` | The value for which to calculate the inverse cotangent. | * Values must be a number. |

### Sample formulas

```gse
ACOT(0)
ACOT(-1)
ACOT(A1)
```

### Notes

- In Google Sheets, ACOT computes `ATAN(1/value)`, so its results fall in the range (-π/2, π/2). Negative inputs return negative results — `ACOT(-4) = -0.2449786631`, as the examples below show. This differs from Excel, where ACOT returns a value in (0, π); see the Engine compatibility section.
- ACOT is sometimes written as "arccot" or "cot-1(x)" in mathematics or other programs.
- Use the DEGREES function to convert the result of ACOT from radians to degrees.

### Examples

This example shows the inverse cotangent of numbers in radians:

| A | B |
| --- | --- |
| **1** | **Formula** | **Result** |
| **2** | =ACOT(4) | 0.2449786631 |
| **3** | =ACOT(-4) | -0.2449786631 |
| **4** | =ACOT(0) | 1.570796327 |

This example shows the inverse cotangent of numbers converted to degrees:

| A | B | C |
| --- | --- | --- |
| **1** | **Data** | **Formula** | **Result** |
| **2** | 4 | =DEGREES(ACOT(A2)) | 14.03624347 |
| **3** | -4 | =DEGREES(ACOT(A3)) | -14.03624347 |
| **4** | 0 | =DEGREES(ACOT(A4)) | 90 |



### Engine compatibility

For non-negative arguments every engine agrees (`ACOT(0)` = π/2, `ACOT(1)` = π/4). For **negative** arguments there are two standard-but-incompatible definitions of arccotangent, and the choice is not portable between Excel and Google Sheets. Excel, IronCalc, `formulas`, and Lattice place ACOT on the principal range (0, π), so `ACOT(-1)` = 3π/4 ≈ 2.356194490192345 and `ACOT(-0.5)` = π + ATAN(-2) ≈ 2.0344439357957027 (Excel live probe, 2026-07-11). Google Sheets and HyperFormula instead compute `ATAN(1/x)`, range (-π/2, π/2), so `ACOT(-1)` = -π/4 ≈ -0.7853981633974483. The two conventions agree for x ≥ 0 and differ by exactly π for x < 0. Any sheet that relies on the sign or range of ACOT for negative inputs is not portable between the two products.

| Engine | Behavior |
| --- | --- |
| Google Sheets | `ATAN(1/x)` branch, range (-π/2, π/2); `ACOT(-1)` = -0.7853981633974483. |
| Excel | Principal branch (0, π); `ACOT(-1)` = 2.356194490192345, `ACOT(-0.5)` = 2.0344439357957027 (live probe, 2026-07-11). |
| HyperFormula | `ATAN(1/x)` branch, matches Google Sheets (live probe, 2026-07-11). |
| IronCalc | Principal branch (0, π), matches Excel (live probe, 2026-07-11). |
| formulas | Principal branch (0, π), matches Excel (live probe, 2026-07-11). |
| pycel | Not implemented; returns `#NAME?` for the whole ACOT/ACOTH family (live probe, 2026-07-11). |
| Lattice | Principal branch (0, π), matches Excel (recorded fixture). |

The Google Sheets value in the table is from recorded fixtures reproduced on HyperFormula; a live gsheets re-confirmation of `ACOT(-0.5)` is still open.

### Related functions

- [[ACOTH]]: The ACOTH function returns the inverse hyperbolic cotangent of a value in radians.
- [[COT]]: The COT function returns the cotangent of an angle provided in radians.
- [[COTH]]: The COTH function returns the hyperbolic cotangent of any real number.
- [[ATANH]]: The ATANH function returns the inverse hyperbolic tangent of a number.
- [[ATAN]]: The ATAN function returns the inverse tangent of a value in radians.
- [[ASINH]]: The ASINH function returns the inverse hyperbolic sine of a number.
- [[ASIN]]: The ASIN function returns the inverse sine of a value in radians.
- [[ACOSH]]: The ACOSH function returns the inverse hyperbolic cosine of a number.
- [[ACOS]]: The ACOS function returns the inverse cosine of a value in radians.
- [[DEGREES]]: The DEGREES function converts an angle value in radians to degrees.
- [[RADIANS]]: The RADIANS function converts an angle value in degrees to radians.
- [[PI]]: The PI function returns the value of pi to 9 decimal places.