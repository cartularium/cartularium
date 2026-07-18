---
name: TO_TEXT
category: parser
syntax: TO_TEXT(value)
status: imported
description: Converts a provided numeric value to a text value.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094285?hl=en).

Converts a provided numeric value to a text value.

### Sample Usage

```gse
TO_TEXT(24)
TO_TEXT(A2)
```

### Syntax

```gse
TO_TEXT(value)
```

- `value` - The argument or reference to a cell to be converted to text.

  + If `value` is a number or a reference to a cell containing a numeric value, `TO_TEXT` returns `value` as a string, with existing formatting retained. Currencies appear as currencies, decimals as decimals, percentages as percentages, and dates as dates.
  + If `value` is not a number or a reference to a cell containing a numeric value, `TO_TEXT` returns `value` without modification.

### Notes

- `TO_TEXT` is equivalent to prefixing a number with an apostrophe (')

### See Also

[[TO_PERCENT]]: Converts a provided number to a percentage.

[[TO_DOLLARS]]: Converts a provided number to a dollar value.

[[TO_DATE]]: Converts a provided number to a date.

[[N]]: Returns the argument provided as a number.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdFlTVGhIdkpLUENLUElGRDllWklCaGc&amp;output=html" width="500"></iframe>