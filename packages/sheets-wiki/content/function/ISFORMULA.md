---
name: ISFORMULA
category: info
syntax: ISFORMULA(cell)
status: imported
description: Checks whether a formula is in the referenced cell.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/6270316?hl=en).

Checks whether a formula is in the referenced cell.

### Sample Usage

```gse
ISFORMULA(A2)
```

### Syntax

```gse
ISFORMULA(cell)
```

- `cell` - The cell to check for a formula.

  + `ISFORMULA` returns `TRUE` if `cell` is a cell that contains a formula. If `cell` contains a range of cells then `TRUE` will be returned if the first cell in the range contains a formula. All other values will return `FALSE`.

### Notes

- `cell` can refer to a cell, a name associated with a cell, or a range (multiple cells).
- This function is most often used in conjunction with `IF` in conditional statements.

### See Also

[[ISERROR]]: Checks whether a value is an error.

[[ISTEXT]]: Checks whether a value is text.

[[ISREF]]: Checks whether a value is a valid cell reference.

[[ISODD]]: Checks whether the provided value is odd.

[[ISNUMBER]]: Checks whether a value is a number.

[[ISNONTEXT]]: Checks whether a value is non-textual.

[[ISNA]]: Checks whether a value is the error `#N/A`.

[[ISLOGICAL]]: Checks whether a value is `TRUE` or `FALSE`.

[[ISEVEN]]: Checks whether the provided value is even.

[[ISERR]]: Checks whether a value is an error other than `#N/A`.

[[ISBLANK]]: Checks whether the referenced cell is empty.

[[IF]]: Returns one value if a logical expression is `TRUE` and another if it is `FALSE`.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheets/d/1e6n66ld6CsLqAWmBC2NDiIzKlXfjPzusBxznDgxF5yM/pubhtml" width="500"></iframe>