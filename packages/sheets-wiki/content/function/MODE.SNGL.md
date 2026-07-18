---
name: MODE.SNGL
category: statistical
syntax: MODE(value1, [value2, ...])
status: imported
description: Returns the most commonly occurring value in a dataset.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094029?hl=en).

Returns the most commonly occurring value in a dataset.

### Sample Usage

```gse
MODE(A2:A100,B2:B100,4,26)
MODE(1,2,3,4,5,C6:C20)
```

### Syntax

```gse
MODE(value1, [value2, ...])
```

- `value1` - The first value or range to consider when calculating mode.
- `value2, ...` - **[** OPTIONAL **]** - Additional values or ranges to consider when calculating mode.

### Notes

- Although `MODE` is specified as taking a maximum of 30 arguments, Google Sheets supports an arbitrary number of arguments for this function.

### See Also

[[DCOUNTA]]: Counts values, including text, selected from a database table-like array or range using a SQL-like query.

[[DCOUNT]]: Counts numeric values selected from a database table-like array or range using a SQL-like query.

[[COUNTUNIQUE]]: Counts the number of unique values in a list of specified values and ranges.

[[COUNTIF]]: Returns a conditional count across a range.

[[COUNTBLANK]]: Returns the number of empty cells in a given range.

[[COUNTA]]:

Returns the number of values in a dataset.

[[COUNT]]:

Returns the number of numeric values in a dataset.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdDE2UlVpN0MxNGxBZHc0emUwY2huQ3c&amp;output=html" width="500"></iframe>