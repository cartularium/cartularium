---
name: AVEDEV
category: statistical
syntax: AVEDEV(value1, [value2, ...])
status: imported
description: Calculates the average of the magnitudes of deviations of data from a dataset's mean.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093613?hl=en).

Calculates the average of the magnitudes of deviations of data from a dataset's mean.

### Sample Usage

```gse
AVEDEV(1,2,3,4,5,6,7,8,9,10)
AVEDEV(A2:A100)
```

### Syntax

```gse
AVEDEV(value1, [value2, ...])
```

- `value1` - The first value or range of the sample.
- `value2, ...` - Additional values or ranges to include in the sample.

### Notes

- `AVEDEV` will ignore any text values in `value` arguments.
- The average deviation is the sum of the absolute values of the difference of each data point and the mean of the dataset, divided by the number of elements in the dataset.

### See Also

[[VARPA]]: Calculates the variance based on an entire population, setting text to the value `0`.

[[VARP]]: Calculates the variance based on an entire population.

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

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdGpndDJfaUF2YVhkSmlhUHZfaDV0aEE&amp;output=html" width="500"></iframe>