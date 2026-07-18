---
name: IMARGUMENT
category: engineering
syntax: '=IMARGUMENT(number)'
status: imported
description: The IMARGUMENT function returns the angle (also known as the argument, or theta) of the given complex number in radians.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9116360?hl=en).

The IMARGUMENT function returns the angle (also known as the argument, or theta) of the given complex number in radians. This is the angle θ such that, for any complex number in Cartesian form x + yi, x + yi = reiθ where r is the magnitude of the number.

### Syntax
```gse
=IMARGUMENT(number)
```

| Part | Description | Notes |
| --- | --- | --- |
| number | The complex number whose argument will be calculated. | This can be either the result of the COMPLEX function, a real number (which is interpreted as a complex number with imaginary part equal to 0),  or a string in the format “x + yi” where x and y are numeric. |

### Sample formulas

```gse
IMARGUMENT(COMPLEX(4, 6)
IMARGUMENT(4)
IMARGUMENT("2+3I")
```

### Notes

The IMARGUMENT function returns an error if the given number isn't a valid complex number, or is 0.

### Examples

| A | B |
| --- | --- |
| **1** | **Formula** | **Result** |
| **2** | =IMARGUMENT(COMPLEX(0, 1)) | 1.570796327 |
| **3** | =IMARGUMENT(1) | 0 |
| **4** | =IMARGUMENT("1+1i") | 0.7853981634 |

### Related function

[[COMPLEX]]: The COMPLEX function creates a complex number, given real and imaginary coefficients.