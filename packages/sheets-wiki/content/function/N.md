---
name: 'N'
category: info
syntax: N(value)
status: imported
description: Returns the argument provided as a number.
tags: [modified, undocumented]
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093357?hl=en).

Returns the argument provided as a number.

### Sample Usage

```gse
N(A2)
N(4)
```

### Syntax

```gse
N(value)
```

- `value` - The argument to be converted to a number.

  + If `value` is `TRUE`, `N` returns `1`.
  + If `value` is a number, the number is returned.
  + If `value` is a date or time, `N` returns a generated serial number, based on the number of days since December 30, 1899.

    1. Negative values are interpreted as days before this date, and fractional values indicate time of day past midnight.
  + If `value` is `FALSE` or any value not listed above, `N` returns `0`.

### Notes

- When using `N` on numeric values in other cells, formatting (into currencies, scientific notation, etc.) is lost. To specify formatting on the return value of `N`, simply apply the format desired to the cell containing the formula.
- This function is, in fact, rarely necessary as Google Spreadsheet automatically converts between most formats appropriately. It is provided primarily for compatibility with formulas used in other spreadsheet packages.

### Engine compatibility

`N` is fully portable across the engines that record values. A number passes through, non-numeric text maps to `0`, and errors propagate unchanged: `=N(42)` is `42`, `=N("hello")` is `0`, and `=N(#VALUE!)` is `#VALUE!` on Excel, Google Sheets, HyperFormula, IronCalc, formulas, pycel, and Lattice alike (live probe, 2026-07-11; assay: N/n-of-number-type-coercion, N/n-of-string, N/n-of-error-type-coercion).

| Engine | Behavior |
| --- | --- |
| Google Sheets | Number → itself, text → `0`, error propagates. |
| Excel | Same. |
| HyperFormula | Same (live probe, 2026-07-11). |
| IronCalc | Same (live probe, 2026-07-11). |
| formulas | Same (live probe, 2026-07-11). |
| pycel | Same — `N` is implemented, unlike its sibling `T` (live probe, 2026-07-11). |
| Lattice | Same. |

> [!INFO]
> There is one pycel caveat that touches `N` indirectly: pycel cannot evaluate bare error-raising operator sub-expressions such as `1/0`, so `=N(1/0)` returns `#NAME?` there rather than propagating `#DIV/0!`. Errors produced by *functions* (for example `NA()`) propagate correctly.

### See Also

[[TO_DATE]]: Converts a provided number to a date.

[[T]]: Returns string arguments as text.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdDllV181M21lcFdlNFFNQkV5NnRGakE&amp;output=html" width="500"></iframe>