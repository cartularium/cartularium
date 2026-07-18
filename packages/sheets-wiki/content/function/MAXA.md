---
name: MAXA
category: statistical
syntax: MAXA(value1, [value2, ...])
status: imported
description: Returns the maximum numeric value in a dataset.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094016?hl=en).

Returns the maximum numeric value in a dataset.

### Sample Usage

```gse
MAXA(A2:A100,B2:B100,4,26)
MAXA(1,2,3,4,5,C6:C20)
```

### Syntax

```gse
MAXA(value1, [value2, ...])
```

- `value1` - The first value or range to consider when calculating the maximum value.
- `value2, ...` - **[** OPTIONAL **]** - Additional values or ranges to consider when calculating the maximum value.

### Notes

- Although `MAXA` is specified as taking a maximum of 30 arguments, Google Sheets supports an arbitrary number of arguments for this function.
- Any referenced text value in any of the `value` arguments will be assigned the numeric value `0` for the purpose of this function.
- If an argument contains error values or text that can't be changed into numbers, it will cause an error.

### See Also

[[SMALL]]: Returns the nth smallest element from a data set, where n is user-defined.

[[RANK]]: Returns the rank of a specified value in a dataset.

[[QUARTILE]]: Returns a value nearest to a specified quartile of a dataset.

[[PERCENTRANK]]: Returns the percentage rank (percentile) of a specified value in a dataset.

[[PERCENTILE]]: Returns the value at a given percentile of a dataset.

[[MINA]]: Returns the minimum numeric value in a dataset.

[[MIN]]: Returns the minimum value in a numeric dataset.

[[MEDIAN]]: Returns the median value in a numeric dataset.

[[MAX]]: Returns the maximum value in a numeric dataset.

[[LARGE]]: Returns the nth largest element from a data set, where n is user-defined.

[[AVERAGEA]]: Returns the numerical average value in a dataset.

[[AVERAGE]]: The AVERAGE function returns the numerical average value in a dataset, ignoring text.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdEJEVUlDY3h0TnRaSEpSSl9ycXBSQ2c&amp;output=html" width="500"></iframe>