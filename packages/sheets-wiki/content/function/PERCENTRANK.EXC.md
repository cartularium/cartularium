---
name: PERCENTRANK.EXC
category: statistical
syntax: PERCENTRANK.EXC(data, value, [significant_digits])
status: imported
description: Returns the percentage rank (percentile) from 0 to 1 exclusive of a specified value in a dataset.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3267357?hl=en).

Returns the percentage rank (percentile) from 0 to 1 exclusive of a specified value in a dataset.

### Sample Usage

```gse
PERCENTRANK.EXC(A1:A100, A2, 4)
PERCENTRANK.EXC(A1:A100, 10)
```

### Syntax

```gse
PERCENTRANK.EXC(data, value, [significant_digits])
```

- `data` - The array or range containing the dataset to consider.
- `value` - The value whose percentage rank will be determined.
- `significant_digits` - **[** OPTIONAL - `3` by default **]** - The number of significant figures to use in the calculation.

### Notes

- If the `value` does not fall within the `data` given for the function, an estimation will be made to bring up a percentage rank for that value.

### See Also

[[PERCENTRANK]]: Returns the percentage rank (percentile) of a specified value in a dataset.

[[PERCENTRANK.INC]]: Returns the percentage rank (percentile) from 0 to 1 inclusive of a specified value in a dataset.

[[PERCENTILE]]: Returns the value at a given percentile of a dataset.

[[LARGE]]: Returns the nth largest element from a data set, where n is user-defined.

[[MIN]]: Returns the minimum value in a numeric dataset.

[[MAX]]: Returns the maximum value in a numeric dataset.

[[MEDIAN]]: Returns the median value in a numeric dataset.