---
name: IMCOSH
category: engineering
syntax: IMCOSH(number)
status: imported
description: The IMCOSH function returns the hyperbolic cosine of the given complex number.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9366233?hl=en).

The IMCOSH function returns the hyperbolic cosine of the given complex number.  For example, a given complex number "x+yi" returns "cosh(x+yi)."

### Syntax
```gse
IMCOSH(number)
```

| Part | Description | Notes |
| --- | --- | --- |
| `number` | The complex number for which you want the hyperbolic cosine. | This can be either the result of the COMPLEX function, a real number interpreted as a complex number with imaginary parts equal to 0, or a string in the format “x+yi” where x and y are numeric. |

### Sample formulas

```gse
IMCOSH(COMPLEX(4, 6))
IMCOSH(4)
IMCOSH("2+3i")
```

### Notes

The `IMCOSH` function returns an error if the given number isn't a valid complex number.

### Examples

| A | B |
| --- | --- |
| **1** | **Formula** | **Result** |
| **2** | `=IMCOSH(COMPLEX(4, 1))` | 14.7547011704838+22.963673499193i |
| **3** | `=IMCOSH(3.5)` | 16.5728246710573 |
| **4** | `=IMCOSH("3+2i")` | -4.18962569096881+9.10922789375534i |

### Related function

[[COMPLEX]]: The COMPLEX function creates a complex number, given real and imaginary coefficients.

[[IMCOS]]: The IMCOS function returns the cosine of the given complex number.

[[IMSINH]]: The IMSINH function returns the hyperbolic sine of the given complex number.