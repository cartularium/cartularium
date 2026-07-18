---
name: AND
category: logical
syntax: AND(logical_expression1, [logical_expression2, ...])
status: imported
description: The AND function returns true if all of the provided arguments are logically true, and false if any of the provided arguments are logically false.
tags: [modified, undocumented]
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093301?hl=en).

The AND function returns true if all of the provided arguments are logically true, and false if any of the provided arguments are logically false.

### Sample Usage

```gse
AND(A2 = "foo", A3 = "bar")
AND(TRUE,FALSE,TRUE)
AND(A1:A10,B1:B10)
AND(0,1,2,3)
```

### Syntax

```gse
AND(logical_expression1, [logical_expression2, ...])
```

- `logical_expression1` - An expression or reference to a cell containing an expression that represents some logical value, i.e. `TRUE` or `FALSE`, or an expression that can be coerced to a logical value.
- `logical_expression2, ...` - **[** OPTIONAL **]** - Additional expressions or references to cells containing expressions representing some logical values, i.e. `TRUE` or `FALSE`, or expressions that can be coerced to logical values.

### Notes

- The number 0 is logically false; all other numbers (including negative numbers) are logically true.

### Engine compatibility

`AND` with ordinary arguments is portable — `=AND(1,1,0)` is `FALSE` everywhere. The edge is a **zero-argument** call, `=AND()`, whose arity failure each engine resolves differently:

| Engine | Behavior |
| --- | --- |
| Google Sheets | `#N/A`. |
| Excel | Rejected at formula entry (too few arguments), leaving an empty cell — not a value, not an error (assay: lambda-logical-coercion, AND/and-empty). |
| HyperFormula | `#N/A` (live probe, 2026-07-11). |
| IronCalc | `#ERROR!` (live probe, 2026-07-11). |
| formulas | `#VALUE!` (live probe, 2026-07-11). |
| pycel | `#VALUE!` (live probe, 2026-07-11). |
| Lattice | `TRUE` — the vacuous-truth identity (`AND` over an empty set is true). |

> [!INFO]
> Always pass `AND` at least one argument; the empty call is not portable. Separately, HyperFormula does not accept the bare keywords `TRUE`/`FALSE` as arguments — `=AND(TRUE, TRUE)` returns `#NAME?` there; write `=AND(TRUE(), TRUE())` or use a comparison. This affects `OR`, `NOT`, `IF`, and any formula with a literal boolean.

### See Also

[[OR]]: The OR function returns true if any of the provided arguments are logically true, and false if all of the provided arguments are logically false.

[[NOT]]: Returns the opposite of a logical value - `NOT(TRUE)` returns `FALSE`; `NOT(FALSE)` returns `TRUE`.

### Examples

Returns `TRUE` if all arguments are `TRUE`, returns `FALSE` if any element is `FALSE`, accepts both `logical_value` and range parameter.

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdC1rNUYxeDYxQjhqX2xFWEI4X3JkcVE&amp;single=true&amp;gid=0&amp;output=html&amp;widget=true" width="500"></iframe>