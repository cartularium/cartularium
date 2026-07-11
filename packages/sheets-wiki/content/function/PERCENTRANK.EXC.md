---
name: PERCENTRANK.EXC
category: statistical
syntax: PERCENTRANK.EXC(data, value, [significant_digits])
status: imported
description: Returns the percentage rank (percentile) from 0 to 1 exclusive of a specified value in a dataset.
tags:
  - modified
  - undocumented
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

### Engine compatibility

Two things split the engines here. Coverage: **HyperFormula, IronCalc, and pycel do not implement PERCENTRANK.EXC** and return `#NAME?` (live probe, 2026-07-11). And among the implementers, the default 3-significant-digit reduction is applied by two different rules — Excel and `formulas` **truncate**, Google Sheets and Lattice **round**. For `PERCENTRANK.EXC({1,2,3,4,5}, 1)` the true value is 1/6 = 0.16666…, and Excel/`formulas` return 0.166 while Google Sheets/Lattice return 0.167 (assay: stat-core-002; PERCENTRANK-EXC deep dive). Excel truncates at every significance, not just the default: at `significant_digits` 6 it returns 0.166666, not the rounded 0.166667 (Excel live probe, 2026-07-11).

If the exact last digit matters, pass a `significant_digits` large enough to clear the boundary, or post-process with an explicit [[ROUND]].

| Engine | Behavior |
| --- | --- |
| Google Sheets | Supported; **rounds** the default 3-sig-digit result → 0.167 for 1/6. |
| Excel | Supported; **truncates** → 0.166 (and 0.166666 at significance 6) (live probe, 2026-07-11). |
| HyperFormula | Not implemented; returns `#NAME?` (live probe, 2026-07-11). |
| IronCalc | Not implemented; returns `#NAME?` (live probe, 2026-07-11). |
| formulas | Supported; **truncates** → 0.166 (live probe, 2026-07-11). |
| pycel | Not implemented; returns `#NAME?` (live probe, 2026-07-11). |
| Lattice | Supported; **rounds** → 0.167. |

### See Also

[[PERCENTRANK]]: Returns the percentage rank (percentile) of a specified value in a dataset.

[[PERCENTRANK.INC]]: Returns the percentage rank (percentile) from 0 to 1 inclusive of a specified value in a dataset.

[[PERCENTILE]]: Returns the value at a given percentile of a dataset.

[[LARGE]]: Returns the nth largest element from a data set, where n is user-defined.

[[MIN]]: Returns the minimum value in a numeric dataset.

[[MAX]]: Returns the maximum value in a numeric dataset.

[[MEDIAN]]: Returns the median value in a numeric dataset.