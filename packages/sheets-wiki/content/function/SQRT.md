---
name: SQRT
category: math
syntax: SQRT(value)
status: imported
description: Returns the positive square root of a positive number.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093577?hl=en).

Returns the positive square root of a positive number.

### Sample Usage

```gse
SQRT(9)
SQRT(A2)
```

### Syntax

```gse
SQRT(value)
```

- `value` - The number for which to calculate the positive square root.

  + `value` must be positive; if it is negative, `SQRT` will return the `#NUM!` error.

### Notes

- To find the negative root of `value`, simply multiply the result of the `SQRT` function call by `-1`.

### See Also

[[SQRTPI]]: Returns the positive square root of the product of Pi and the given positive number.

[[POWER]]: Returns a number raised to a power.

[[LOG10]]: Returns the logarithm of a number, base 10.

[[LOG]]: Returns the logarithm of a number given a base.

[[LN]]: Returns the logarithm of a number, base e (Euler's number).

[[GAMMALN]]: Returns the logarithm of a specified Gamma function, base e (Euler's number).

[[EXP]]: Returns Euler's number, e (~2.718) raised to a power.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdERPRGN1Y2NGS3hSNjI3MTJCNnl5R1E&amp;output=html" width="500"></iframe>