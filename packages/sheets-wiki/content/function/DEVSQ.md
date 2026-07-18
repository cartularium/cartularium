---
name: DEVSQ
category: statistical
syntax: DEVSQ(value1, [value2, ...])
status: imported
description: Calculates the sum of squares of deviations based on a sample.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093625?hl=en).

Calculates the sum of squares of deviations based on a sample.

### Sample Usage

```gse
DEVSQ(1,2,3,4,5,6,7,8,9,10)
DEVSQ(A2:A100)
```

### Syntax

```gse
DEVSQ(value1, [value2, ...])
```

- `value1` - The first value or range of the sample.
- `value2, ...` - Additional values or ranges to include in the sample.

### Notes

- Although `DEVSQ` is specified as taking a maximum of 30 arguments, Google Sheets supports an arbitrary number of arguments for this function.
- If the total number of values supplied as `value` arguments is not at least two, `DEVSQ` will return a value of `0`.
- `DEVSQ` will ignore any text values found in ranges included in `value` arguments.
- `DEVSQ` is equivalent to the variance of a sample multiplied by the number of elements in the sample minus one; that is, `(COUNT(...)-1)*VAR(...)` where `COUNT` and `VAR` are called on the same dataset.

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

[[AVEDEV]]: Calculates the average of the magnitudes of deviations of data from a dataset's mean.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdDBaLVpTcTVGbVRYTldwaWZ4TzJZNGc&amp;output=html" width="500"></iframe>