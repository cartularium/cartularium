---
name: ISNONTEXT
category: info
syntax: ISNONTEXT(value)
status: imported
description: Checks whether a value is non-textual.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093295?hl=en).

Checks whether a value is non-textual.

### Sample Usage

```gse
ISNONTEXT(A2)
ISNONTEXT("cat")
```

### Syntax

```gse
ISNONTEXT(value)
```

- `value` - The text to be checked.

  + `ISNONTEXT` returns `FALSE` if this is a text value or a reference to a cell containing a text value and `TRUE` otherwise.
  + When `value` is a reference to an empty cell, `ISNONTEXT` will return `TRUE`.
  + When `value` is an empty string, `ISNONTEXT` will return `FALSE`, as the empty string is considered text.

### Notes

- Nonprinting characters and whitespace count as text, so when `ISNONTEXT` is called on a cell containing such characters, the function will return `FALSE` even though the cell appears empty.
- Numbers input as text, e.g. `"1234"` count as text, and will cause `ISNONTEXT` to return `FALSE`.
- `ISNONTEXT(value)` is the logical equivalent of `NOT(ISTEXT(value))`
- This function is most often used in conjunction with `IF` in conditional statements.

### See Also

[[ISTEXT]]: Checks whether a value is text.

[[ISREF]]: Checks whether a value is a valid cell reference.

[[ISODD]]: Checks whether the provided value is odd.

[[ISNUMBER]]: Checks whether a value is a number.

[[ISNA]]: Checks whether a value is the error `#N/A`.

[[ISLOGICAL]]: Checks whether a value is `TRUE` or `FALSE`.

[[ISEVEN]]: Checks whether the provided value is even.

[[ISERROR]]: Checks whether a value is an error.

[[ISERR]]: Checks whether a value is an error other than `#N/A`.

[[ISBLANK]]: Checks whether the referenced cell is empty.

[[IF]]: Returns one value if a logical expression is `TRUE` and another if it is `FALSE`.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdHdxSmlNMklPYXhpbHdFSjNKTFNpNWc&amp;output=html" width="500"></iframe>