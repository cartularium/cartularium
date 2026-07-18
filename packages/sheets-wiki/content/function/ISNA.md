---
name: ISNA
category: info
syntax: ISNA(value)
status: imported
description: Checks whether a value is the error `#N/A`.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093293?hl=en).

Checks whether a value is the error `#N/A`.

### Sample Usage

```gse
ISNA(A2)
```

### Syntax

```gse
ISNA(value)
```

- `value` - The value to be compared with the error value `#N/A`.

  \*`ISNA` returns `TRUE` if `value` is `#N/A` or a reference to a cell containing `#N/A` and false otherwise.

### Notes

- This function is most often used in conjunction with `IF` in conditional statements.

### See Also

[[ISTEXT]]: Checks whether a value is text.

[[ISREF]]: Checks whether a value is a valid cell reference.

[[ISODD]]: Checks whether the provided value is odd.

[[ISNUMBER]]: Checks whether a value is a number.

[[ISNONTEXT]]: Checks whether a value is non-textual.

[[ISLOGICAL]]: Checks whether a value is `TRUE` or `FALSE`.

[[ISEVEN]]: Checks whether the provided value is even.

[[ISERROR]]: Checks whether a value is an error.

[[ISERR]]: Checks whether a value is an error other than `#N/A`.

[[ISBLANK]]: Checks whether the referenced cell is empty.

[[IF]]: Returns one value if a logical expression is `TRUE` and another if it is `FALSE`.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdDVDZEx2YXg5dF9HVFVPQlNEZk10V2c&amp;output=html" width="500"></iframe>