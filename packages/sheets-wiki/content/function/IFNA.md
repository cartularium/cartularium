---
name: IFNA
category: logical
syntax: IFNA(value, value_if_na)
status: imported
description: The IFNA function evaluates a value.
tags: [modified, undocumented]
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9365944?hl=en).

The IFNA function evaluates a value. If the value is an `#N/A` error, return the specified value.

### Syntax
```gse
IFNA(value, value_if_na)
```

| Part | Description |
| --- | --- |
| `value` | Required. The value to check if it is a `#N/A` error. |
| `value_if_na` | Required. The value to return if the first argument is an `#N/A` error. |

### Sample formulas

```gse
IFNA(205, “Na error”)
IFNA(#N/A, “Na error”)
```

### Notes

- If value or value\_if\_na is an empty cell, IFNA treats the cell’s value as an empty string (“”).
- If value is a range reference, IFNA returns an array formula result with one entry for in-the-range reference.

### Examples

| A | B |
| --- | --- |
| **1** | **Formula** | **Result** |
| **2** | =`IFNA(205, "Na error")` | 205 |

| A | B |
| --- | --- |
| **1** | **Formula** | **Result** |
| **2** | =`IFNA(#N/A, “Na error”)` | Na error |

| A | B |
| --- | --- |
| 1 | **Formula** | **Result** |
| 2 | =`IFNA(A3:A5, “Has na error”)` |  |
| 3 | `#N/A` | Has na error |
| 4 | 100/0 | `#ERROR` |
| 5 | 45 | 45 |

### Engine compatibility

`IFNA` is `#N/A`-selective: it catches only `#N/A` and passes every other error through. That scalar behavior is uniform across Excel, Google Sheets, HyperFormula, IronCalc, formulas, and Lattice — `=IFNA(#N/A, "caught")` is `"caught"`, while `=IFNA(1/0, "caught")` passes `#DIV/0!` through unchanged (assay: IFNA/ifna-catches-n-a-only, IFNA/ifna-does-not-catch-div-0).

| Engine | Behavior |
| --- | --- |
| Google Sheets | Portable; catches `#N/A` only. |
| Excel | Portable; catches `#N/A` only. |
| HyperFormula | Portable (live probe, 2026-07-11). |
| IronCalc | Portable for the scalar form (live probe, 2026-07-11). |
| formulas | Portable (live probe, 2026-07-11). |
| Lattice | Portable. |
| pycel | Scalar `IFNA` works on current builds, but — like [[IFERROR]] — a `/` or other operator inside an argument returns `#NAME?` for a front-end reason, not a missing function (live probe, 2026-07-11). |

> [!INFO]
> `IFNA` is the right tool when you want to catch a lookup miss (`#N/A`) but let genuine errors like `#DIV/0!` surface — its selectivity is portable. For catching *any* error, use [[IFERROR]], whose array-argument behavior differs across engines.

### Related functions

- [[IFERROR]]: Returns the first argument if it is not an error value, otherwise returns the second argument if present, or a blank if the second argument is absent.