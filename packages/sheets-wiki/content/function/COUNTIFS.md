---
name: COUNTIFS
category: math
syntax: COUNTIFS(criteria_column1, criterion1, criteria_column2, criterion2)
status: imported
description: Returns the count of a range depending on multiple criteria.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3256550?hl=en).

Returns the count of a range depending on multiple criteria.

COUNTIFS for BigQuery

Returns the count of rows depending on multiple criteria

### Sample Usage

```gse
COUNTIFS(table_name!fruits, “Apple”, table_name!inventory, “<30”)
```

### Syntax

```gse
COUNTIFS(criteria_column1, criterion1, criteria_column2, criterion2)
```

- `criteria_column1` - The data column to check against `criterion1`.
- `criterion1` - The pattern or test to apply to `criteria\_column1`.
- `criteria_column2` - Additional data column to check.
- `criterion2` - Additional criteria to check.

### Sample Usage

```gse
COUNTIFS(A1:A10, ">20", B1:B10, "<30")
COUNTIFS(A7:A24, ">6", B7:B24, "<"&DATE(1969,7,20))
COUNTIFS(B8:B27, ">" & B12, C8:C27, "<" & C13, D8:D27, “<>10”)
COUNTIFS(C1:C100, "Yes")
```

### Syntax

```gse
COUNTIFS(criteria_range1, criterion1, [criteria_range2, criterion2, ...])
```

- `criteria_range1` - The range to check against `criterion1`.
- `criterion1` - The pattern or test to apply to `criteria_range1`.
- `criteria_range2, criterion2...` - **[** OPTIONAL **]** - Additional ranges and criteria to check; repeatable.

### Notes

- Any additional ranges must contain the same number of rows and columns as `criteria_range1`.

### See Also

[[COUNTIF]]: Returns a conditional count across a range.

[[COUNT]]:

Returns the number of numeric values in a dataset.

[[SUMIFS]]: Returns the sum of a range depending on multiple criteria.

[[AVERAGEIFS]]: Returns the average of a range depending on multiple criteria.

[[IF]]: Returns one value if a logical expression is `TRUE` and another if it is `FALSE`.