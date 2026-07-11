---
name: PERCENTRANK.INC
category: statistical
syntax: PERCENTRANK.INC(data, value, [significant_digits])
status: imported
description: Returns the percentage rank (percentile) from 0 to 1 inclusive of a specified value in a dataset.
tags:
  - modified
  - undocumented
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3267360?hl=en).

Returns the percentage rank (percentile) from 0 to 1 inclusive of a specified value in a dataset.

### Sample Usage

```gse
PERCENTRANK.INC(A1:A100, A2, 4)
PERCENTRANK.INC(A1:A100, 10)
```

### Syntax

```gse
PERCENTRANK.INC(data, value, [significant_digits])
```

- `data` - The array or range containing the dataset to consider.
- `value` - The value whose percentage rank will be determined.
- `significant_digits` - **[** OPTIONAL - `3` by default **]** - The number of significant figures to use in the calculation.

### Notes

- If the `value` does not fall within the `data` given for the function, an estimation will be made to bring up a percentage rank for that value.

### Engine compatibility

Like the rest of the PERCENTRANK family, `PERCENTRANK.INC` reduces its result to a default of 3 significant digits, and the two spreadsheet products apply that reduction by different rules: **Excel truncates, Google Sheets rounds**. This is the same convention measured directly on [[PERCENTRANK.EXC]] (Excel 0.166 vs Google Sheets 0.167 for 1/6; Excel live probe, 2026-07-11) — so results can differ in the last digit even though the underlying rank is identical. Pass a larger `significant_digits` or apply an explicit [[ROUND]] if the exact digit matters.

Open-engine coverage was probed directly only for `PERCENTRANK.EXC` (not implemented in HyperFormula, IronCalc, or pycel) in the 2026-07-11 deep dive; the `.INC` form's coverage in those engines was not separately measured.

| Engine | Behavior |
| --- | --- |
| Google Sheets | Supported; **rounds** the default 3-sig-digit result. |
| Excel | Supported; **truncates** the default 3-sig-digit result (live probe, 2026-07-11). |

### See Also

[[PERCENTRANK]]: Returns the percentage rank (percentile) of a specified value in a dataset.

[[PERCENTRANK.EXC]]: Returns the percentage rank (percentile) from 0 to 1 exclusive of a specified value in a dataset.

[[PERCENTILE]]: Returns the value at a given percentile of a dataset.

[[MIN]]: Returns the minimum value in a numeric dataset.

[[MAX]]: Returns the maximum value in a numeric dataset.

[[MEDIAN]]: Returns the median value in a numeric dataset.

[[PERCENTILE]]: Returns the value at a given percentile of a dataset.