---
name: MAX
category: statistical
syntax: MAX(column)
status: imported
description: Returns the maximum value in a numeric dataset.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094013?hl=en).

Returns the maximum value in a numeric dataset.

MAX for BigQuery

Returns the maximum value in a data column.

### Sample Usage

```gse
MAX(table_name!price)
```

### Syntax

```gse
MAX(column)
```

- `column`: The data column to consider when calculating the maximum value.

**Tip:** Returning maximum value across multiple columns is not supported.

### Sample Usage

```gse
MAX(A2:A100,B2:B100,4,26)
MAX(1,2,3,4,5,C6:C20)
```

### Syntax

```gse
MAX(value1, [value2, ...])
```

- `value1` - The first value or range to consider when calculating the maximum value.
- `value2, ...` - **[** OPTIONAL **]** - Additional values or ranges to consider when calculating the maximum value.

### Notes

- Although `MAX` is specified as taking a maximum of 30 arguments, Google Sheets supports an arbitrary number of arguments for this function.
- Each `value` argument must be a cell, a number, or a range containing numbers. Cells without numbers or ranges are ignored. Entering text values will cause `MAX` to return the `#VALUE!` error. To allow text values, use `MAXA`.

### See Also

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

[[AVERAGEA]]: Returns the numerical average value in a dataset.

[[AVERAGE]]: The AVERAGE function returns the numerical average value in a dataset, ignoring text.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdGhQY1dMR3ZzM1puSFpLUTFpVVdzb2c&amp;output=html" width="500"></iframe>