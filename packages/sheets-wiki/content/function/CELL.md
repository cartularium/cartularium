---
name: CELL
category: info
syntax: CELL(info_type, reference)
status: imported
description: Returns the requested information about the specified cell.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3267071?hl=en).

Returns the requested information about the specified cell.

### Sample Usage

```gse
CELL("type", C2)
CELL("width", A10)
```

### Syntax

```gse
CELL(info_type, reference)
```

- `info_type` - The type of information requested.
- `reference` - The reference to the cell.

### Notes

- `info_type` can be one of the following values:
  + "address" - returns an absolute reference as plain text of the top left cell in `reference`.
  + "col" - returns the column number of the cell in `reference`.
  + "color" - returns 1 if the top left cell in `reference` is formatted in red for negative values. For example, when the custom number format is `(#,##0);[Red](#,##0)`, otherwise return 0.
  + "contents" - returns the value contained in the top left cell in `reference`.
  + "prefix" - returns a text value based on the horizontal text alignment in the cell in `reference`. A single quotation mark (') is used for left-aligned text, a double quotation mark (“) for right-aligned text, a carat (^) for centered text, and empty for everything else.
  + "row" - returns the row number of the top left cell in `reference`.
  + "type" - returns the type of data in the cell in `reference`. The following values are returned: "b" for a blank cell, "l" (for label) if the cell contains plain text, and "v" (for value) if the cell contains any other type of data.
  + "width" - returns the column width in terms of number of characters that can fit in the cell provided in `reference`. The number returned is determined based on the width of the zero (0) character at the default font size. Note that this is different from the cell width that Google Sheets uses elsewhere, which is defined in terms of pixels.

### See Also

[[TYPE]]: Returns a number associated with the type of data passed into the function.

[[ERROR.TYPE]]: Returns a number corresponding to the error value in a different cell.

[[ROW]]: Returns the row number of a specified cell.

[[COLUMN]]: Returns the column number of a specified cell, with `A=1`.