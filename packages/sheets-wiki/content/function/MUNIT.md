---
name: MUNIT
category: math
syntax: MUNIT(dimension)
status: imported
description: The MUNIT function returns a unit matrix of size dimension x dimension.
tags:
  - modified
  - undocumented
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9368156?hl=en).

The MUNIT function returns a unit matrix of size dimension x dimension. The result of this function is an array of form:

1 0 …  0

0 1 ... 0

0 0 … ...

0 0 … 1

### Syntax
```gse
MUNIT(dimension)
```

| Part | Description |
| --- | --- |
| `dimension` | Required. The size of the unit matrix. Dimension must be an integer greater than zero. |

### Sample formulas

```gse
Example 1:  MUNIT(1)
Example 2: MUNIT(3)
```

### Notes

If dimension is less than 1, `MUNIT` returns a #VALUE error.

### Examples

Result for A1=`MUNIT(1)`

| A |
| --- |
| **1** | 1 |
| **2** |  |

Result for A1= `MUNIT(3)`

| A | B | C |
| --- | --- | --- |
| **1** | 1 | 0 | 0 |
| **2** | 0 | 1 | 0 |
| **3** | 0 | 0 | 1 |

### Engine compatibility

MUNIT is implemented by Excel, Google Sheets, `formulas`, and Lattice, but **not by HyperFormula, IronCalc, or pycel** (`#NAME?`). Where it exists, the **error code for an invalid size argument is not portable**: `MUNIT(0)` returns `#VALUE!` in Excel, `formulas`, and Lattice (rejecting the argument as the wrong type/shape) but `#NUM!` in Google Sheets (rejecting it as a number out of range). Do not branch on the specific error code across engines (assay: MUNIT/munit-zero-error; live probe, 2026-07-11).

| Engine | Behavior |
| --- | --- |
| Google Sheets | Supported; `MUNIT(0)` → `#NUM!`. |
| Excel | Supported; `MUNIT(0)` → `#VALUE!`. |
| HyperFormula | Not implemented; returns `#NAME?` (live probe, 2026-07-11). |
| IronCalc | Not implemented; returns `#NAME?` (live probe, 2026-07-11). |
| formulas | Supported; `MUNIT(0)` → `#VALUE!` (live probe, 2026-07-11). |
| pycel | Not implemented; returns `#NAME?` (live probe, 2026-07-11). |
| Lattice | Supported; `MUNIT(0)` → `#VALUE!`. |

### Related functions

- [[MMULT]]: Calculates the matrix product of two matrices specified as arrays or ranges.
- [[RANDARRAY]]: The RANDARRAY function generates an array of random numbers between 0 and 1.