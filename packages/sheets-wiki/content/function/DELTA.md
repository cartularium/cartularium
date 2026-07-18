---
name: DELTA
category: engineering
syntax: DELTA(number1, [number2])
status: imported
description: Compare two numeric values, returning 1 if they're equal.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3401147?hl=en).

Compare two numeric values, returning 1 if they're equal.

### Sample Usage

```gse
DELTA(2, 1)
DELTA(A2)
DELTA(B3, 2)
```

### Syntax

```gse
DELTA(number1, [number2])
```

- `number1` - the first number to compare.
- `number2` - **[** OPTIONAL - `0` by default **]** - the second number to compare.

### Notes

- If the second argument is not provided then `number1` will be compared to zero.
- A blank cell is treated the same as zero.
- This function only compares numbers. To compare other types of values, use the `EQ` function.

### See Also

[[EQ]]: Returns "TRUE" if two specified values are equal and "FALSE" otherwise. Equivalent to the "=" operator.

[[IF]]: Returns one value if a logical expression is `TRUE` and another if it is `FALSE`.

[[SUM]]: Returns the sum of a series of numbers and/or cells.