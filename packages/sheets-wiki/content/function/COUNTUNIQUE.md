---
name: COUNTUNIQUE
category: math
syntax: COUNTUNIQUE(column)
status: imported
description: Counts the number of unique values in a list of specified values and ranges.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093405?hl=en).

Counts the number of unique values in a list of specified values and ranges.

COUNTUNIQUE for BigQuery

Counts the number of unique values in a data column

### Sample Usage

```gse
COUNTUNIQUE(table_name!fruits)
```

### Syntax

```gse
COUNTUNIQUE(column)
```

- `column`: The data column to consider for uniqueness.

**Tip:** Counting unique rows across multiple columns is not supported

### Sample Usage

```gse
COUNTUNIQUE(A1:C100)
COUNTUNIQUE(1,1,2,3,5,8,13,A2,B6:B9)
```

### Syntax

```gse
COUNTUNIQUE(value1, [value2, ...])
```

- `value1` - The first value or range to consider for uniqueness.
- `value2, ...` - **[** OPTIONAL **]** - Additional values or ranges to consider for uniqueness.

### Notes

- Although `COUNTUNIQUE` is specified as taking a maximum of 30 arguments, Google Sheets supports an arbitrary number of arguments for this function.

### See Also

[[DCOUNTA]]: Counts values, including text, selected from a database table-like array or range using a SQL-like query.

[[DCOUNT]]: Counts numeric values selected from a database table-like array or range using a SQL-like query.

[[COUNTIF]]: Returns a conditional count across a range.

[[COUNTA]]:

Returns the number of values in a dataset.

[[COUNTBLANK]]: Returns the number of empty cells in a given range.

[[COUNT]]:

Returns the number of numeric values in a dataset.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdHFZaGREbTJkR3hjclVBWTRQODkwakE&amp;output=html" width="500"></iframe>