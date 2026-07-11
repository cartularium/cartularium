---
name: T
category: text
syntax: T(value)
status: imported
description: Returns string arguments as text.
tags: [modified, undocumented]
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094138?hl=en).

Returns string arguments as text.

### Sample Usage

```gse
T(A2)
T("cat")
```

### Syntax

```gse
T(value)
```

- `value` - The argument to be converted to text.

  + If `value` is text, `T` returns `value`.
  + If `value` is a reference to a cell containing text, `T` returns the contents of `value`.
  + If `value` is an error or a cell containing an error, `T` returns the error.
  + Otherwise, `T` returns an empty string.

### Notes

- This function is rarely necessary as Google Sheets automatically converts between most formats appropriately. It is provided primarily for compatibility with formulas used in other spreadsheet packages.

### Engine compatibility

`T` of a text value returns that text on every engine that implements it. The subtlety is `T` of a *non-text* value: the result is empty text, but engines represent "empty text" two ways — a genuinely blank cell versus a zero-length string `""`. Testing `=T(TRUE)`:

| Engine | Behavior |
| --- | --- |
| Google Sheets | Returns `""` (a zero-length string). |
| Excel | Returns a blank cell (live probe context; assay: T/t-of-boolean). |
| IronCalc | Returns `""` (live probe, 2026-07-11). |
| Lattice | Returns `""`. |
| formulas | Returns a blank cell (live probe, 2026-07-11). |
| HyperFormula | Computes `T("hello")` = `"hello"` but returns `#NAME?` for `=T(TRUE)` — its `T` handling is uneven across argument types (live probe, 2026-07-11). |
| pycel | `#NAME?` — `T` is not implemented at all (live probe, 2026-07-11). |

> [!INFO]
> The blank-cell-versus-`""` distinction is invisible to a human reading the cell, but a downstream `ISBLANK` or `LEN` on the result of `T` will disagree across engines. See [[Null]] for the underlying value-model split.

### See Also

[[N]]: Returns the argument provided as a number.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdGNoWnVxeEhhemdQZFFQOHlLalpYNXc&amp;output=html" width="500"></iframe>