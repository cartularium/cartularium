---
name: RANK
category: statistical
syntax: RANK(value, data, [is_ascending])
status: imported
description: Returns the rank of a specified value in a dataset.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094098?hl=en).

Returns the rank of a specified value in a dataset.

### Sample Usage

```gse
RANK(A2,A2:A100)
RANK(4,A2:A100,1)
```

### Syntax

```gse
RANK(value, data, [is_ascending])
```

- `value` - The value whose rank will be determined.

  + If `data` does not contain `value` in any cell or element, `RANK` will return the `#N/A` error.
- `data` - The array or range containing the dataset to consider.
- `is_ascending` - **[** OPTIONAL - `0` by default **]** Whether to consider the values in `data` in descending or ascending order.

  + If this is `0`, the greatest value in `data` will have rank `1`; if this is `1`, the least value in `data` will have rank `1`.

### See Also

[[SMALL]]: Returns the nth smallest element from a data set, where n is user-defined.

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

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdGpxT29QUnczMzNSc3ZIUEFVSURfWWc&amp;output=html" width="500"></iframe>