---
name: IMSINH
category: engineering
syntax: IMSINH(number)
status: imported
description: The IMSINH function returns the hyperbolic sine of the given complex number.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9366445?hl=en).

The IMSINH function returns the hyperbolic sine of the given complex number.
 For example, a given complex number "x+yi" returns "sinh(x+yi)."

### Syntax
```gse
IMSINH(number)
```

| Part | Description | Notes |
| --- | --- | --- |
| `number` | The complex number for which you want the hyperbolic sine. | This can be either the result of the COMPLEX function, a real number interpreted as a complex number with imaginary parts equal to 0, or a string in the format “x+yi” where x and y are numeric. |

### Sample formulas

```gse
IMSINH(COMPLEX(4,6))
IMSINH(4)
IMSINH("2+3i")
```

### Notes

The `IMSINH` function returns an error if the given number isn't a valid complex number.

### Examples

| A | B |
| --- | --- |
| **1** | **Formula** | **Result** |
| **2** | `=IMSINH(COMPLEX(4,1))` | 14.7448051885587+22.9790855778861i |
| **3** | `=IMSINH(3.5)` | 16.542627287635 |
| **4** | `=IMSINH("3+2i")` | -4.16890695996657+9.15449914691143i |

### Related functions

[[IMSIN]]:  The IMSIN function returns the sine of the given complex number.

[[COMPLEX]]: The COMPLEX function creates a complex number, given real and imaginary coefficients.

[[IMCOSH]]:  The IMCOSH function returns the hyperbolic cosine of the given complex number.