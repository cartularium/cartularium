---
name: HLOOKUP
category: lookup
syntax: HLOOKUP(search_key, range, index, [is_sorted])
status: imported
description: Horizontal lookup.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093375?hl=en).

Horizontal lookup. Searches across the first row of a range for a key and returns the value of a specified cell in the column found.

### Sample Usage

```gse
HLOOKUP(10003, A2:Z6, 2, FALSE)
```

### Syntax

```gse
HLOOKUP(search_key, range, index, [is_sorted])
```

- `search_key` - The value to search for. For example, `42`, `"Cats"`, or `I24`.
- `range` - The range to consider for the search. The first row in the range is searched for the key specified in `search_key`.
- `index` - The row index of the value to be returned, where the first row in `range` is numbered 1.

  + If `index` is not between 1 and the number of rows in `range`, `#VALUE!` is returned.
- `is_sorted` - **[**OPTIONAL - `TRUE` by default**]** - Indicates whether the row to be searched (the first row of the specified range) is sorted.

  + If `is_sorted` is `TRUE` or omitted, the nearest match (less than or equal to the search key) is returned. If all values in the search row are greater than the search key, `#N/A` is returned.
  + If `is_sorted` is set to `TRUE` or omitted, and the first row of the range is not in sorted order, an incorrect value might be returned.
  + If `is_sorted` is `FALSE`, only an exact match is returned. If there are multiple matching values, the content of the cell corresponding to the first value found is returned, and `#N/A` is returned if no such value is found.

### Notes

- When searching for numeric or date values, make sure that the first row in the range is not sorted by text values. For example, correctly sorted numbers should appear as (1, 2, 10, 100) rather than (1, 10, 100, 2) as they would be if they were sorted as strings. Using an incorrect sort type may cause incorrect values to be returned.
- Search keys based on regular expressions or wildcard patterns are NOT supported. Use [[QUERY]] instead.
- HLOOKUP has much better performance with sorted ranges and `is_sorted` set to `TRUE`. Consider sorting the row being searched.

### See Also

[[QUERY]]: Runs a Google Visualization API Query Language query across data.

[[VLOOKUP]]: Vertical lookup. Searches down the first column of a range for a key and returns the value of a specified cell in the row found.

### Examples

In this example, `HLOOKUP` searches across the first row for a student ID and returns the corresponding grade.

<iframe height="240" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdGtaUzBJNUVOUlU5Y0otX0NyZUhCYnc&amp;single=true&amp;gid=0&amp;output=html&amp;widget=true" width="550"></iframe>

In this example, `HLOOKUP` searches across the first row for the income using approximate match (`is_sorted` is set to `TRUE`) and returns the corresponding tax rate.

<iframe height="240" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdGtaUzBJNUVOUlU5Y0otX0NyZUhCYnc&amp;single=true&amp;gid=1&amp;output=html&amp;widget=true" width="550"></iframe>

In this example, `HLOOKUP` returns the first value found when there are multiple matches for the `search_key`.

<iframe height="240" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdGtaUzBJNUVOUlU5Y0otX0NyZUhCYnc&amp;single=true&amp;gid=2&amp;output=html&amp;widget=true" width="550"></iframe>