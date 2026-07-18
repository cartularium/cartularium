---
name: COUNTIF
category: math
syntax: COUNTIF(criteria_column, criterion)
status: imported
description: Returns a conditional count across a range.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093480?hl=en).

Returns a conditional count across a range.

[COUNTIF Function](https://www.youtube.com/watch?v=WA0QZvanWb4)

For this same video with audio descriptions: [COUNTIF Function](https://youtu.be/jbcuBJhrSJQ)

To get an example spreadsheet and follow along with the video, click “Make a Copy” below.

[Make a copy](https://docs.google.com/spreadsheets/d/1O0294rwuZ9C3q1wcb4GtRixypUZat_sVtxbcEiy99TM/copy)

COUNTIF for BigQuery

Returns a conditional count of rows across a data column.

### Sample Usage

```gse
COUNTIF(table_name!score, “>90”)
```

### Syntax

```gse
COUNTIF(criteria_column, criterion)
```

- `criteria_column`: The data column that is tested against `criterion`.
- `criterion`: The pattern or test to apply to `column`.

**Tip:** Counting unique rows across multiple columns is not supported

### Sample Usage

```gse
COUNTIF(A1:A10,">20")
COUNTIF(A1:A10,"Paid")
```

### Syntax

```gse
COUNTIF(range, criterion)
```

- `range` - The range that is tested against `criterion`.
- `criterion` - The pattern or test to apply to `range`.

  + If `range` contains text to check against, `criterion` must be a string. `criterion` can contain wildcards including `?` to match any single character or `*` to match zero or more contiguous characters. To match an actual question mark or asterisk, prefix the character with the tilde (`~`) character (i.e. `~?` and `~*`). A string criterion must be enclosed in quotation marks. Each cell in `range` is then checked against `criterion` for equality (or match, if wildcards are used).
  + If `range` contains numbers to check against, `criterion` may be either a string or a number. If a number is provided, each cell in `range` is checked for equality with `criterion`. Otherwise, `criterion` may be a string containing a number (which also checks for equality), or a number prefixed with any of the following operators: `=`, `>`, `>=`, `<`, or `<=`, which check whether the range cell is equal to, greater than, greater than or equal to, less than, or less than or equal to the criterion value, respectively.

### Notes

- `COUNTIF` can only perform conditional counts with a single criterion. To use multiple criteria, use `COUNTIFS` or the database functions `DCOUNT` or `DCOUNTA`.
- `COUNTIF` is not case sensitive.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdEtFeEZoN2tiMUtQWUV2OE1tRDBNQXc&amp;output=html" width="500"></iframe>

### [Make a copy](https://docs.google.com/spreadsheets/d/1PYoKCYZAkWSaMBsiTyvxZzCCt2WQ-QKOC763RWHMB7c/copy)

### See Also

[[COUNTIFS]]: Returns the count of a range depending on multiple criteria.

[[SUMIF]]: Returns a conditional sum across a range.

[[DCOUNTA]]: Counts values, including text, selected from a database table-like array or range using a SQL-like query.

[[DCOUNT]]: Counts numeric values selected from a database table-like array or range using a SQL-like query.

[[COUNTUNIQUE]]: Counts the number of unique values in a list of specified values and ranges.

[[COUNTA]]: Returns the number of values in a dataset.

[[COUNTBLANK]]: Returns the number of empty cells in a given range.

[[COUNT]]: Returns the number of numeric values in a dataset.