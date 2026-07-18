---
name: SUBTOTAL
category: math
syntax: SUBTOTAL(function_code, range1, [range2, ...])
status: imported
description: Returns a subtotal for a vertical range of cells using a specified aggregation function.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093649?hl=en).

Returns a subtotal for a vertical range of cells using a specified aggregation function.

### Sample Usage

```gse
SUBTOTAL(1,A2:A5,B2:B8)
```

### Syntax

```gse
SUBTOTAL(function_code, range1, [range2, ...])
```

- `function_code` - The function to use in subtotal aggregation.

  + `1` is `AVERAGE`
  + `2` is `COUNT`
  + `3` is `COUNTA`
  + `4` is `MAX`
  + `5` is `MIN`
  + `6` is `PRODUCT`
  + `7` is `STDEV`
  + `8` is `STDEVP`
  + `9` is `SUM`
  + `10` is `VAR`
  + `11` is `VARP`
  + Hidden values can be skipped for any of these codes by prepending `10` (to the single-digit codes) or `1` (to the 2-digit codes). e.g. 102 for `COUNT` while skipping hidden cells, and `110` for `VAR` while doing so.
- `range1` - The first range over which to calculate a subtotal.
- `range2, ...` - Additional ranges over which to calculate subtotals.

### Notes

- Cells that are hidden due to autofilter criteria are never included in `SUBTOTAL`, irrespective of the `function_code` used.
- Cells within any of the specified `range` arguments that contain `SUBTOTAL` calls are ignored to prevent double-counting.
- `SUBTOTAL` can be used to created dynamic dashboards by having the function code argument refer to another cell. When combined with list-based data validation, this cell can become a drop-down list that instantly updates the entire dashboard.
- `SUBTOTAL` can be used for quick analysis of different subsets of data by building a subtotal dashboard above a filtered region. Each time the filter criteria change, the dashboard will automatically update with new aggregations.
- Using `SUBTOTAL` helps prevent double-counting associated with simple `SUM` formulas.

### See Also

[[VARP]]: Calculates the variance based on an entire population.

[[VAR]]: Calculates the variance based on a sample.

[[SUM]]: Returns the sum of a series of numbers and/or cells.

[[STDEVP]]: Calculates the standard deviation based on an entire population.

[[STDEV]]: The STDEV function calculates the standard deviation based on a sample.

[[PRODUCT]]: Returns the result of multiplying a series of numbers together.

[[MIN]]: Returns the minimum value in a numeric dataset.

[[MAX]]: Returns the maximum value in a numeric dataset.

[[COUNTA]]:

Returns the number of values in a dataset.

[[COUNT]]:

Returns the number of numeric values in a dataset.

[[AVERAGE]]: The AVERAGE function returns the numerical average value in a dataset, ignoring text.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdE5zWXl6Q1NOeHk3RGVUX1I0eU9Bamc&amp;output=html" width="500"></iframe>