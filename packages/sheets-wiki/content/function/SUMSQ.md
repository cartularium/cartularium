---
name: SUMSQ
category: math
syntax: SUMSQ(value1, [value2, ...])
status: imported
description: Returns the sum of the squares of a series of numbers and/or cells.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093714?hl=en).

Returns the sum of the squares of a series of numbers and/or cells.

### Sample Usage

```gse
SUMSQ(A2:A100)
SUMSQ(1,2,3,4,5)
SUMSQ(1,2,A2:A50)
```

### Syntax

```gse
SUMSQ(value1, [value2, ...])
```

- `value1` - The first number or range whose squares to add together.
- `value2, ...` - **[** OPTIONAL **]** - Additional numbers or ranges whose squares to add to the square(s) of `value1`.

### Notes

- If only a single number for `value1` is supplied, `SUMSQ` returns `value1` squared.
- Although `SUMSQ` is specified as taking a maximum of 30 arguments, Google Sheets supports an arbitrary number of arguments for this function.

### See Also

[[SUM]]: Returns the sum of a series of numbers and/or cells.

[[SUMIF]]: Returns a conditional sum across a range.

[[SERIESSUM]]: Given parameters `x`, `n`, `m`, and `a`, returns the power series sum a1xn + a2x(n+m) + ... + aix(n+(i-1)m), where i is the number of entries in range `a`.

[[QUOTIENT]]: Returns one number divided by another, without the remainder.

[[PRODUCT]]: Returns the result of multiplying a series of numbers together.

[[MULTIPLY]]: Returns the product of two numbers. Equivalent to the `\*` operator.

[[MINUS]]: Returns the difference of two numbers. Equivalent to the `-` operator.

[[DIVIDE]]: Returns one number divided by another. Equivalent to the `/` operator.

[[ADD]]: Returns the sum of two numbers. Equivalent to the `+` operator.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdHFZSTEwR0Q2cFNXLTFCWUs0eFBpM0E&amp;output=html" width="500"></iframe>