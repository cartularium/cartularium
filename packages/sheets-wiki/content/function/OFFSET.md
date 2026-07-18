---
name: OFFSET
category: lookup
syntax: OFFSET(cell_reference, offset_rows, offset_columns, [height], [width])
status: imported
description: Returns a range reference shifted a specified number of rows and columns from a starting cell reference.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093379?hl=en).

Returns a range reference shifted a specified number of rows and columns from a starting cell reference.

### Sample Usage

```gse
OFFSET(A2,3,4,2,2)
OFFSET(A2,1,1)
```

### Syntax

```gse
OFFSET(cell_reference, offset_rows, offset_columns, [height], [width])
```

- `cell_reference` - The starting point from which to count the offset rows and columns.
- `offset_rows` - The number of rows to shift by.

  + `offset_rows` must be an integer, but may be negative. If a decimal value is provided, the decimal part will be truncated.
- `offset_columns` - The number of columns to shift by.

  + `offset_columns` must be an integer, but may be negative. If a decimal value is provided, the decimal part will be truncated.
- `height` - **[** OPTIONAL **]** - The height of the range to return starting at the offset target.
- `width` - **[** OPTIONAL **]** - The width of the range to return starting at the offset target.

### Notes

- If `offset_rows` or `offset_columns` is negative, it is possible for the offset target to to be outside the upper or left edge of the spreadsheet. If this occurs, the `#REF!` error will be returned.
- If `OFFSET` is used as an array formula, it is possible for the value returned by the array formula to overwrite part of the offset target, causing a circular reference. If this occurs, the `#REF!` error will be returned.

### Examples

Returns the value of a cell offset by a certain number of rows and columns from a given reference point.

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdGY4YmF5ZlBLMTNvbkx0TTcxY2VIcXc&amp;single=true&amp;gid=2&amp;output=html&amp;widget=true" width="500"></iframe>

[Make a copy](https://docs.google.com/spreadsheets/d/1-ML5u68TDMlIDbhFM0hPd0T6DchqytdhB_g7Oe5DP_M/copy)