---
name: MIN
category: statistical
syntax: MIN(column)
status: imported
description: Returns the minimum value in a numeric dataset.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094017?hl=en).

Returns the minimum value in a numeric dataset.

MIN for BigQuery

Returns the minimum value in a data column.

### Sample Usage

```gse
MIN(table_name!price)
```

### Syntax

```gse
MIN(column)
```

- `column`: The data column to consider when calculating the minimum value.

**Tip:** Returning minimum value across multiple columns is not supported

### Sample Usage

```gse
MIN(A2:A100,B2:B100,4,26)
MIN(1,2,3,4,5,C6:C20)
```

### Syntax

```gse
MIN(value1, [value2, ...])
```

- `value1` - The first value or range to consider when calculating the minimum value.
- `value2, ...` - **[** OPTIONAL **]** - Additional values or ranges to consider when calculating the minimum value.

### Notes

- Although `MIN` is specified as taking a maximum of 30 arguments, Google Sheets supports an arbitrary number of arguments for this function.
- Each `value` argument must be a cell, a number, or a range containing numbers. Cells without numbers or ranges are ignored. Entering text values will cause `MIN` to return the `#VALUE!` error. To allow text values, use `MINA`.

### See Also

[[SMALL]]: Returns the nth smallest element from a data set, where n is user-defined.

[[RANK]]: Returns the rank of a specified value in a dataset.

[[QUARTILE]]: Returns a value nearest to a specified quartile of a dataset.

[[PERCENTRANK]]: Returns the percentage rank (percentile) of a specified value in a dataset.

[[PERCENTILE]]: Returns the value at a given percentile of a dataset.

[[MINA]]: Returns the minimum numeric value in a dataset.

[[MEDIAN]]: Returns the median value in a numeric dataset.

[[MAXA]]: Returns the maximum numeric value in a dataset.

[[MAX]]: Returns the maximum value in a numeric dataset.

[[LARGE]]: Returns the nth largest element from a data set, where n is user-defined.

[[AVERAGEA]]: Returns the numerical average value in a dataset.

[[AVERAGE]]: The AVERAGE function returns the numerical average value in a dataset, ignoring text.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdEN4NEJnaHVJbUM0Q2VpcFRXMkh5RlE&amp;output=html" width="500"></iframe>