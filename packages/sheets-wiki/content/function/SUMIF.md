---
name: SUMIF
category: math
syntax: SUMIF(criteria_column, criterion, sum_column)
status: imported
description: Returns a conditional sum across a range.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093583?hl=en).

Returns a conditional sum across a range.

### Examples

[Make a copy](https://docs.google.com/spreadsheets/d/1s2FxfaIiMrZLPvqjUvOcWt1yHuRQ8w5N7eIEKNxa48Q/copy)

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdEI3dVJIMTl2OGQ2S2o2VzZKSnVIa3c&amp;output=html" width="500"></iframe>

SUMIF for BigQuery

Returns a conditional sum of a data column.

### Sample Usage

```gse
=SUMIF(table_name!price, ">5", table_name!inventory)
```

### Syntax

```gse
SUMIF(criteria_column, criterion, sum_column)
```

- `criteria_column` - The data column which is tested against criterion.
- `criterion` - The pattern or test to apply to criteria\_column.
- `sum_column` - The data column to be summed, if different from `criteria\_column`.

**Tip:** Returning sum across multiple columns is not supported.

### Sample Usage

```gse
SUMIF(A1:A10,">20")
SUMIF(A1:A10,"Paid",B1:B10)
```

### Syntax

```gse
SUMIF(range, criterion, [sum_range])
```

- `range` - The range which is tested against `criterion`.
- `criterion` - The pattern or test to apply to `range`.

  + If `range` contains text to check against, `criterion` must be a string. `criterion` can contain wildcards including `?` to match any single character or `*` to match zero or more contiguous characters. To match an actual question mark or asterisk, prefix the character with the tilde (`~`) character (i.e. `~?` and `~*`). A string criterion must be enclosed in quotation marks. Each cell in `range` is then checked against `criterion` for equality (or match, if wildcards are used).
  + If `range` contains numbers to check against, `criterion` may be either a string or a number. If a number is provided, each cell in `range` is checked for equality with `criterion`. Otherwise, `criterion` may be a string containing a number (which also checks for equality), or a number prefixed with any of the following operators: `=` (checks for equality), `>` (checks that the range cell value is greater than the criterion value), or `<` (checks that the range cell value is less than the criterion value)
- `sum_range` - The range to be summed, if different from `range`.

### Notes

- `SUMIF` can only perform conditional sums with a single criterion. To use multiple criteria, use the database function `DSUM`.

### See Also

[[SUMSQ]]: Returns the sum of the squares of a series of numbers and/or cells.

[[SUM]]: Returns the sum of a series of numbers and/or cells.

[[SERIESSUM]]: Given parameters `x`, `n`, `m`, and `a`, returns the power series sum a1xn + a2x(n+m) + ... + aix(n+(i-1)m), where i is the number of entries in range `a`.

[[QUOTIENT]]: Returns one number divided by another, without the remainder.

[[PRODUCT]]: Returns the result of multiplying a series of numbers together.

[[MULTIPLY]]: Returns the product of two numbers. Equivalent to the `\*` operator.

[[MINUS]]: Returns the difference of two numbers. Equivalent to the `-` operator.

[[DSUM]]: Returns the sum of values selected from a database table-like array or range using a SQL-like query.

[[DIVIDE]]: Returns one number divided by another. Equivalent to the `/` operator.

[[COUNTIF]]: Returns a conditional count across a range.

[[ADD]]: Returns the sum of two numbers. Equivalent to the `+` operator.