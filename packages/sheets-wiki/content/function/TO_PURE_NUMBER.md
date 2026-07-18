---
name: TO_PURE_NUMBER
category: parser
syntax: TO_PURE_NUMBER(value)
status: imported
description: Converts a provided date/time, percentage, currency or other formatted numeric value to a pure number without formatting.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094243?hl=en).

Converts a provided date/time, percentage, currency or other formatted numeric value to a pure number without formatting.

### Sample Usage

```gse
TO_PURE_NUMBER(50%)
TO_PURE_NUMBER(A2)
```

### Syntax

```gse
TO_PURE_NUMBER(value)
```

- `value` - The argument or reference to a cell to be converted to a pure number.

  + If `value` is a number or a reference to a cell containing a numeric value, `TO_PURE_NUMBER` returns `value` with all formatting and interpretation removed.
  + If `value` is not a number or a reference to a cell containing a numeric value, `TO_PERCENT` returns `value` without modification.

### Notes

- `TO_PURE_NUMBER` is similar to applying Format -> Number -> Normal from the menu bar, except that the Normal format includes commas denoting thousands, millions, etc.
- `TO_PURE_NUMBER` is similar to `N`, except that `N` returns `0` for non-numeric values except for `TRUE` which returns `1`, whereas `TO_PURE_NUMBER` returns the value passed without modification for all non-numeric types.

### See Also

[[TO_TEXT]]: Converts a provided numeric value to a text value.

[[TO_PERCENT]]: Converts a provided number to a percentage.

[[TO_DOLLARS]]: Converts a provided number to a dollar value.

[[TO_DATE]]: Converts a provided number to a date.

[[N]]: Returns the argument provided as a number.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdDNyMEIzek1OdEdqTndCeEJ3NC1ZU1E&amp;output=html" width="500"></iframe>