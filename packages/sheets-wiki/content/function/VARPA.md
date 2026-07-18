---
name: VARPA
category: statistical
syntax: VARPA(value1, [value2, ...])
status: imported
description: Calculates the variance based on an entire population, setting text to the value `0`.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094065?hl=en).

Calculates the variance based on an entire population, setting text to the value `0`.

### Sample Usage

```gse
VARPA(1,2,3,4,5,6,7,8,9,10)
VARPA(A2:A100)
```

### Syntax

```gse
VARPA(value1, [value2, ...])
```

- `value1` - The first value or range of the population.
- `value2, ...` - Additional values or ranges to include in the population.

### Notes

- Although `VARPA` is specified as taking a maximum of 30 arguments, Google Sheets supports an arbitrary number of arguments for this function.
- If the total number of values supplied as `value` arguments is not at least two, `VARPA` will return the `#NUM!` error.
- `VARPA` sets each text value encountered to `0` for the purpose of calculation. To return an error upon encountering text, use `VARP`.
- `VARPA` calculates variance for an entire population. To calculate variance across a sample, use `VARA`.
- `VARPA` takes the sum of the squares of each value's deviation from the mean and divides by the number of such values. This differs from the calculation of variance across a sample in that the latter divides by the size of the dataset minus one.

### See Also

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

[[AVEDEV]]: Calculates the average of the magnitudes of deviations of data from a dataset's mean.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdHM3cTNsV3lUc20tZDZoT2IzcHl5RHc&amp;output=html" width="500"></iframe>