---
name: ISREF
category: info
syntax: ISREF(value)
status: imported
description: Checks whether a value is a valid cell reference.
tags: [modified, undocumented]
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093354?hl=en).

Checks whether a value is a valid cell reference.

### Sample Usage

```gse
ISREF(A2)
```

### Syntax

```gse
ISREF(value)
```

- `value` - The value to be verified as a cell reference.

  \*`ISREF` returns `TRUE` if this is a valid cell reference, and `FALSE` otherwise.

  + Providing a string containing a valid cell reference (e.g. "A2") for `value` returns `FALSE` as the input is a string, not a reference.

### Notes

- This function is most often used in conjunction with `IF` in conditional statements.

### See Also

[[ISTEXT]]: Checks whether a value is text.

[[ISODD]]: Checks whether the provided value is odd.

[[ISNUMBER]]: Checks whether a value is a number.

[[ISNONTEXT]]: Checks whether a value is non-textual.

[[ISNA]]: Checks whether a value is the error `#N/A`.

[[ISLOGICAL]]: Checks whether a value is `TRUE` or `FALSE`.

[[ISEVEN]]: Checks whether the provided value is even.

[[ISERROR]]: Checks whether a value is an error.

[[ISERR]]: Checks whether a value is an error other than `#N/A`.

[[ISBLANK]]: Checks whether the referenced cell is empty.

[[IF]]: Returns one value if a logical expression is `TRUE` and another if it is `FALSE`.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdHJ0WXROblA0MWpCTHdDUE52YjZtVnc&amp;output=html" width="500"></iframe>