---
name: SUM
category: math
syntax: SUM(value1, [value2, ...])
status: imported
description: Returns the sum of a series of numbers and/or cells.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093669?hl=en).

Returns the sum of a series of numbers and/or cells.

### Sample Usage

```gse
SUM(A2:A100)
SUM(1,2,3,4,5)
SUM(1,2,A2:A50)
```

### Syntax

```gse
SUM(value1, [value2, ...])
```

- `value1` - The first number or range to add together.
- `value2, ...` - **[** OPTIONAL **]** - Additional numbers or ranges to add to `value1`.

### Notes

- If only a single number for `value1` is supplied, `SUM` returns `value1`.
- Although `SUM` is specified as taking a maximum of 30 arguments, Google Sheets supports an arbitrary number of arguments for this function.

### See Also

[[SUMSQ]]: Returns the sum of the squares of a series of numbers and/or cells.

[[SUMIF]]: Returns a conditional sum across a range.

[[SERIESSUM]]: Given parameters `x`, `n`, `m`, and `a`, returns the power series sum a1xn + a2x(n+m) + ... + aix(n+(i-1)m), where i is the number of entries in range `a`.

[[QUOTIENT]]: Returns one number divided by another, without the remainder.

[[PRODUCT]]: Returns the result of multiplying a series of numbers together.

[[MULTIPLY]]: Returns the product of two numbers. Equivalent to the `\*` operator.

[[MINUS]]: Returns the difference of two numbers. Equivalent to the `-` operator.

[[DIVIDE]]: Returns one number divided by another. Equivalent to the `/` operator.

[[ADD]]: Returns the sum of two numbers. Equivalent to the `+` operator.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdHBPcnExTWRZZFlLV2Vyc2E4VUtYbkE&amp;output=html" width="500"></iframe>

[Make a copy](https://docs.google.com/spreadsheets/d/1TWu3KtnbJba1TiJP0rJaiGzHF1lNT-AbTRBR0Fi_hH4/copy)