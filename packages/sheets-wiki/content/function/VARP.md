---
name: VARP
category: statistical
syntax: VARP(column)
status: imported
description: Calculates the variance based on an entire population.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094113?hl=en).

Calculates the variance based on an entire population.

VARP for BigQuery

Calculates the population variance of a data column.

### Sample Usage

```gse
=VARP(table_name!price)
```

### Syntax

```gse
VARP(column)
```

- `column`: The data column of the population.

**Tip**: Returning population variance across multiple columns is not supported.

### Sample Usage

```gse
VARP(1,2,3,4,5,6,7,8,9,10)
VARP(A2:A100)
```

### Syntax

```gse
VARP(value1, [value2, ...])
```

- `value1` - The first value or range of the population.
- `value2, ...` - Additional values or ranges to include in the population.

### Notes

- Although `VARP` is specified as taking a maximum of 30 arguments, Google Sheets supports an arbitrary number of arguments for this function.
- If the total number of values supplied as `value` arguments is not at least two, `VARP` will return the `#DIV/0!` error.
- `VARP` will ignore any of the `value` arguments that include text. To calculate variance while interpreting text values as `0`, use `VARPA`.
- `VARP` calculates variance for an entire population. To calculate variance across a sample, use `VAR`.
- `VARP` takes the sum of the squares of each value's deviation from the mean and divides by the number of such values. This differs from the calculation of variance across a sample in that the latter divides by the size of the dataset minus one.

### See Also

[[VARPA]]: Calculates the variance based on an entire population, setting text to the value `0`.

[[VARA]]: Calculates the variance based on a sample, setting text to the value `0`.

[[VAR]]: Calculates the variance based on a sample.

[[STDEVPA]]: Calculates the standard deviation based on an entire population, setting text to the value `0`.

[[STDEVP]]: Calculates the standard deviation based on an entire population.

[[STDEVA]]: Calculates the standard deviation based on a sample, setting text to the value `0`.

[[STDEV]]: The STDEV function calculates the standard deviation based on a sample.

[[SKEW]]: Calculates the skewness of a dataset, which describes the symmetry of that dataset about the mean.

[[KURT]]: Calculates the kurtosis of a dataset, which describes the shape, and in particular the "peakedness" of that dataset.

[[DVARP]]: Returns the variance of an entire population selected from a database table-like array or range using a SQL-like query.

[[DVAR]]: Returns the variance of a population sample selected from a database table-like array or range using a SQL-like query.

[[DSTDEVP]]: Returns the standard deviation of an entire population selected from a database table-like array or range using a SQL-like query.

[[DSTDEV]]: Returns the standard deviation of a population sample selected from a database table-like array or range using a SQL-like query.

[[DEVSQ]]: Calculates the sum of squares of deviations based on a sample.

[[AVEDEV]]: Calculates the average of the magnitudes of deviations of data from a dataset's mean.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdGpWdVBHNTVfTFlIeDFwVjJuSnJ4OVE&amp;output=html" width="500"></iframe>