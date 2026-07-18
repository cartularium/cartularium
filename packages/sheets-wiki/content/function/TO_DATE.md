---
name: TO_DATE
category: parser
syntax: TO_DATE(value)
status: imported
description: Converts a provided number to a date.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094239?hl=en).

Converts a provided number to a date.

### Sample Usage

```gse
TO_DATE(25405)
TO_DATE(A2)
TO_DATE(40826.4375)
```

### Syntax

```gse
TO_DATE(value)
```

- `value` - The argument or reference to a cell to be converted to a date.

  + If `value` is a number or a reference to a cell containing a numeric value, `TO_DATE` returns `value` converted to a date, interpreting `value` as number of days since December 30, 1899.

    1. Negative values are interpreted as days before this date, and fractional values indicate time of day past midnight.
  + If `value` is not a number or a reference to a cell containing a numeric value, `TO_DATE` returns `value` without modification.

### Notes

- `TO_DATE` does not autoconvert number formats in the same way as direct entry into cells. Therefore, `TO_DATE(10/10/2000)` is interpreted as `TO_DATE(0.0005)`, the quotient of 10 divided by 10 divided by 2000.
- `TO_DATE` is not as commonly used as [[DATE]], which takes a year, month, and day in numeric format as inputs.
- `TO_DATE` is the inverse of `N` as applied to a date, and equivalent to applying **Format** ![and then](https://lh3.googleusercontent.com/QbWcYKta5vh_4-OgUeFmK-JOB0YgLLoGh69P478nE6mKdfpWQniiBabjF7FVoCVXI0g=h36) **Number** ![and then](https://lh3.googleusercontent.com/QbWcYKta5vh_4-OgUeFmK-JOB0YgLLoGh69P478nE6mKdfpWQniiBabjF7FVoCVXI0g=h36) **Date time** from the menu bar.

### See Also

[[DATE]]: Converts a year, month, and day into a date.

[[TO_TEXT]]: Converts a provided numeric value to a text value.

[[TO_PURE_NUMBER]]: Converts a provided date/time, percentage, currency or other formatted numeric value to a pure number without formatting.

[[TO_PERCENT]]: Converts a provided number to a percentage.

[[TO_DOLLARS]]: Converts a provided number to a dollar value.

[[N]]: Returns the argument provided as a number.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdGM1Y01GeERINjRDUzZaemlGby1McGc&amp;output=html" width="500"></iframe>