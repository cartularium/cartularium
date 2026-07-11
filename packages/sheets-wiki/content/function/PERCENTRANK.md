---
name: PERCENTRANK
category: statistical
syntax: PERCENTRANK(data, value, [significant_digits])
status: imported
description: Returns the percentage rank (percentile) of a specified value in a dataset.
tags:
  - modified
  - undocumented
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094095?hl=en).

Returns the percentage rank (percentile) of a specified value in a dataset.

### Sample Usage

```gse
PERCENTRANK(A2:A100,A2)
PERCENTRANK(A2:A100,1,7)
```

### Syntax

```gse
PERCENTRANK(data, value, [significant_digits])
```

- `data` - The array or range containing the dataset to consider.
- `value` - The value whose percentage rank will be determined.
- `significant_digits` - **[** OPTIONAL - `3` by default **]** - The number of significant figures to use in the calculation.

### Notes

- If `data` does not contain `value` in any cell or element, `PERCENTRANK` will return the `#N/A` error.
- If a number less than or equal to 0 is used for `significant_digits` then this value will be ignored and the default number of significant digits will be used instead.

### Engine compatibility

The legacy `PERCENTRANK` (Excel 2007 and earlier; equivalent to [[PERCENTRANK.INC]]) reduces its result to a default of 3 significant digits, and the two spreadsheet products apply that reduction by different rules: **Excel truncates, Google Sheets rounds**. This is the same convention measured directly on [[PERCENTRANK.EXC]] (Excel 0.166 vs Google Sheets 0.167 for 1/6; Excel live probe, 2026-07-11), so results can differ in the last digit even when the underlying rank is identical. Pass a larger `significant_digits` or apply an explicit [[ROUND]] if the exact digit matters.

Open-engine coverage was probed directly only for `PERCENTRANK.EXC` (not implemented in HyperFormula, IronCalc, or pycel) in the 2026-07-11 deep dive; the legacy `PERCENTRANK` form's coverage in those engines was not separately measured.

| Engine | Behavior |
| --- | --- |
| Google Sheets | Supported; **rounds** the default 3-sig-digit result. |
| Excel | Supported; **truncates** the default 3-sig-digit result (live probe, 2026-07-11). |

### See Also

[[PERCENTRANK.INC]]: Returns the percentage rank (percentile) from 0 to 1 inclusive of a specified value in a dataset.

[[PERCENTRANK.EXC]]: Returns the percentage rank (percentile) from 0 to 1 exclusive of a specified value in a dataset.

[[SMALL]]: Returns the nth smallest element from a data set, where n is user-defined.

[[RANK]]: Returns the rank of a specified value in a dataset.

[[QUARTILE]]: Returns a value nearest to a specified quartile of a dataset.

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

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdEZORElDbFU0aFphRXI4WGwydWNDVVE&amp;output=html" width="500"></iframe>