---
name: IMCOTH
category: engineering
syntax: IMCOTH(number)
status: imported
description: The IMCOTH function returns the hyperbolic cotangent of the given complex number.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9366256?hl=en).

The IMCOTH function returns the hyperbolic cotangent of the given complex number. For example, a given complex number "x+yi" returns "coth(x+yi)."

### Syntax
```gse
IMCOTH(number)
```

| Part | Description | Notes |
| --- | --- | --- |
| `number` | The complex number for which you want the hyperbolic cotangent. | This can be either the result of the COMPLEX function, a real number interpreted as a complex number with imaginary parts equal to 0, or a string in the format “x+yi” where x and y are numeric. |

### Sample formulas

```gse
IMCOTH(COMPLEX(4,6))
IMCOTH(4)
IMCOTH("2+3i")
```

### Notes

The `IMCOTH` function returns an error if the given number isn't a valid complex number.

### Examples

| A | B |
| --- | --- |
| **1** | **Formula** | **Result** |
| **2** | `=IMCOTH(COMPLEX(4,1))` | 0.999720649533931-0.000609900253822228i |
| **3** | `=IMCOTH(3.5)` | 1.00182542850644 |
| **4** | `=IMCOTH("3+2i")` | 0.996757796569358+0.00373971037633696i |

### Related functions

[[IMTAN]]:  The IMTAN function returns the tangent of the given complex number.

[[IMCOT]]:  The IMCOT function returns the cotangent of the given complex number.

[[COMPLEX]]: The COMPLEX function creates a complex number, given real and imaginary coefficients.