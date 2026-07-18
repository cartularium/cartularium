---
name: VARA
category: statistical
syntax: VARA(value1, [value2, ...])
status: imported
description: Calculates the variance based on a sample, setting text to the value `0`.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094064?hl=en).

Calculates the variance based on a sample, setting text to the value `0`.

### Sample Usage

```gse
VARA(1,2,3,4,5,6,7,8,9,10)
VARA(A2:A100)
```

### Syntax

```gse
VARA(value1, [value2, ...])
```

- `value1` - The first value or range of the sample.
- `value2, ...` - Additional values or ranges to include in the sample.

### Notes

- Although `VARA` is specified as taking a maximum of 30 arguments, Google Sheets supports an arbitrary number of arguments for this function.
- If the total number of values supplied as `value` arguments is not at least two, `VARA` will return the `#DIV/0!` error.
- `VARA` sets each text value encountered to `0` for the purpose of calculation. To return an error upon encountering text, use `VAR`.
- `VARA` calculates variance for a sample. To calculate variance across an entire population, use `VARPA`.
- `VARA` takes the sum of the squares of each value's deviation from the mean and divides by the number of such values minus one. This differs from the calculation of variance across an entire population in that the latter divides by the size of the dataset without subtracting one.

### See Also

[[VARPA]]: Calculates the variance based on an entire population, setting text to the value `0`.

[[VARP]]: Calculates the variance based on an entire population.

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

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdGx3RmVGQWtzU1VGMGxXM2NlNTJneXc&amp;output=html" width="500"></iframe>