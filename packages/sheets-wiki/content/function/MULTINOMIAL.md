---
name: MULTINOMIAL
category: math
syntax: MULTINOMIAL(value1, [value2, ...])
status: imported
description: Returns the factorial of the sum of values divided by the product of the values' factorials.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093429?hl=en).

Returns the factorial of the sum of values divided by the product of the values' factorials.

### Sample Usage

```gse
MULTINOMIAL(1,2,3)
MULTINOMIAL(A2:A9)
```

### Syntax

```gse
MULTINOMIAL(value1, [value2, ...])
```

- `value1` - The first value or range to consider.
- `value2, ...` - Additional values or ranges to consider.

### Notes

- Although `MULTINOMIAL` is specified as taking a maximum of 30 arguments, Google Sheets supports an arbitrary number of arguments for this function.

### See Also

[[FACTDOUBLE]]: Returns the "double factorial" of a number.

[[FACT]]: The FACT function returns the factorial of a number.

[[COMBIN]]: The COMBIN function returns the number of ways to choose some number of objects from a pool of a given size of objects.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdEJiMVBZandsWS1DY3NIc244VWZLZ0E&amp;output=html" width="500"></iframe>