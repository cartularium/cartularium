---
name: TYPE
category: info
syntax: TYPE(value)
status: imported
description: Returns a number associated with the type of data passed into the function.
tags: [modified, undocumented]
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3267375?hl=en).

Returns a number associated with the type of data passed into the function.

### Sample Usage

```gse
TYPE(C4)
TYPE({1;2;3;4;5})
```

### Syntax

```gse
TYPE(value)
```

- `value` - The data whose type is to be determined.

### Notes

- This function returns the following numbers:
  + 1: if `value` is a number
  + 2: if `value` is text
  + 4: if `value` is boolean
  + 16: if `value` is an error
  + 64: if `value` is an array
  + 128: for any other type of cell. For example, in-cell images and sparklines.
- The function cannot determine whether or not a cell or range of cells is using a formula, only returning the type of value being displayed in the cells.

### See Also

[[ISTEXT]]: Checks whether a value is text.

[[ISNUMBER]]: Checks whether a value is a number.

[[ISLOGICAL]]: Checks whether a value is `TRUE` or `FALSE`.

[[ISERROR]]: Checks whether a value is an error.