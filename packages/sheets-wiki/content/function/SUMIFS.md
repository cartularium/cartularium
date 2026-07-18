---
name: SUMIFS
category: math
syntax: SUMIFS(sum_column, criteria_column1, criterion1, criteria_column2, criterion2)
status: imported
description: Returns the sum of a range depending on multiple criteria.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3238496?hl=en).

Returns the sum of a range depending on multiple criteria.

SUMIFS for BigQuery

Returns a conditional sum of a data column depending on multiple criteria.

### Sample Usage

```gse
=SUMIFS(table_name!inventory, table_name!fruits, "Apple", table_name!price, ">5")
```

### Syntax

```gse
SUMIFS(sum_column, criteria_column1, criterion1, criteria_column2, criterion2)
```

- `sum_column` - The data column to sum.
- `criteria_column1`: The data column to check against criterion1.
- `criterion1` - The pattern or test to apply to criteria\_column1.
- `criteria_column2` - Additional data columns to check.
- `criterion2` - Additional criteria to check.

**Tip:** Returning sum across multiple columns is not supported.

### Sample Usage

```gse
SUMIFS(A1:A10, B1:B10, ">20")
SUMIFS(A1:A10, B1:B10, ">20", C1:C10, "<30")
SUMIFS(C1:C100, E1:E100, "Yes")
```

### Syntax

```gse
SUMIFS(sum_range, criteria_range1, criterion1, [criteria_range2, criterion2, ...])
```

- `sum_range` - The range to be summed.
- `criteria_range1` - The range to check against `criterion1`.
- `criterion1` - The pattern or test to apply to `criteria_range1`.
- `criteria_range2, criterion2, ...` - **[** OPTIONAL **]** - Additional ranges and criteria to check.

### See Also

[[SUM]]: Returns the sum of a series of numbers and/or cells.

[[SUMIF]]: Returns a conditional sum across a range.

[[SUMSQ]]: Returns the sum of the squares of a series of numbers and/or cells.

[[SERIESSUM]]: Given parameters `x`, `n`, `m`, and `a`, returns the power series sum a1xn + a2x(n+m) + ... + aix(n+(i-1)m), where i is the number of entries in range `a`.

[[QUOTIENT]]: Returns one number divided by another, without the remainder.

[[PRODUCT]]: Returns the result of multiplying a series of numbers together.

[[MULTIPLY]]: Returns the product of two numbers. Equivalent to the `\*` operator.

[[MINUS]]: Returns the difference of two numbers. Equivalent to the `-` operator.

[[DSUM]]: Returns the sum of values selected from a database table-like array or range using a SQL-like query.

[[DIVIDE]]: Returns one number divided by another. Equivalent to the `/` operator.

[[COUNTIF]]: Returns a conditional count across a range.

[[ADD]]: Returns the sum of two numbers. Equivalent to the `+` operator.