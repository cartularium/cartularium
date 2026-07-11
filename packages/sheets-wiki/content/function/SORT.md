---
name: SORT
category: filter
syntax: SORT(range, sort_column, is_ascending, [sort_column2, is_ascending2, ...])
status: imported
description: Sorts the rows of a given array or range by the values in one or more columns.
tags: [modified, undocumented]
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093150?hl=en).

Sorts the rows of a given array or range by the values in one or more columns.

### Sample Usage

```gse
SORT(A2:B26, 1, TRUE)
SORT({1, 2; 3, 4; 5, 6}, 2, FALSE)
SORT(A2:B26, C2:C26, TRUE)
```

### Syntax

```gse
SORT(range, sort_column, is_ascending, [sort_column2, is_ascending2, ...])
```

- `range` - The data to be sorted.
- `sort_column` - The index of the column in `range` or a range outside of `range` containing the values by which to sort.

  + A range specified as a `sort_column` must be a single column with the same number of rows as `range`.
- `is_ascending` - `TRUE` or `FALSE` indicating whether to sort `sort_column` in ascending order. `FALSE` sorts in descending order.
- `sort_column2, is_ascending2 ...`

  + **[** OPTIONAL **]** - Additional columns and sort order flags beyond the first, in order of precedence.

### Notes

- `range` is sorted *only* by the specified columns, other columns are returned in the order they originally appear.

### Engine compatibility

`SORT`'s third argument means different things in Google Sheets and Excel — a genuine product-signature difference, not a bug, and a portability landmine. Google Sheets uses `is_ascending` (a boolean), whereas Excel uses `sort_order` (`1` = ascending, `-1` = descending). The same literal `-1` therefore sorts *opposite* directions. Testing `=SORT({3;1;2}, 1, -1)`:

| Engine | Behavior |
| --- | --- |
| Google Sheets | `{1;2;3}` (ascending) — `-1` is truthy, so `is_ascending` is true. |
| Excel | `{3;2;1}` (descending) — `-1` is `sort_order` = descending. |
| Lattice | `{3;2;1}` — follows the Excel `sort_order` signature. |
| formulas | `{3;2;1}` — follows the Excel `sort_order` signature (live probe, 2026-07-11). |
| HyperFormula | `#NAME?` — `SORT` not implemented (live probe, 2026-07-11). |
| IronCalc | `#NAME?` — not implemented (live probe, 2026-07-11). |
| pycel | `#NAME?` — not implemented (live probe, 2026-07-11). |

> [!INFO]
> The numeric third argument is the trap: this page documents Google Sheets' `is_ascending`, so an Excel author who copies `SORT(x, 1, -1)` expecting descending order will silently get ascending order in Sheets. Write the direction unambiguously — `FALSE` for descending in Google Sheets, `-1` for descending in Excel — rather than copying the numeric form across products. As a dynamic-array function, `SORT` is also entirely absent from HyperFormula, IronCalc, and pycel.

### See Also

[[FILTER]]: Returns a filtered version of the source range, returning only rows or columns that meet the specified conditions.

### Examples

Sorts the rows in the specified data range according to the given key columns followed by the sorting order.

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdFF1Q1Y4WEtKY0hmTDA5MzhtdV9IQkE&amp;single=true&amp;gid=0&amp;output=html&amp;widget=true" width="500"></iframe>

[Make a copy](https://docs.google.com/spreadsheets/d/1Bp7qW66vyF4kFZQhXI0hZzGAK8cGzOXkJf9dzqCu5Tg/copy)