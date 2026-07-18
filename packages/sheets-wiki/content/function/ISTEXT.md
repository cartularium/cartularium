---
name: ISTEXT
category: info
syntax: ISTEXT(value)
status: imported
description: Checks whether a value is text.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093297?hl=en).

Checks whether a value is text.

### Sample Usage

```gse
ISTEXT(A2)
ISTEXT("cat")
```

### Syntax

```gse
ISTEXT(value)
```

- `value` - The value to be verified as text.

  + `ISTEXT` returns `TRUE` if this is a text value or a reference to a cell containing a text value and `FALSE` otherwise.

### Notes

- This function is most often used in conjunction with `IF` in conditional statements.
- Note that supplying the empty string to this function (e.g. `ISTEXT("")`) will cause it to return `TRUE` whereas a reference to a blank cell will return `FALSE`.

### See Also

[[ISREF]]: Checks whether a value is a valid cell reference.

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

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdDZsY29ockF1Q1FUalF4ajJJQ3NnMHc&amp;output=html" width="500"></iframe>