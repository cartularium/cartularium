---
name: IMSECH
category: engineering
syntax: IMSECH(number)
status: imported
description: The IMSECH function returns the hyperbolic secant of the given complex number.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9366440?hl=en).

The IMSECH function returns the hyperbolic secant of the given complex number.
 For example, a given complex number "x+yi" returns "sech(x+yi)."

### Syntax
```gse
IMSECH(number)
```

| Part | Description | Notes |
| --- | --- | --- |
| `number` | The complex number for which you want the hyperbolic secant. | This can be either the result of the COMPLEX function, a real number interpreted as a complex number with imaginary parts equal to 0, or a string in the format “x+yi” where x and y are numeric. |

### Sample formulas

```gse
IMSECH(COMPLEX(4,6))
IMSECH(4)
IMSECH("2+3i")
```

### Notes

The `IMSECH` function returns an error if the given number isn't a valid complex number.

### Examples

| A | B |
| --- | --- |
| **1** | **Formula** | **Result** |
| **2** | `=IMSECH(COMPLEX(4,1))` | 0.0198041304666168-0.0308224192896954i |
| **3** | `=IMSECH(3.5)` | 0.0603397441201677 |
| **4** | `=IMSECH("3+2i")` | -0.0416749644111443-0.0906111371962376i |

### Related functions

[[IMCOSH]]:  The IMCOSH function returns the hyperbolic cosine of the given complex number.

[[IMSECH]]:  The IMSECH function returns the hyperbolic secant of the given complex number.

[[COMPLEX]]: The COMPLEX function creates a complex number, given real and imaginary coefficients.