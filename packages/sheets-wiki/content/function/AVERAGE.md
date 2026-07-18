---
name: AVERAGE
category: statistical
syntax: AVERAGE(column)
status: imported
description: The AVERAGE function returns the numerical average value in a dataset, ignoring text.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093615?hl=en).

The AVERAGE function returns the numerical average value in a dataset, ignoring text.

### Examples

[Make a copy](https://docs.google.com/spreadsheets/d/1ZM83ZUYa_KlsLdotJ4MP8VwP0dNUuyXcqSu7C7OaAyo/copy)

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdHhBaV9iUjAtLWctSklUMmZuRU1ldFE&amp;output=html" width="500"></iframe>

AVERAGE for BigQuery

### Sample Usage

Returns the numerical average value in a data column.

### Sample Usage

```gse
AVERAGE(table_name!price)
```

### Syntax

```gse
AVERAGE(column)
```

- `column`: The data column to consider when calculating the average value.

**Tip:** Averaging multiple columns is not supported.

[Learn more about numeric columns in BigQuery](https://cloud.google.com/bigquery/docs/reference/standard-sql/data-types#numeric_types)

### Sample Usage

```gse
AVERAGE(A2:A100,B2:B100,4,26)
AVERAGE(1,2,3,4,5,C6:C20)
```

### Syntax

```gse
AVERAGE(value1, [value2, ...])
```

- `value1` - The first value or range to consider when calculating the average value.
- `value2, ...` - **[** OPTIONAL **]** - Additional values or ranges to consider when calculating the average value.

### Notes

- Although `AVERAGE` is specified as taking a maximum of 30 arguments, Google Sheets supports an arbitrary number of arguments for this function.
- Any text encountered in the `value` arguments will be ignored. To have text values considered as `0` values, use `AVERAGEA`.
- `AVERAGE` returns the mean of the combined `value` arguments; that is, the sum of the values in the `value` arguments divided by the number of such values. To calculate the median use `MEDIAN`.

### See Also

[[TRIMMEAN]]: Calculates the mean of a dataset excluding some proportion of data from the high and low ends of the dataset.

[[SMALL]]: Returns the nth smallest element from a data set, where n is user-defined.

[[RANK]]: Returns the rank of a specified value in a dataset.

[[QUARTILE]]: Returns a value nearest to a specified quartile of a dataset.

[[PERCENTRANK]]: Returns the percentage rank (percentile) of a specified value in a dataset.

[[PERCENTILE]]: Returns the value at a given percentile of a dataset.

[[MINA]]: Returns the minimum numeric value in a dataset.

[[MIN]]: Returns the minimum value in a numeric dataset.

[[MEDIAN]]: Returns the median value in a numeric dataset.

[[MAXA]]: Returns the maximum numeric value in a dataset.

[[LARGE]]: Returns the nth largest element from a data set, where n is user-defined.

[[HARMEAN]]: Calculates the harmonic mean of a dataset.

[[GEOMEAN]]: Calculates the geometric mean of a dataset.

[[AVERAGEA]]: Returns the numerical average value in a dataset.