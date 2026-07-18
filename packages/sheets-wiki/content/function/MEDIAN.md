---
name: MEDIAN
category: statistical
syntax: MEDIAN(value1, [value2, ...])
status: imported
description: Returns the median value in a numeric dataset.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094025?hl=en).

Returns the median value in a numeric dataset.

### Sample Usage

```gse
MEDIAN(A2:A100,B2:B100,4,26)
MEDIAN(1,2,3,4,5,C6:C20)
```

### Syntax

```gse
MEDIAN(value1, [value2, ...])
```

- `value1` - The first value or range to consider when calculating the median value.
- `value2, ...` - **[** OPTIONAL **]** - Additional values or ranges to consider when calculating the median value.

### Notes

- Although `MEDIAN` is specified as taking a maximum of 30 arguments, Google Sheets supports an arbitrary number of arguments for this function.
- Any text encountered in the `value` arguments will be ignored.
- `MEDIAN` returns the center value if the dataset contains an odd number of values. If the combined `value` arguments contain an even number of values, `MEDIAN` will interpolate between the two center values.
- `MEDIAN` finds the center value of the dataset rather than the mean. To find the mean use `AVERAGE` or `AVERAGEA`.

### See Also

[[SMALL]]: Returns the nth smallest element from a data set, where n is user-defined.

[[RANK]]: Returns the rank of a specified value in a dataset.

[[QUARTILE]]: Returns a value nearest to a specified quartile of a dataset.

[[PERCENTRANK]]: Returns the percentage rank (percentile) of a specified value in a dataset.

[[PERCENTILE]]: Returns the value at a given percentile of a dataset.

[[MINA]]: Returns the minimum numeric value in a dataset.

[[MIN]]: Returns the minimum value in a numeric dataset.

[[MAXA]]: Returns the maximum numeric value in a dataset.

[[MAX]]: Returns the maximum value in a numeric dataset.

[[LARGE]]: Returns the nth largest element from a data set, where n is user-defined.

[[AVERAGEA]]: Returns the numerical average value in a dataset.

[[AVERAGE]]: The AVERAGE function returns the numerical average value in a dataset, ignoring text.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdDFibER1Z2QxcEhDajlOQ3VLcjZTZXc&amp;output=html" width="500"></iframe>