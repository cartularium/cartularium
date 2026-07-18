---
name: GETPIVOTDATA
category: lookup
syntax: GETPIVOTDATA(value_name, any_pivot_table_cell, [original_column, ...], [pivot_item, ...])
status: imported
description: Extracts an aggregated value from a pivot table that corresponds to the specified row and column headings.
tags: [modified, undocumented]
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/6167538?hl=en).

Extracts an aggregated value from a pivot table that corresponds to the specified row and column headings.

### Sample Usage

```gse
GETPIVOTDATA("SUM of number of units", 'Pivot table'!A1)
GETPIVOTDATA("AVERAGE of price per unit", A1, "division", "east")
GETPIVOTDATA("price per unit", B2, "division", "east", "subdivision", 2)
GETPIVOTDATA(A1, 'Pivot table'!A1, "division", A2)
```

### Syntax

```gse
GETPIVOTDATA(value_name, any_pivot_table_cell, [original_column, ...], [pivot_item, ...])
```

- `value_name` - The name of the value in the pivot table for which you want to get data.
  + `value_name` must be enclosed in quotation marks or be a reference to any cell containing the appropriate text.
  + If there is more than one value field, you have to use the exact name that appears in the pivot table (For example, “SUM of Sales”).
- `any_pivot_table_cell` - Any reference to a cell in the desired pivot table (top corner recommended).
- `original_column` - **[** OPTIONAL **]** - The name of the column in the source data set (not the pivot table).
- `pivot_item` - **[** OPTIONAL **]** - The name of the row or column shown in the pivot table corresponding to `original_column` that you want to retrieve.

### Notes

- Text provided to the arguments is not case-sensitive, except when referring to field names. You can use any combination of uppercase or lowercase letters.
- If you use a custom heading for a field in your pivot table, `GETPIVOTDATA` will only work with the custom heading instead of the column name in the source data.
- While any cell in the pivot table may be chosen for `any_pivot_table_cell`, it's best to choose the cell in the top corner.  If the pivot table decreases in size as data is modified, and the chosen cell is no longer in the pivot table, then `GETPIVOTDATA` will result in an error.
- A value must appear in the pivot table itself in order for it to be returned by GETPIVOTDATA.

### See Also

[[QUERY]] - Runs a Google Visualization API Query Language query across data.

[[FILTER]] - Returns a filtered version of the source range, returning only rows or columns that meet the specified conditions.

[[DATE]] - Converts a year, month, and day into a date.

[[TIME]] - Converts an hour, minute, and second into a time.

### Related articles

- [Create and use pivot tables](https://support.google.com/docs/answer/1272900)
- [Customize a pivot table](https://support.google.com/docs/answer/7572895)

### Examples

Dataset for the examples below.

<iframe height="300" src="https://docs.google.com/spreadsheets/d/17aD9aiIMP5BUxkQDkElDUL4lsA3r5kM26txJjhXUzOY/pubhtml?gid=0&amp;single=true" width="500"></iframe>

Pivot table using the data above.

<iframe height="300" src="https://docs.google.com/spreadsheets/d/17aD9aiIMP5BUxkQDkElDUL4lsA3r5kM26txJjhXUzOY/pubhtml?gid=1961367216&amp;single=true" width="500"></iframe>

Extracting various attributes from the pivot table using `GETPIVOTDATA.`

<iframe height="300" src="https://docs.google.com/spreadsheets/d/17aD9aiIMP5BUxkQDkElDUL4lsA3r5kM26txJjhXUzOY/pubhtml?gid=930651231&amp;single=true" width="500"></iframe>