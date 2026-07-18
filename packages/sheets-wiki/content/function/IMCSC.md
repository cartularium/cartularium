---
name: IMCSC
category: engineering
syntax: IMCSC(number)
status: imported
description: The IMCSC function returns the cosecant of the given complex number.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9199155?hl=en).

The IMCSC function returns the cosecant of the given complex number. For example, a given complex number "x+yi" returns "csc(x+yi)."

### Syntax
```gse
IMCSC(number)
```

| Part | Description | Notes |
| --- | --- | --- |
| `number` | The complex number for which you want the cosecant. | This can be either the result of the COMPLEX function, a real number (which will be interpreted as a complex number with imaginary part equal to 0), or a string in the format "x+yi" where x and y are numeric. |

### Sample formulas

```gse
IMCSC(COMPLEX(4, 6))
IMCSC(4)
IMCSC("2+3i")
```

### Notes

The IMCSC function returns an error if the given number isn’t a valid complex number or if the cosecant function is undefined for the given number.

### Examples

| 1 | Formula | Result |
| --- | --- | --- |
| **2** | =IMCSC(COMPLEX(4, 3)) | -0.0754898329158637+0.0648774713706355i |
| **3** | =IMCSC(0.213) | 4.73052448711521 |
| **4** | =IMCSC("2-2i") | 0.244687073586957-0.107954592221385i |

### Related functions

- [[COMPLEX]]: The COMPLEX function creates a complex number, given real and imaginary coefficients.