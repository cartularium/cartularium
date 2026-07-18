---
name: ISODD
category: math
syntax: ISODD(value)
status: imported
description: Checks whether the provided value is odd.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093491?hl=en).

Checks whether the provided value is odd.

### Sample Usage

```gse
ISODD(4)
ISODD(A2)
```

### Syntax

```gse
ISODD(value)
```

- `value` - The value to be verified as odd.

  + `ISODD` returns `TRUE` if `value` is an odd integer or a reference to a cell containing an odd integer, and `FALSE` otherwise.

### Notes

- This function is most often used in conjunction with `IF` in conditional statements.

### See Also

[[ISTEXT]]: Checks whether a value is text.

[[ISREF]]: Checks whether a value is a valid cell reference.

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

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdFVYMmZ0NmJhaG9iSDlSZVZUV2t3RHc&amp;output=html" width="500"></iframe>