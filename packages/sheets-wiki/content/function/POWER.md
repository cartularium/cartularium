---
name: POWER
category: math
syntax: POWER(base, exponent)
status: imported
description: Returns a number raised to a power.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093433?hl=en).

Returns a number raised to a power.

### Sample Usage

```gse
POWER(4,0.5)
POWER(A2,B2)
POWER(2,5)
```

### Syntax

```gse
POWER(base, exponent)
```

- `base` - The number to raise to the `exponent` power.
- `exponent` - The exponent to raise `base` to.

### See Also

[[SQRTPI]]: Returns the positive square root of the product of Pi and the given positive number.

[[SQRT]]: Returns the positive square root of a positive number.

[[LOG10]]: Returns the logarithm of a number, base 10.

[[LOG]]: Returns the logarithm of a number given a base.

[[LN]]: Returns the logarithm of a number, base e (Euler's number).

[[GAMMALN]]: Returns the logarithm of a specified Gamma function, base e (Euler's number).

[[EXP]]: Returns Euler's number, e (~2.718) raised to a power.

### Examples

### 

### General use of POWER function

| **Result** | **Formula** |
| --- | --- |
| 16 | `=POWER(2, 4)` |
| 5.196152423 | `=POWER(3, 1.5)` |
| 0 | `=POWER(0, 10)` |
| 1 | `=POWER(10, 0)` |
| -2 | `=POWER(-8, 1/3)` |

[Make a Copy](https://docs.google.com/spreadsheets/d/1K8RBOvj5kwMIMo8XAU7_4wffL-35kNLkYiLfCbQWGr8/copy)