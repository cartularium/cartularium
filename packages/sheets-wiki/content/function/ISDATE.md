---
name: ISDATE
category: info
syntax: ISDATE(value)
status: imported
description: The ISDATE function returns whether a value is a date.
tags: [modified, undocumented]
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9061381?hl=en).

The ISDATE function returns whether a value is a date.

### Syntax
```gse
ISDATE(value)
```

| Part | Description |
| --- | --- |
| `value` | The value to be verified as a date. |

### Sample formulas

`ISDATE("7/20/1969")  
ISDATE(“July 20”)  
ISDATE(A1)`

### Notes

Ensure your date has quotation marks around it, unless it’s a reference to a cell.

### Engine compatibility

`ISDATE` is a Google Sheets-native function with no Excel equivalent, and it is not portable. Only two engines in the corpus implement it — and they disagree.

| Engine | Behavior |
| --- | --- |
| Google Sheets | `=ISDATE("2024-01-15")` returns `TRUE` — it parses the date-shaped string as a date. |
| Lattice | `FALSE` — implements `ISDATE` (it carries it for Google Sheets compatibility) but does not coerce a raw text argument to a date, so a string is "not a date" (assay: ISDATE/isdate-of-date-string). |
| Excel | `#NAME?` — no `ISDATE` function. |
| HyperFormula | `#NAME?` — not implemented, independent of argument type (live probe, 2026-07-11). |
| IronCalc | `#NAME?` — not implemented (live probe, 2026-07-11). |
| formulas | `#NAME?` — not implemented (live probe, 2026-07-11). |
| pycel | `#NAME?` — not implemented (live probe, 2026-07-11). |

> [!INFO]
> For a portable "is this a date?" test, use a coercion-based check such as `=ISNUMBER(DATEVALUE(x))` instead of `ISDATE`.

### Examples

| A | B |
| --- | --- |
| **1** | **Formula** | **Result** |
| **2** | `=ISDATE(“July 20 1969”)` | TRUE |
| **3** | `=ISDATE(“1969-20-07”)` | TRUE |
| **4** | `=ISDATE(“July”)` | FALSE |
| **5** | `=ISDATE(“Feb 30”)` | FALSE |