---
name: IMLOG10
category: engineering
syntax: IMLOG10(value)
status: imported
description: The IMLOG10 function returns the logarithm of a complex number with base 10.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9366497?hl=en).

The IMLOG10 function returns the logarithm of a complex number with base 10.

### Syntax
```gse
IMLOG10(value)
```

| Part | Desription | Notes |
| --- | --- | --- |
| `value` | The input value of the logarithm function. | * The number can be written as plain numbers, for example 1, to be interpreted as a real number. * The number can be written as quoted text in order to specify both the real and complex coefficients. |

### Sample formulas

```gse
IMLOG10("1+i", 3.5)
IMLOG10(COMPLEX(25, 34), 2.3)
IMLOG10(100, 10)
```

### Note

`IMLOG10` is equivalent to `IMLOG` given base of 10 for all numbers.

### Examples

| A | B |
| --- | --- |
| **1** | **Formula** | **Result** |
| **2** | `=IMLOG10("1+i")` | 0.150514997831991+0.34109408846046i |
| **3** | `=IMLOG10(COMPLEX(25, 34))` | 1.62533195973162+0.406835608369804i |
| **4** | `=IMLOG10(100)` | 2 |

### Related functions

[[IMLOG]]: The IMLOG function returns the logarithm of a complex number for a specified base.

[[IMLOG2]]: The IMLOG2 function returns the logarithm of a complex number with base 2.

[[COMPLEX]]: The COMPLEX function creates a complex number, given real and imaginary coefficients.

[[IMAGINARY]]: Returns the imaginary coefficient of a complex number.

[[IMREAL]]: Returns the real coefficient of a complex number.