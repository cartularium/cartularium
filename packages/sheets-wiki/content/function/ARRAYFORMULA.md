---
name: ARRAYFORMULA
category: google
syntax: ARRAYFORMULA(array_formula)
status: imported
description: The primary array-enabling function. Enables the use of non-array functions with arrays.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093275?hl=en).

`ARRAYFORMULA` is the primary [[Array-enabled functions|array-enabling function]]. It enables the display of values returned from an [[Array|array formula]] into multiple rows and/or columns and the use of non-array functions with arrays.

### Sample Usage

```gse
ARRAYFORMULA(SUM(IF(A1:A10>5, A1:A10, 0)))
ARRAYFORMULA(A1:C1+A2:C2)
```

### Syntax

```gse
ARRAYFORMULA(array_formula)
```

- `array_formula` - A range, mathematical expression using one cell range or multiple ranges of the same size, or a function that returns a result greater than one cell.

### Math Operations

When using mathematical operations with arrays, the behavior differs from aggregate functions:

```gse
=ARRAYFORMULA(SUM(A1:A,B1:B))    → Single value (overall sum)
=ARRAYFORMULA(A1:A+B1:B)         → Array (row-by-row addition)
```

For row-wise operations, use arithmetic operators directly: `+`, `-`, `*`, `/`

### Controlling Array Output

To prevent "runaway" arrays that fill thousands of rows, use control structures:

**Using IF with ISBLANK:**
```gse
=ARRAYFORMULA(IF(ISBLANK(A2:A),,A2:A*2))
```

**Using ARRAY_CONSTRAIN:**
```gse
=ARRAY_CONSTRAIN(ARRAYFORMULA(A2:A*2), COUNTA(A2:A), 1)
```

**Regional Note:** European locales use backslash (`\`) instead of comma (`,`) for column delimiters in array literals: `{1\2\3}` instead of `{1,2,3}`

### Notes

- Many array formulas will be automatically expanded into neighboring cells, obviating the explicit use of `ARRAYFORMULA`.
- Pressing `Ctrl+Shift+Enter` (`Cmd+Shift+Enter` on Mac) while editing a formula will automatically add `ARRAYFORMULA(` to the beginning of the formula.
- Note that array formulas cannot be exported.
- `ARRAYFORMULA` is not the only function that enables array evaluation. See [[Array-enabled functions]] for a full list.

### See Also

[[ARRAY_CONSTRAIN]]: Constrains an array result to a specified size.

[[Array-enabled functions]]: Explains array iteration and lists array-enabling functions.