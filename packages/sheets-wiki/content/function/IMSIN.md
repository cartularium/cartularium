---
name: IMSIN
category: engineering
syntax: IMSIN (number)
status: imported
description: The IMSIN function returns the sine of the given complex number.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9198962?hl=en).

The IMSIN function returns the sine of the given complex number. For example, a given complex number "x+yi" returns "sin(x+yi)."

### Syntax
```gse
IMSIN (number)
```

| Part | Description | Notes |
| --- | --- | --- |
| `number` | The complex number for which you want the sine. | This can be either the result of the COMPLEX function, a real number (which will be interpreted as a complex number with imaginary part equal to 0), or a string in the format "x+ yi" where x and y are numeric. |

### Sample formulas

```gse
IMSIN(COMPLEX(4,6))
IMSIN(4)
IMSIN("2+3i")
```

### Notes

The IMSIN function returns an error if the given number isn't a valid complex number.

### Examples

| 1 | Formula | Result |
| --- | --- | --- |
| **2** | =IMSIN(COMPLEX(4,1)) | -1.16780727488952-0.768162763456573i |
| **3** | =IMSIN(3.5) | -0.35078322768962 |
| **4** | IMSIN=("3+2i") | 0.53092108624852-3.59056458998578i |

### Related functions

- [[IMCOS]]:  The IMCOS function returns the cosine of the given complex number.
- [[COMPLEX]]: The COMPLEX function creates a complex number, given real and imaginary coefficients.