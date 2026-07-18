---
name: 'N'
category: info
syntax: N(value)
status: imported
description: Returns the argument provided as a number.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093357?hl=en).

Returns the argument provided as a number.

### Sample Usage

```gse
N(A2)
N(4)
```

### Syntax

```gse
N(value)
```

- `value` - The argument to be converted to a number.

  + If `value` is `TRUE`, `N` returns `1`.
  + If `value` is a number, the number is returned.
  + If `value` is a date or time, `N` returns a generated serial number, based on the number of days since December 30, 1899.

    1. Negative values are interpreted as days before this date, and fractional values indicate time of day past midnight.
  + If `value` is `FALSE` or any value not listed above, `N` returns `0`.

### Notes

- When using `N` on numeric values in other cells, formatting (into currencies, scientific notation, etc.) is lost. To specify formatting on the return value of `N`, simply apply the format desired to the cell containing the formula.
- This function is, in fact, rarely necessary as Google Spreadsheet automatically converts between most formats appropriately. It is provided primarily for compatibility with formulas used in other spreadsheet packages.

### See Also

[[TO_DATE]]: Converts a provided number to a date.

[[T]]: Returns string arguments as text.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdDllV181M21lcFdlNFFNQkV5NnRGakE&amp;output=html" width="500"></iframe>