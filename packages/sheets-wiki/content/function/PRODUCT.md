---
name: PRODUCT
category: math
syntax: PRODUCT(factor1, [factor2, ...])
status: imported
description: Returns the result of multiplying a series of numbers together.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093502?hl=en).

Returns the result of multiplying a series of numbers together.

### Sample Usage

```gse
PRODUCT(A2:A100)
PRODUCT(1,2,3,4,5,A2:A100)
```

### Syntax

```gse
PRODUCT(factor1, [factor2, ...])
```

- `factor1` - The first number or range to calculate for the product.
- `factor2 ... factor 30` - **[** OPTIONAL **]** - Additional values to multiply by.

### Notes

- If only a single number for `factor1` is supplied, `PRODUCT` returns `factor1`.
- Each `factor` may be a number or a range. If a range, empty cells are ignored.
- Although `PRODUCT` is specified as taking a maximum of 30 arguments, Google Sheets supports an arbitrary number of arguments for this function.

### See Also

[[SUM]]: Returns the sum of a series of numbers and/or cells.

[[QUOTIENT]]: Returns one number divided by another, without the remainder.

[[MULTIPLY]]: Returns the product of two numbers. Equivalent to the `\*` operator.

[[MINUS]]: Returns the difference of two numbers. Equivalent to the `-` operator.

[[DIVIDE]]: Returns one number divided by another. Equivalent to the `/` operator.

[[ADD]]: Returns the sum of two numbers. Equivalent to the `+` operator.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdGlESkIxRHNXMm5JVVVScDl5R0FLWmc&amp;output=html" width="500"></iframe>