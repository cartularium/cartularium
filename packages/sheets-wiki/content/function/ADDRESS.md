---
name: ADDRESS
category: lookup
syntax: ADDRESS(row, column, [absolute_relative_mode], [use_a1_notation], [sheet])
status: imported
description: Returns a cell reference as a string.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093308?hl=en).

Returns a cell reference as a string.

### Sample Usage

```gse
ADDRESS(1,2)
ADDRESS(1,2,4,FALSE)
ADDRESS(1,2,,,"Sheet2")
```

### Syntax

```gse
ADDRESS(row, column, [absolute_relative_mode], [use_a1_notation], [sheet])
```

- `row` - The row number of the cell reference
- `column` - The column number (not name) of the cell reference. `A` is column number `1`.
- `absolute_relative_mode` - **[** OPTIONAL - `1` by default **]** - An indicator of whether the reference is row/column absolute. `1` is row and column absolute (e.g. \$A\$1), `2` is row absolute and column relative (e.g. A\$1), `3` is row relative and column absolute (e.g. \$A1), and `4` is row and column relative (e.g. A1).
- `use_a1_notation` - **[** OPTIONAL - `TRUE` by default **]** - A boolean indicating whether to use `A1` style notation (TRUE) or `R1C1` style notation (FALSE).
- `sheet` - **[** OPTIONAL - absent by default **]** - A string indicating the name of the sheet into which the address points.

### Notes

- When using optional parameters such as `sheet`, ensure that commas are inserted to indicate which parameter is being set.

### See Also

[[OFFSET]]: Returns a range reference shifted a specified number of rows and columns from a starting cell reference.

[[MATCH]]: Returns the relative position of an item in a range that matches a specified value.

[[INDEX]]: Returns the content of a cell, specified by row and column offset.

### Examples

Returns the cell address (reference) as text, according to the specified row and column numbers, using different types of reference.

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdHNuV2VTZ2ViSGd1Y2l3TFU1ODRQR0E&amp;single=true&amp;gid=0&amp;output=html&amp;widget=true" width="500"></iframe>