---
name: COLUMN
category: lookup
syntax: COLUMN([cell_reference])
status: imported
description: Returns the column number of a specified cell, with `A=1`.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093373?hl=en).

Returns the column number of a specified cell, with `A=1`.

### Sample Usage

```gse
COLUMN(A9)
```

### Syntax

```gse
COLUMN([cell_reference])
```

- `cell_reference` - **[** OPTIONAL - By default, the cell containing the formula **]** - The cell whose column number will be returned. Column `A` corresponds to `1`.

  + if `cell_reference` is a range more than one cell wide and the formula is not used as an array formula, the position of the first column in `cell_reference` is returned.

### See Also

[[ROWS]]: Returns the number of rows in a specified array or range.

[[ROW]]: Returns the row number of a specified cell.

[[COLUMNS]]: Returns the number of columns in a specified array or range.

### Examples

Returns the column number of a cell reference.

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdE1ScmlwZXdiWXVUczFCY2huVmJkcXc&amp;single=true&amp;gid=2&amp;output=html&amp;widget=true" width="500"></iframe>