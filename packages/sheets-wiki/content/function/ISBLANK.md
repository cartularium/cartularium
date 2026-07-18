---
name: ISBLANK
category: info
syntax: ISBLANK(value)
status: imported
description: Checks whether a value is null.
tags: [modified, undocumented]
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093290?hl=en).

> [!INFO]
> Official documentation uses the following description for `ISBLANK`:
> > Checks whether the referenced cell is empty.

Checks whether a value is [[Null|null]].

### Sample Usage

```gse
ISBLANK(A2)
IF(ISBLANK(B1),,A1/B1)
```

### Syntax

```gse
ISBLANK(value)
```

- `value` - Reference to the cell that will be checked for emptiness.

  + `ISBLANK` returns `TRUE` if `value` is empty or a reference to an empty cell, and `FALSE` if it contains data or a reference to data.

### Notes

- `ISBLANK` returns `FALSE` if the referenced cell has *any* content, including spaces, the empty string (`""`), and hidden characters. In case of unexpected `FALSE` results, try clearing the cell again to remove any hidden characters.
- This function is most often used in conjunction with `IF` in conditional statements.

### See Also

[[ISTEXT]]: Checks whether a value is text.

[[ISREF]]: Checks whether a value is a valid cell reference.

[[ISNUMBER]]: Checks whether a value is a number.

[[ISNONTEXT]]: Checks whether a value is non-textual.

[[ISNA]]: Checks whether a value is the error `#N/A`.

[[ISLOGICAL]]: Checks whether a value is `TRUE` or `FALSE`.

[[ISERROR]]: Checks whether a value is an error.

[[ISERR]]: Checks whether a value is an error other than `#N/A`.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdDZOSXlQd0FnNnZhck5EMzh0TXpaeXc&amp;output=html" width="500"></iframe>

[Make a copy](https://docs.google.com/spreadsheets/d/1xB2xBdj3PTkBaAi1yVzCgIZK_kurg8FKTNJFMtL7QS8/copy)