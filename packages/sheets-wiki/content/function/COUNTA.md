---
name: COUNTA
category: statistical
syntax: COUNTA(value1, [value2, ...])
status: imported
description: Returns the number of values in a dataset.
tags: [modified, undocumented]
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093991?hl=en).

Returns the number of values in a dataset.

### Sample Usage

```gse
COUNTA(A2:A100,B2:B100,4,26)
COUNTA(1,2,3,4,5,C6:C20)
```

### Syntax

```gse
COUNTA(value1, [value2, ...])
```

- `value1` - The first value or range to consider when counting.
- `value2, ...` - **[** OPTIONAL **]** - Additional values or ranges to consider when counting.

### Notes

- Although `COUNTA` is specified as taking a maximum of 30 arguments, Google Sheets supports an arbitrary number of arguments for this function.
- `COUNTA` counts all values in a dataset, including those which appear more than once and text values (including zero-length strings and whitespace). To count unique values, use `COUNTUNIQUE`. To count only numeric values use `COUNT`.

### See Also

[[MODE]]: Returns the most commonly occurring value in a dataset.

[[DCOUNTA]]: Counts values, including text, selected from a database table-like array or range using a SQL-like query.

[[DCOUNT]]: Counts numeric values selected from a database table-like array or range using a SQL-like query.

[[COUNTUNIQUE]]: Counts the number of unique values in a list of specified values and ranges.

[[COUNTIF]]: Returns a conditional count across a range.

[[COUNTBLANK]]: Returns the number of empty cells in a given range.

[[COUNT]]:

Returns the number of numeric values in a dataset.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdGpvSWFLVE0wMVpXR1kwVjM4ZUZmdVE&amp;output=html" width="500"></iframe>