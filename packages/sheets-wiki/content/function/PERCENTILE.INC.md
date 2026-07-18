---
name: PERCENTILE.INC
category: statistical
syntax: PERCENTILE(data, percentile)
status: imported
description: Returns the value at a given percentile of a dataset.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094093?hl=en).

Returns the value at a given percentile of a dataset.

### Sample Usage

```gse
PERCENTILE(A2:A100,A2)
PERCENTILE(A2:A100,0.67)
```

### Syntax

```gse
PERCENTILE(data, percentile)
```

- `data` - The array or range containing the dataset to consider.
- `percentile` - The percentile whose value within `data` will be calculated and returned.

### Notes

- The value returned by `PERCENTILE` is not necessarily a member of `data` as this function interpolates between values to calculate the alpha percentile.
- The 50th percentile, that is setting `percentile` to `0.5` is equivalent to using `MEDIAN` with the same dataset.

### See Also

[[SMALL]]: Returns the nth smallest element from a data set, where n is user-defined.

[[RANK]]: Returns the rank of a specified value in a dataset.

[[QUARTILE]]: Returns a value nearest to a specified quartile of a dataset.

[[PERCENTRANK]]: Returns the percentage rank (percentile) of a specified value in a dataset.

[[MINA]]: Returns the minimum numeric value in a dataset.

[[MIN]]: Returns the minimum value in a numeric dataset.

[[MEDIAN]]: Returns the median value in a numeric dataset.

[[MAXA]]: Returns the maximum numeric value in a dataset.

[[MAX]]: Returns the maximum value in a numeric dataset.

[[LARGE]]: Returns the nth largest element from a data set, where n is user-defined.

[[AVERAGEA]]: Returns the numerical average value in a dataset.

[[AVERAGE]]: The AVERAGE function returns the numerical average value in a dataset, ignoring text.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdGJaNGYtSU1hLVhrZWp4R1pveVhGMmc&amp;output=html" width="500"></iframe>