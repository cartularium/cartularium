---
name: SORTN
category: filter
syntax: SORTN(range, [n], [display_ties_mode], [sort_column1, is_ascending1], ...)
status: imported
description: Returns the first n items in a data set after performing a sort.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/7354624?hl=en).

Returns the first n items in a data set after performing a sort.

### Sample Usage

```gse
SORTN(A1:A10, 2)
SORTN(A2:C20, 2, 2, B2:B20, TRUE)
SORTN(A2:C20, 2, 3, B2:B20, TRUE, 3, FALSE)
```

### Syntax

```gse
SORTN(range, [n], [display_ties_mode], [sort_column1, is_ascending1], ...)
```

- `range` - The data to be sorted to find the first `n` items.
- `n` - [OPTIONAL - 1 by default] The number of items to return. Must be greater than 0.
- `display_ties_mode` - [OPTIONAL - 0 by default] A number representing the way to display ties.
  + 0: Show at most the first `n` rows in the sorted range.
  + 1: Show at most the first `n` rows, plus any additional rows that are identical to the `nth` row.
  + 2: Show at most the first `n` rows after removing duplicate rows.
  + 3: Show at most the first `n` unique rows, but show every duplicate of these rows.
- `sort_column1` - [OPTIONAL] - The index of the column in `range` or a range outside of `range` containing the values to sort by. A range specified as a `sort_column1` must be a single column with the same number of rows as `range`.
- `is_ascending1` - [OPTIONAL] - `TRUE` or `FALSE` indicates how to sort sort\_column1. `TRUE` sorts in ascending order. `FALSE` sorts in descending order.
- `sort_column2, is_ascending2, ...` - [OPTIONAL] - Additional columns and sort order flags used if a tie happens, in order of precedence.

### Notes

- `range` is sorted *only* by the specified columns. Other columns are returned in the order they originally appear.
- If `sort_column1` and `is_ascending1` aren't included, the sort is performed on the lowest-index column in `range`, with subsequent columns used to sort if there are ties.

### See Also

- [[SORT]]: Sorts the rows of a given array or range by the values in one or more columns.
- [[FILTER]]: Returns a filtered version of the source range, returning only rows or columns that meet the specified conditions.
- [[MAX]]: Returns the maximum value in a numeric dataset.
- [[INDEX]]: Returns the content of a cell, specified by row and column offset.
- [[LARGE]]: Returns the nth largest element from a data set, where n is user-defined.

### Examples

The following table is used for the examples below.

| 1 | Student | Test 1 score | Test 2 score |
| --- | --- | --- | --- |
| **2** | Alice | 100 | 90 |
| **3** | Bob | 75 | 85 |
| **4** | Carol | 80 | 85 |
| **5** | Devon | 100 | 95 |
| **6** | Eloise | 80 | 90 |

| Formula | Result |
| --- | --- |
| =SORTN(A2:C6) | Alice 100 90 |
| =SORTN(A2:C6, 2) | Alice 100 90  Bob 75 85 |
| =SORTN(A2:C6, 3, 0, B2:B6, FALSE) | Alice 100 90  Devon 100 95  Carol 80 85 |
| =SORTN(A2:C6, 3, 1, B2:B6, FALSE) | Alice 100 90  Devon 100 95  Carol 80 85  Eloise 80 90 |
| =SORTN(A2:C6, 3, 2, B2:B6, FALSE) | Alice 100 90  Carol 80 85  Bob 75 85 |
| =SORTN(A2:C6, 3, 3, B2:B6, FALSE) | Alice 100 90  Devon 100 95  Carol 80 85  Eloise 80 90  Bob 75 85 |
| =SORTN(A2:C6, 3, 3, 2, FALSE, 3, FALSE) | Devon 100 95  Alice 100 90  Eloise 80 90 |