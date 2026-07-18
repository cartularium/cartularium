---
name: SERIESSUM
category: math
syntax: SERIESSUM(x, n, m, a)
status: imported
description: Given parameters `x`, `n`, `m`, and `a`, returns the power series sum a1xn + a2x(n+m) + .
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093444?hl=en).

Given parameters `x`, `n`, `m`, and `a`, returns the power series sum a1xn + a2x(n+m) + ... + aix(n+(i-1)m), where i is the number of entries in range `a`.

### Sample Usage

```gse
SERIESSUM(1,0,1,{FACT(0),FACT(1),FACT(2),FACT(3),FACT(4)})
SERIESSUM(A2,0,2,B2:B10)
```

### Syntax

```gse
SERIESSUM(x, n, m, a)
```

- `x` - The input to the power series. Varies depending on the type of approximation, may be angle, exponent, or some other value.
- `n` - The initial power to which to raise `x` in the power series.
- `m` - The additive increment by which to increase `x`.
- `a` - The array or range containing the coefficients of the power series.

### Notes

- Power series may be used to approximate various constants and functions, including e (Euler's number), logarithms, integrals, trigonometric functions, etc. However, this function is usually used for custom user-defined models.

### See Also

[[SUMSQ]]: Returns the sum of the squares of a series of numbers and/or cells.

[[SUMIF]]: Returns a conditional sum across a range.

[[SUM]]: Returns the sum of a series of numbers and/or cells.

[[QUOTIENT]]: Returns one number divided by another, without the remainder.

[[PRODUCT]]: Returns the result of multiplying a series of numbers together.

[[MULTIPLY]]: Returns the product of two numbers. Equivalent to the `\*` operator.

[[MINUS]]: Returns the difference of two numbers. Equivalent to the `-` operator.

[[DIVIDE]]: Returns one number divided by another. Equivalent to the `/` operator.

[[ADD]]: Returns the sum of two numbers. Equivalent to the `+` operator.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdHJVcmVqYmgwd2hFQWxYVTVfUUt5QXc&amp;output=html" width="500"></iframe>