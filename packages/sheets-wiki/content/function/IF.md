---
name: IF
category: logical
syntax: IF(logical_expression, value_if_true, value_if_false)
status: imported
description: Returns one value if a logical expression is `TRUE` and another if it is `FALSE`.
tags: [modified, undocumented]
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093364?hl=en).

Returns one value if a logical expression is `TRUE` and another if it is `FALSE`.

### Sample Usage

```gse
IF(A2 = "foo","A2 is foo")
IF(A2,"A2 was true","A2 was false")
IF(TRUE,4,5)
```

### Syntax

```gse
IF(logical_expression, value_if_true, value_if_false)
```

- `logical_expression` - An expression or reference to a cell containing an expression that represents some logical value, i.e. `TRUE` or `FALSE`.
- `value_if_true` - The value the function returns if `logical_expression` is `TRUE`.
- `value_if_false` - **[** OPTIONAL - blank by default **]** - The value the function returns if `logical_expression` is `FALSE`.

### Notes

- Ensure that `value_if_true` and `value_if_false` are provided to the function in the correct order - this is the single most common source of problems with `IF`.

### Engine compatibility

`IF` selects the right branch consistently across engines. Two things diverge: what happens when the false-branch is omitted, and how HyperFormula treats bare boolean literals. Testing `=IF(2>3, TRUE)` (false-branch omitted, condition false):

| Engine | Behavior |
| --- | --- |
| Google Sheets | `FALSE` — the documented default when `value_if_false` is omitted. |
| Excel | `FALSE`. |
| HyperFormula | `FALSE` (with a computed condition). |
| IronCalc | `FALSE`. |
| formulas | `FALSE`. |
| Lattice | A blank cell, not `FALSE` — if you want `FALSE`, write `IF(cond, x, FALSE)` explicitly (assay: IF/if-two-args-false). |
| pycel | Evaluates `IF` correctly with literal arguments, but returns `#NAME?` whenever an argument is an operator expression like `2>3` — a front-end limitation, not a missing function (live probe, 2026-07-11). |

> [!INFO]
> HyperFormula does not accept the bare keywords `TRUE`/`FALSE`: even `=IF(TRUE, 5, 6)` returns `#NAME?` there, while `=IF(TRUE(), 5, 6)` and `=IF(1>0, 5, 6)` work. Use `TRUE()`/`FALSE()` or a comparison. Array broadcasting — `=IF({TRUE,FALSE,TRUE}, 1, 2)` → `{1,2,1}` — is portable across Excel, Google Sheets, Lattice, formulas, and HyperFormula (once the condition is a comparison rather than a bare literal), but IronCalc returns `#N/IMPL!` and pycel silently collapses an array-branch `IF` to a single scalar — a correctness hazard.

### See Also

- [[IFERROR]]: Returns the first argument if it is not an error value, otherwise returns the second argument if present, or a blank if the second argument is absent.
- [[IFS]]: Evaluates multiple conditions and returns a value that corresponds to the first true condition.

### Examples

Specifies a logical test to be performed.

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdFZwQkZxM3U4VTFzdXpWME5jQmQ0SHc&amp;single=true&amp;gid=0&amp;output=html&amp;widget=true" width="500"></iframe>

[Make a copy](https://docs.google.com/spreadsheets/d/1ct3jW2PPGdUErLQWFFZ3Pk1X521M_z6Rm8qeMonR_iE/copy)