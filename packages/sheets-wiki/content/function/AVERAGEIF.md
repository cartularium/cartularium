---
name: AVERAGEIF
category: statistical
syntax: AVERAGEIF(criteria_column, criterion, average_column)
status: imported
description: Returns the average of a range depending on criteria.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3256529?hl=en).

Returns the average of a range depending on criteria.

AVERAGEIF for BigQuery

Returns the average of a data column depending on criteria.

### Sample Usage

```gse
AVERAGEIF(table_name!score, “>90”)
AVERAGEIF(table_name!frits, “Apple”, “>”)
AVERAGEIF(table_name!score, “>”, B2)
```

### Syntax

```gse
AVERAGEIF(criteria_column, criterion, average_column)
```

- `criteria_column`: The data column to check against `criterion`.
- `criterion`: The pattern or test to apply to `criteria\_column`.
- `average_column`: The data column to average. If not included, `criteria\_column` is used for the average instead.

### Sample Usage

```gse
AVERAGEIF(A1:A10, ">20", B1:B10)
AVERAGEIF(A1:A10, "<10")
AVERAGEIF(A1:A10, "Paid", B1:B10)
AVERAGEIF(A1:A10, "<"&B1)
```

### Syntax

```gse
AVERAGEIF(criteria_range, criterion, [average_range])
```

- `criteria_range` - The range to check against `criterion`.
- `criterion` - The pattern or test to apply to `criteria_range`.

  + Equals: `"text"` or `1` or `"=text"` or `"=1"`
  + Greater than: `">1"`
  + Greater than or equal to: `">=1"`
  + Less than: `"<1"`
  + Less than or equal to: `"<=1"`
  + Not equal to: `"<>1"` or `"<>text"`
- `average_range` - **[** OPTIONAL **]** - The range to average. If not included, `criteria_range` is used for the average instead.

### See Also

[[AVERAGE]]: The AVERAGE function returns the numerical average value in a dataset, ignoring text.

[[AVERAGEA]]: Returns the numerical average value in a dataset.

[[AVERAGEIFS]]: Returns the average of a range depending on multiple criteria.

[[SUMIF]]: Returns a conditional sum across a range.

[[COUNTIF]]: Returns a conditional count across a range.

[[IF]]: Returns one value if a logical expression is `TRUE` and another if it is `FALSE`.

[[MEDIAN]]: Returns the median value in a numeric dataset.