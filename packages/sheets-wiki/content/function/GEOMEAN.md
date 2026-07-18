---
name: GEOMEAN
category: statistical
syntax: GEOMEAN(value1, [value2, ...])
status: imported
description: Calculates the geometric mean of a dataset.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094001?hl=en).

Calculates the geometric mean of a dataset.

### Sample Usage

```gse
GEOMEAN(1,2,3,4,5,6,7,8,9,10)
GEOMEAN(A2:A100)
```

### Syntax

```gse
GEOMEAN(value1, [value2, ...])
```

- `value1` - The first value or range of the population.
- `value2, ...` - Additional values or ranges to include in the population.

### Notes

- The geometric mean of a population is the nth root of the product of all the data points, where n is the size of the population.

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

[[AVERAGEA]]: Returns the numerical average value in a dataset.

[[AVERAGE]]: The AVERAGE function returns the numerical average value in a dataset, ignoring text.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdEVrek9uY0lUTUVvVjdoWFoyN2JnZGc&amp;output=html" width="500"></iframe>