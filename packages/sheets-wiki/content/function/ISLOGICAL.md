---
name: ISLOGICAL
category: info
syntax: ISLOGICAL(value)
status: imported
description: Checks whether a value is `TRUE` or `FALSE`.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093351?hl=en).

Checks whether a value is `TRUE` or `FALSE`.

### Sample Usage

```gse
ISLOGICAL(A2)
```

### Syntax

```gse
ISLOGICAL(value)
```

- `value` - The value to be verified as a logical `TRUE` or `FALSE`.

  \*`ISLOGICAL` returns `TRUE` if `value` is either `TRUE` or `FALSE` or a reference to a cell whose value is either `TRUE` or `FALSE`.

### Notes

- This function is most often used in conjunction with `IF` in conditional statements.

### See Also

[[ISTEXT]]: Checks whether a value is text.

[[ISREF]]: Checks whether a value is a valid cell reference.

[[ISODD]]: Checks whether the provided value is odd.

[[ISNUMBER]]: Checks whether a value is a number.

[[ISNONTEXT]]: Checks whether a value is non-textual.

[[ISNA]]: Checks whether a value is the error `#N/A`.

[[ISEVEN]]: Checks whether the provided value is even.

[[ISERROR]]: Checks whether a value is an error.

[[ISERR]]: Checks whether a value is an error other than `#N/A`.

[[ISBLANK]]: Checks whether the referenced cell is empty.

[[IF]]: Returns one value if a logical expression is `TRUE` and another if it is `FALSE`.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdFRwSThnZ0E5c3pIS0J0X1hRTUg0MHc&amp;output=html" width="500"></iframe>