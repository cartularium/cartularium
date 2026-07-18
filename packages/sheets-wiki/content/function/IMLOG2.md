---
name: IMLOG2
category: engineering
syntax: IMLOG2(value)
status: imported
description: The IMLOG2 function returns the logarithm of a complex number with base 2.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9366426?hl=en).

The IMLOG2 function returns the logarithm of a complex number with base 2.

### Syntax
```gse
IMLOG2(value)
```

| Part | Description | Notes |
| --- | --- | --- |
| `value` | The input value of the logarithm function. | * The number can be written as plain numbers, for example 1, to be interpreted as a real number. * The number can be written as quoted text in order to specify both the real and complex coefficients. |

### Sample formulas

```gse
IMLOG2("1+i", 3.5)
IMLOG2(COMPLEX(25, 34), 2.3)
IMLOG2(100, 10)
```

### Notes

`IMLOG2` is equivalent to `IMLOG` given base of 2 for all numbers.

### Examples

| A | B |
| --- | --- |
| **1** | **Formula** | **Result** |
| **2** | `=IMLOG2("1+i")` | 0.5+1.1330900354568i |
| **3** | `=IMLOG2(COMPLEX(25, 34))` | 5.39923590055081+1.35147863744424i |
| **4** | `=IMLOG2(100)` | 6.64385618977473 |

### Related functions

[[IMLOG]]: The IMLOG function returns the logarithm of a complex number for a specified base.

[[IMLOG10]]: The IMLOG10 function returns the logarithm of a complex number with base 10.

[[COMPLEX]]: The COMPLEX function creates a complex number, given real and imaginary coefficients.

[[IMAGINARY]]: Returns the imaginary coefficient of a complex number.

[[IMREAL]]: Returns the real coefficient of a complex number.