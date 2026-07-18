---
name: COLUMNS
category: lookup
syntax: COLUMNS(range)
status: imported
description: Returns the number of columns in a specified array or range.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093374?hl=en).

Returns the number of columns in a specified array or range.

### Sample Usage

```gse
COLUMNS(A9:W62)
COLUMNS({1,2,3,4,5})
```

### Syntax

```gse
COLUMNS(range)
```

- `range` - The range whose column count will be returned

### See Also

[[ROWS]]: Returns the number of rows in a specified array or range.

[[ROW]]: Returns the row number of a specified cell.

[[COLUMN]]: Returns the column number of a specified cell, with `A=1`.

### Examples

Returns the number of columns in the given reference.

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdFpoTUFSZXcyODVLd1FRU3YxYnY0NGc&amp;single=true&amp;gid=2&amp;output=html&amp;widget=true" width="500"></iframe>