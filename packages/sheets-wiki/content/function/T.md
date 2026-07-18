---
name: T
category: text
syntax: T(value)
status: imported
description: Returns string arguments as text.
tags: [modified, undocumented]
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094138?hl=en).

Returns string arguments as text.

### Sample Usage

```gse
T(A2)
T("cat")
```

### Syntax

```gse
T(value)
```

- `value` - The argument to be converted to text.

  + If `value` is text, `T` returns `value`.
  + If `value` is a reference to a cell containing text, `T` returns the contents of `value`.
  + If `value` is an error or a cell containing an error, `T` returns the error.
  + Otherwise, `T` returns an empty string.

### Notes

- This function is rarely necessary as Google Sheets automatically converts between most formats appropriately. It is provided primarily for compatibility with formulas used in other spreadsheet packages.

### See Also

[[N]]: Returns the argument provided as a number.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdGNoWnVxeEhhemdQZFFQOHlLalpYNXc&amp;output=html" width="500"></iframe>