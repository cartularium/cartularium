---
name: LOOKUP
category: lookup
syntax: LOOKUP(search_key, search_range|search_result_array, [result_range])
status: imported
description: Looks through a sorted row or column for a key and returns the value of the cell in a result range located in the same position as the search row or column.
tags: [modified, undocumented]
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3256570?hl=en).

Looks through a sorted row or column for a key and returns the value of the cell in a result range located in the same position as the search row or column.

### Sample Usage

```gse
LOOKUP(10003, A1:A100, B1:B100)
LOOKUP(10003, A1:B100)
LOOKUP("foo", A1:Z10)
```

### Syntax

```gse
LOOKUP(search_key, search_range|search_result_array, [result_range])
```

- `search_key` - The value to search for in the row or column. For example, 42, "Cats", or I24.
- `search_range|search_result_array` - One method of using `LOOKUP` is to provide a single row or column `search_range` to look through for the search with a second argument `result_range`. The other way is to combine these two arguments into one `search_result_array` where the first row or column is searched and a value is returned from the last row or column in the array.
- `result_range` - **[** OPTIONAL **]** - The range from which to return a result. The value returned corresponds to the location where `search_key` is found in `search_range`. This range must be only a single row or column and should not be used if using the `search_result_array` method.

### Notes

The `LOOKUP` function will only work properly if data in `search_range` or `search_result_array` is sorted. Use `VLOOKUP`, `HLOOKUP`, or other related functions if data is not sorted.

If `search_key` is not found, the item used in the lookup will be the value that’s immediately smaller in the range provided. For example, if the data set contains the numbers 1, 3, 5 and `search_key` is 2, then 1 will be used for the lookup.

In the `search_result_array` method, the last row or column in the provided range is returned. If a different row or column is desired, use `VLOOKUP` or `HLOOKUP` instead.

When using the `search_result_array` method, if the range provided contains more columns than rows, then the search will be from left to right over the first row in the range. If the range contains an equal number of rows and columns or more rows than columns, then the search will be from top to bottom over the first column in the range.

### Engine compatibility

The **vector form** `LOOKUP(search_key, search_range, result_range)` is broadly portable — Excel, Google Sheets, Lattice, IronCalc, formulas, and pycel all evaluate it; only HyperFormula lacks `LOOKUP` entirely. The **array form** `LOOKUP(search_key, array)`, which infers orientation from the array's shape, is a portability trap. Testing the horizontal case `=LOOKUP(2, {1,2,3;"a","b","c"})` (a 3×2 array, so search the first row and return the last row → `"b"`):

| Engine | Behavior |
| --- | --- |
| Google Sheets | `"b"` — correct array-form, horizontal orientation. |
| Excel | `"b"` — correct. |
| Lattice | `"b"` — correct. |
| pycel | `"b"` for non-square arrays, but returns the *search key* `2` on a square array where orientation is ambiguous (live probe, 2026-07-11). |
| formulas | `2` — mis-implements the array form: it returns the matched *key* instead of the result-row value, for every orientation. Treat its array-form `LOOKUP` output as unreliable (live probe, 2026-07-11). |
| IronCalc | `#N/A` — implements `LOOKUP` but does not resolve this array form (live probe, 2026-07-11). |
| HyperFormula | `#NAME?` — `LOOKUP` not implemented at all (live probe, 2026-07-11). |

The square-array orientation is worth pinning down: `=LOOKUP(2, {1,2;3,4})` orients **vertically** in Excel — it searches the first column `{1;3}` and returns the last column of the matched row, giving `2` (live Excel probe, 2026-07-11).

> [!INFO]
> Prefer [[INDEX]]/[[MATCH]] or [[XLOOKUP]] over the array form of `LOOKUP`. Even among engines that implement it, a square array is ambiguous, and `formulas` returns the wrong axis entirely.

### Examples

This examples shows the price of part number 126.

| Part Number | Price | Formula | Result |
| --- | --- | --- | --- |
| 105 | \$27.50 | =LOOKUP(126, \$A\$2:\$A\$6, \$B\$2:\$B\$6) | \$33.00 |
| 126 | \$33.00 |  |  |
| 133 | \$41.75 |  |  |
| 171 | \$26.75 |  |  |
| 188 | \$32.99 |  |  |

This examples shows when the search\_key is not found (student ID 765333), a non-exact match may be returned.

| Part Number | Price | Formula | Result |
| --- | --- | --- | --- |
| 764541 | B | =LOOKUP(765333,\$A\$2:\$A\$5,\$B\$2:\$B\$5) | C |
| 764598 | C |  |  |
| 765444 | B- |  |  |
| 766765 | A |  |  |

### See Also

[[VLOOKUP]]: Vertical lookup. Searches down the first column of a range for a key and returns the value of a specified cell in the row found.

[[HLOOKUP]]: Horizontal lookup. Searches across the first row of a range for a key and returns the value of a specified cell in the column found.

[[MATCH]]: Returns the relative position of an item in a range that matches a specified value.