---
name: IMLN
category: math
syntax: IMLN(number)
status: imported
description: The `IMLN` function returns the logarithm of a complex number, base e (Euler's number).
tags: []
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

### Related functions

[[LN]]: Returns the logarithm of a number, base e (Euler's number).

[[COMPLEX]]: The COMPLEX function creates a complex number, given real and imaginary coefficients.

[[IMAGINARY]]: Returns the imaginary coefficient of a complex number.

[[IMREAL]]: Returns the real coefficient of a complex number.

[[LOG10]]: Returns the logarithm of a number, base 10.

[[LOG]]: Returns the logarithm of a number given a base.

[[EXP]]: Returns Euler's number, e (~2.718) raised to a power.
