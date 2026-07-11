---
name: COUNTBLANK
category: math
syntax: COUNTBLANK(column)
status: imported
description: Returns the number of empty cells in a given range.
tags: [modified, undocumented]
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093403?hl=en).

Returns the number of empty cells in a given range.

COUNTBLANK for BigQuery

Returns the number of empty values in a data column.

### Sample Usage

```gse
COUNTBLANK(table_name!fruits)
```

### Syntax

```gse
COUNTBLANK(column)
```

- `column`: The data column in which to count the number of nulls.

**Tip:** Counting blanks in multiple columns is not supported.

### Sample Usage

```gse
COUNTBLANK(A2:C100)
```

### Syntax

```gse
COUNTBLANK(value1, [value2,...])
```

- value1 - The first value or range in which to count the number of blanks.
- value2 - [OPTIONAL ] - Additional values or ranges in which to count the number of blanks.

### Notes

- `COUNTBLANK` considers cells with no content and cells containing an empty string (`""`) to be blank cells.

### Engine compatibility

`COUNTBLANK` is the mirror image of [[COUNTA]]: both hinge on whether a cell holding a zero-length string `""` counts as blank. Counting a range like `A1=1`, `A2=""`, `A3="hello"`, `A4` and `A5` truly empty:

| Engine | Behavior |
| --- | --- |
| Google Sheets | `3` — a `""` cell is blank (`A2` + `A4` + `A5`), matching this page's note (assay: COUNTBLANK/countblank). |
| Excel | `3` — `""` is blank. |
| IronCalc | `3` — `""` is blank. |
| formulas | `3` — `""` is blank. |
| Lattice | `3` — `""` is blank. |
| HyperFormula | `2` — a `""` cell is a *non-blank* text value, so only the two truly empty cells count (live probe, 2026-07-11). |
| pycel | `#NAME?` — `COUNTBLANK` is not implemented (live probe, 2026-07-11). |

> [!INFO]
> Each engine's model of `""` becomes clear when both counts are read together. HyperFormula treats `""` as a real text value (counted by `COUNTA`, excluded from `COUNTBLANK`). Excel, formulas, and Lattice treat it as blank — the exact opposite. Google Sheets and IronCalc count the *same* `""` cell in *both* functions, behaving as though it were a written-but-empty cell.

### See Also

[[DCOUNTA]]: Counts values, including text, selected from a database table-like array or range using a SQL-like query.

[[DCOUNT]]: Counts numeric values selected from a database table-like array or range using a SQL-like query.

[[COUNTUNIQUE]]: Counts the number of unique values in a list of specified values and ranges.

[[COUNTIF]]: Returns a conditional count across a range.

[[COUNTA]]: Returns the number of values in a dataset.

[[COUNT]]: Returns the number of numeric values in a dataset.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdGx0cE1lQVRwNXhEb1pIT1EyeE8wWWc&amp;output=html" width="500"></iframe>