---
name: TRIMMEAN
category: statistical
syntax: TRIMMEAN(data, exclude_proportion)
status: imported
description: Calculates the mean of a dataset excluding some proportion of data from the high and low ends of the dataset.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094061?hl=en).

Calculates the mean of a dataset excluding some proportion of data from the high and low ends of the dataset.

### Sample Usage

```gse
TRIMMEAN(A2:A100,0.1)
TRIMMEAN({1,1,2,3,5,8,13,21,34,55},0.05)
```

### Syntax

```gse
TRIMMEAN(data, exclude_proportion)
```

- `data` - Array or range containing the dataset to consider.
- `exclude_proportion` - The proportion of the dataset to exclude, from the extremities of the set.

  + `exclude_proportion` must be greater than or equal to `0` and less than `1`.

### See Also

[[HARMEAN]]: Calculates the harmonic mean of a dataset.

[[GEOMEAN]]: Calculates the geometric mean of a dataset.

[[AVERAGEA]]: Returns the numerical average value in a dataset.

[[AVERAGE]]: The AVERAGE function returns the numerical average value in a dataset, ignoring text.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdFhkTUctaVlCekg0ckl0R1lFZHpTdVE&amp;output=html" width="500"></iframe>