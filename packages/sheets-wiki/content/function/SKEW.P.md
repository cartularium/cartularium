---
name: SKEW.P
category: statistical
syntax: SKEW.P(value1, value2)
status: imported
description: The SKEW.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9368569?hl=en).

The SKEW.P function calculates the skewness of a dataset that represents the entire population. Skewness describes the symmetry of that dataset about the mean.

### Syntax
```gse
SKEW.P(value1, value2)
```

| Part | Description |
| --- | --- |
| `value1` | The first value or range of the dataset. |
| `value2` | Additional values or ranges to include in the dataset. |

### Notes

- Although `SKEW.P` is specified as taking a maximum of 30 arguments, Google Sheets supports an arbitrary number of arguments for this function.
- If the total number of values supplied as `value` arguments is not at least two, `SKEW.P` will return the `#DIV/0!`error.
- Any text encountered in the `value` arguments will be ignored.
- Positive skewness indicates a longer tail extending in the positive direction, to the right of the mean, while negative skewness indicates a longer tail in the negative direction, to the left. Skewness nearer to zero indicates more symmetrical distributions.

### Examples

| A | B |
| --- | --- |
| **1** | **value** |  |
| **2** | 2 |  |
| **3** | 5 |  |
| **4** | 8 |  |
| **5** | 13 |  |
| **6** | 10 |  |
| **7** | 18 |  |
| **8** | 23 |  |
| **9** | 26 |  |
| **10** |  |  |
| **11** |  |  |
| **12** | **Result** | **Formula** |
| **13** | 0.2763070768 | `=SKEW.P(A2:A9)` |
| **14** | 0.4621754338 | `=SKEW.P(A2:A9, 30, 40)` |

### Related functions

- [[SKEW]]: Calculates the skewness of a dataset, which describes the symmetry of that dataset about the mean.
- [[VARPA]]: Calculates the variance based on an entire population, setting text to the value `0`.
- [[VARP]]: Calculates the variance based on an entire population.
- [[VARA]]: Calculates the variance based on a sample, setting text to the value `0`.
- [[VAR]]: Calculates the variance based on a sample.
- [[STDEVPA]]: Calculates the standard deviation based on an entire population, setting text to the value `0`.
- [[STDEVP]]: Calculates the standard deviation based on an entire population.
- [[KURT]]: Calculates the kurtosis of a dataset, which describes the shape, and in particular the "peakedness" of that dataset.
- [[DVARP]]: Returns the variance of an entire population selected from a database table-like array or range using a SQL-like query.
- [[DVAR]]: Returns the variance of a population sample selected from a database table-like array or range using a SQL-like query.
- [[DSTDEVP]]: Returns the standard deviation of an entire population selected from a database table-like array or range using a SQL-like query.
- [[DSTDEV]]: Returns the standard deviation of a population sample selected from a database table-like array or range using a SQL-like query.
- [[DEVSQ]]: Calculates the sum of squares of deviations based on a sample.
- [[AVEDEV]]: Calculates the average of the magnitudes of deviations of data from a dataset's mean.