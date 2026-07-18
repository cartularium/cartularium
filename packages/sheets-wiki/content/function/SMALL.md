---
name: SMALL
category: statistical
syntax: SMALL(data, n)
status: imported
description: Returns the nth smallest element from a data set, where n is user-defined.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094050?hl=en).

Returns the nth smallest element from a data set, where n is user-defined.

### Sample Usage

```gse
SMALL(A2:B100,4)
SMALL(A2:B100,C2)
```

### Syntax

```gse
SMALL(data, n)
```

- `data` - The array or range containing the dataset to consider.
- `n` - The rank from smallest to largest of the element to return.

  + E.g. setting `n` to `4` will cause `SMALL` to return the 4th smallest element from `data`.

### See Also

[[RANK]]: Returns the rank of a specified value in a dataset.

[[QUARTILE]]: Returns a value nearest to a specified quartile of a dataset.

[[PERCENTRANK]]: Returns the percentage rank (percentile) of a specified value in a dataset.

[[PERCENTILE]]: Returns the value at a given percentile of a dataset.

[[MINA]]: Returns the minimum numeric value in a dataset.

[[MIN]]: Returns the minimum value in a numeric dataset.

[[MEDIAN]]: Returns the median value in a numeric dataset.

[[MAXA]]: Returns the maximum numeric value in a dataset.

[[MAX]]: Returns the maximum value in a numeric dataset.

[[LARGE]]: Returns the nth largest element from a data set, where n is user-defined.

[[AVERAGEA]]: Returns the numerical average value in a dataset.

[[AVERAGE]]: The AVERAGE function returns the numerical average value in a dataset, ignoring text.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdEV6bDcyb1gxOXdvQ0FuQmNLc3c1MUE&amp;output=html" width="500"></iframe>