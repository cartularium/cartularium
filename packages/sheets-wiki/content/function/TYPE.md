---
name: TYPE
category: info
syntax: TYPE(value)
status: imported
description: Returns a number associated with the type of data passed into the function.
tags: [modified, undocumented]
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3267375?hl=en).

Returns a number associated with the type of data passed into the function.

### Sample Usage

```gse
TYPE(C4)
TYPE({1;2;3;4;5})
```

### Syntax

```gse
TYPE(value)
```

- `value` - The data whose type is to be determined.

### Notes

- This function returns the following numbers:
  + 1: if `value` is a number
  + 2: if `value` is text
  + 4: if `value` is boolean
  + 16: if `value` is an error
  + 64: if `value` is an array
  + 128: for any other type of cell. For example, in-cell images and sparklines.
- The function cannot determine whether or not a cell or range of cells is using a formula, only returning the type of value being displayed in the cells.

### Engine compatibility

The numeric codes themselves — `1` number, `2` text, `4` boolean, `16` error, `64` array — are portable across the engines that implement `TYPE` at all: Excel, Google Sheets, IronCalc, and Lattice agree on every scalar argument (assay: TYPE/type-of-number, TYPE/type-of-text, TYPE/type-of-boolean, TYPE/type-of-error). The portable core ends at the engines that lack the spreadsheet `TYPE` entirely, and at two edges — array typing and the empty cell.

| Engine | Behavior |
| --- | --- |
| Google Sheets | Full support; `1/2/4/16/64` as documented, and `1` for an empty cell. |
| Excel | Same as Google Sheets (live probe context; codes match the corpus). |
| IronCalc | Scalar codes agree, but `=TYPE({1,2,3})` returns `#N/IMPL!` — no array support for `TYPE` (live probe, 2026-07-11). |
| Lattice | Scalar codes agree, but `=TYPE(A1)` over a *truly empty* cell returns `#N/A` where the others return `1` (assay: TYPE/type-of-blank-cell). |
| HyperFormula | `#NAME?` for every argument — `TYPE` is not implemented (live probe, 2026-07-11). |
| pycel | Does not implement the spreadsheet `TYPE`; it leaks Python's `type()` and returns the class-repr string — `<class 'int'>`, `<class 'str'>`, `<class 'bool'>`, `<class 'NoneType'>` — instead of a code. `=TYPE(1/0)` returns `#NAME?` because pycel cannot evaluate the inner `1/0` (live probe, 2026-07-11). |

> [!INFO]
> Code `128` (in-cell images, sparklines) and the array code `64` are the least portable. Do not rely on `TYPE` under HyperFormula or pycel, and do not feed it an array argument if IronCalc is a target.

### See Also

[[ISTEXT]]: Checks whether a value is text.

[[ISNUMBER]]: Checks whether a value is a number.

[[ISLOGICAL]]: Checks whether a value is `TRUE` or `FALSE`.

[[ISERROR]]: Checks whether a value is an error.