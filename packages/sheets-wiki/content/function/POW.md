---
name: POW
category: operator
syntax: POW(base, exponent)
status: imported
description: Returns a number raised to a power.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093603?hl=en).

Returns a number raised to a power.

### Sample Usage

```gse
POW(4,0.5)
POW(A2,B2)
POW(2,5)
```

### Syntax

```gse
POW(base, exponent)
```

- `base` - The number to raise to the `exponent` power.

  + If `base` is negative, `exponent` must be an integer.
- `exponent` - The exponent to raise `base` to.

### Notes

- `POW` is equivalent to the `POWER` function.

### See Also

[[SQRTPI]]: Returns the positive square root of the product of Pi and the given positive number.

[[SQRT]]: Returns the positive square root of a positive number.

[[POWER]]: Returns a number raised to a power.

[[LOG10]]: Returns the logarithm of a number, base 10.

[[LOG]]: Returns the logarithm of a number given a base.

[[LN]]: Returns the logarithm of a number, base e (Euler's number).

[[GAMMALN]]: Returns the logarithm of a specified Gamma function, base e (Euler's number).

[[EXP]]: Returns Euler's number, e (~2.718) raised to a power.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdEpTVkRHZ1Jwb0k1YnVRaHhpTHI5akE&amp;output=html" width="500"></iframe>