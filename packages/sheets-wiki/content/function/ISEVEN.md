---
name: ISEVEN
category: math
syntax: ISEVEN(value)
status: imported
description: Checks whether the provided value is even.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093419?hl=en).

Checks whether the provided value is even.

### Sample Usage

```gse
ISEVEN(4)
ISEVEN(A2)
```

### Syntax

```gse
ISEVEN(value)
```

- `value` - The value to be verified as even.

  + `ISEVEN` returns `TRUE` if `value` is an even integer or a reference to a cell containing an even integer, and `FALSE` otherwise.

### Notes

- This function is most often used in conjunction with `IF` in conditional statements.

### See Also

[[ISTEXT]]: Checks whether a value is text.

[[ISREF]]: Checks whether a value is a valid cell reference.

[[ISODD]]: Checks whether the provided value is odd.

[[ISNUMBER]]: Checks whether a value is a number.

[[ISNONTEXT]]: Checks whether a value is non-textual.

[[ISNA]]: Checks whether a value is the error `#N/A`.

[[ISLOGICAL]]: Checks whether a value is `TRUE` or `FALSE`.

[[ISERROR]]: Checks whether a value is an error.

[[ISERR]]: Checks whether a value is an error other than `#N/A`.

[[ISBLANK]]: Checks whether the referenced cell is empty.

[[IF]]: Returns one value if a logical expression is `TRUE` and another if it is `FALSE`.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdFB6LXEzRVE3NnBfOFhyM0ZOZTNLdHc&amp;output=html" width="500"></iframe>