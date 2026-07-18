---
name: ROW
category: lookup
syntax: ROW([cell_reference])
status: imported
description: Returns the row number of a specified cell.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093316?hl=en).

Returns the row number of a specified cell.

### Sample Usage

```gse
ROW(A9)
```

### Syntax

```gse
ROW([cell_reference])
```

- `cell_reference` - **[** OPTIONAL - The cell in which the formula is entered by default **]** - The cell whose row number will be returned.

  + if `cell_reference` is a range more than one cell wide and the formula is not used as an array formula, only the numeric value of the first row in `cell_reference` is returned.

### See Also

[[ROWS]]: Returns the number of rows in a specified array or range.

[[COLUMNS]]: Returns the number of columns in a specified array or range.

[[COLUMN]]: Returns the column number of a specified cell, with `A=1`.

### Examples

Returns the row number of a cell reference.

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdDZPWXdXMU1BTEMzZ2JYbmlrV3VPZ2c&amp;single=true&amp;gid=2&amp;output=html&amp;widget=true" width="500"></iframe>