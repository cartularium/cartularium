---
name: AVERAGEIFS
category: statistical
syntax: AVERAGEIFS(average_column, criteria_column1, criterion1, criteria_column2, criterion 2)
status: imported
description: Returns the average of a range depending on multiple criteria.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3256534?hl=en).

Returns the average of a range depending on multiple criteria.

AVERAGEIFS for BigQuery

### Sample Usage

Returns the average of a data column depending on multiple criteria.

### Sample Usage

```gse
AVERAGEIFS(table_name!price, table_name!fruits, “Apple”, table_name!inventory, “<30”)
```

### Syntax

```gse
AVERAGEIFS(average_column, criteria_column1, criterion1, criteria_column2, criterion 2)
```

- `average_column` - The data column to average.
- `criteria_column1` - The data column to check against `criterion1`.
- `criterion1` - The pattern or test to apply to `criteria\_column1`.
- `criteria_column2`- Additional data column to check.
- `criterion 2`- Additional criteria to check.

### Sample Usage

```gse
AVERAGEIFS(A1:A10, B1:B10, ">20")
AVERAGEIFS(A1:A10, B1:B10, ">20", C1:C10, "<30")
AVERAGEIFS(C1:C100, E1:E100, "Yes")
```

### Syntax

```gse
AVERAGEIFS(average_range, criteria_range1, criterion1, [criteria_range2, criterion2, ...])
```

- `average_range` - The range to average.
- `criteria_range1` - The range to check against `criterion1`.
- `criterion1` - The pattern or test to apply to `criteria_range1`.
- `criteria_range2, criterion2, ...` - **[** OPTIONAL **]** - Additional ranges and criteria to check.

### See Also

[[AVERAGE]]: The AVERAGE function returns the numerical average value in a dataset, ignoring text.

[[AVERAGEA]]: Returns the numerical average value in a dataset.

[[AVERAGEIF]]: Returns the average of a range depending on criteria.

[[SUMIFS]]: Returns the sum of a range depending on multiple criteria.

[[COUNTIFS]]: Returns the count of a range depending on multiple criteria.

[[IF]]: Returns one value if a logical expression is `TRUE` and another if it is `FALSE`.

[[MEDIAN]]: Returns the median value in a numeric dataset.