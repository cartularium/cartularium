---
name: QUOTIENT
category: math
syntax: QUOTIENT(dividend, divisor)
status: imported
description: Returns one number divided by another, without the remainder.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093436?hl=en).

Returns one number divided by another, without the remainder.

### Sample Usage

```gse
QUOTIENT(4,2)
QUOTIENT(A2,B2)
```

### Syntax

```gse
QUOTIENT(dividend, divisor)
```

- `dividend` - The number to be divided.
- `divisor` - The number to divide by (cannot equal `0`).

### Notes

- `QUOTIENT` performs a division, but will only return the quotient and not the remainder. To see the full result (quotient and remainder), use the `DIVIDE` function or the '/' operator.

### See Also

[[SUM]]: Returns the sum of a series of numbers and/or cells.

[[PRODUCT]]: Returns the result of multiplying a series of numbers together.

[[MULTIPLY]]: Returns the product of two numbers. Equivalent to the `\*` operator.

[[MINUS]]: Returns the difference of two numbers. Equivalent to the `-` operator.

[[DIVIDE]]: Returns one number divided by another. Equivalent to the `/` operator.

[[ADD]]: Returns the sum of two numbers. Equivalent to the `+` operator.