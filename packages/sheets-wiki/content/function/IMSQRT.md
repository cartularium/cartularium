---
name: IMSQRT
category: math
syntax: IMSQRT(complex_number)
status: imported
description: The `IMSQRT` function computes the square root of a complex number.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9003168?hl=en).

The `IMSQRT` function computes the square root of a complex number.

### Syntax

```gse
IMSQRT(complex_number)
```

- `complex_number` - The complex number to take the square root of.

### Sample formulas

```gse
IMSQRT(2)
IMSQRT("3+2i")
```

### Notes

- This function is equivalent to using `IMPOWER(complex_number, 0.5).`
- While it is not possible to use the `SQRT` function to take the square root of a negative real number, it is possible to use `IMSQRT` to take the square root of a complex number with a negative real number component.

### Examples

|  | A | B |
| --- | --- | --- |
| 1 | **Formula** | **Result** |
| 2 | `=IMSQRT(4)` | 2 |
| 3 | `=IMSQRT("3+4i")` | 2+i |
| 4 | `=IMSQRT("3-4j")` | 2-j |
| 5 | `=IMSQRT(COMPLEX(3, 4))` | 2+i |

### Related functions

[[IMPOWER]]: The `IMPOWER` function returns a complex number raised to a power.

[[COMPLEX]]: The COMPLEX function creates a complex number, given real and imaginary coefficients.
