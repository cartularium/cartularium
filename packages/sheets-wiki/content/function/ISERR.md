---
name: ISERR
category: info
syntax: ISERR(value)
status: imported
description: Checks whether a value is an error other than `#N/A`.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093348?hl=en).

Checks whether a value is an error other than `#N/A`.

### Sample Usage

```gse
ISERR(A2)
```

### Syntax

```gse
ISERR(value)
```

- `value` - The value to be verified as an error type other than `#N/A`.

  + `ISERR` returns `TRUE` if `value` is any error other than `#N/A`,including `#DIV/0!`, `#NAME?`, `#NULL!`, `#NUM!`, `#VALUE!`, and `#REF!`. This is useful in certain applications where `#N/A` may be a valid outcome, whereas the other error types always indicate a fundamental problem.

### Notes

- `ISERR` returns `FALSE` on `#N/A`, unlike [[ISERROR]], which returns `TRUE` on all errors. Ensure that the correct call is used.
- This function is most often used in conjunction with `IF` in conditional statements.

### See Also

[[ISTEXT]]: Checks whether a value is text.

[[ISREF]]: Checks whether a value is a valid cell reference.

[[ISODD]]: Checks whether the provided value is odd.

[[ISNUMBER]]: Checks whether a value is a number.

[[ISNONTEXT]]: Checks whether a value is non-textual.

[[ISNA]]: Checks whether a value is the error `#N/A`.

[[ISLOGICAL]]: Checks whether a value is `TRUE` or `FALSE`.

[[ISEVEN]]: Checks whether the provided value is even.

[[ISERROR]]: Checks whether a value is an error.

[[ISBLANK]]: Checks whether the referenced cell is empty.

[[IF]]: Returns one value if a logical expression is `TRUE` and another if it is `FALSE`.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdFVvQ3hhaEIyc19DVzBZSlkwYWRCa2c&amp;output=html" width="500"></iframe>