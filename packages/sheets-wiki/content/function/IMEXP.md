---
name: IMEXP
category: engineering
syntax: IMEXP(exponent)
status: imported
description: The IMEXP function returns Euler's number, e (~2.
tags:
  - modified
  - undocumented
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9198277?hl=en).

The IMEXP function returns Euler's number, e (~2.718) raised to a complex power.

### Syntax

```gse
IMEXP(exponent)
```

- `exponent` - The exponent to raise e to.

### Sample formulas

```gse
IMEXP("2+3i")
IMEXP("2-4j")
IMEXP(COMPLEX(2, 3))
```

### Notes

- The exponential of a complex number is defined as follows:

IMEXP(x+yi) = excos(y) + iexsin(y)

### Examples

| 1 | Formula | Result |
| --- | --- | --- |
| **2** | =IMEXP("1+i") | 1.46869393991589+2.28735528717884i |
| **3** | =IMEXP("2-2j") | -3.07493232063936-6.71884969742825j |

### Related functions

- [[EXP]]: Returns Euler's number, e (~2.718) raised to a power.
- [[IMLN]]: The `IMLN` function returns the logarithm of a complex number, base e (Euler's number).
- [[COMPLEX]]: The COMPLEX function creates a complex number, given real and imaginary coefficients.
- [[IMAGINARY]]: Returns the imaginary coefficient of a complex number.
