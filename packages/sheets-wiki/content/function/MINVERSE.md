---
name: MINVERSE
category: array
syntax: MINVERSE(square_matrix)
status: imported
description: Returns the multiplicative inverse of a square matrix specified as an array or range.
tags:
  - modified
  - undocumented
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094253?hl=en).

Returns the multiplicative inverse of a square matrix specified as an array or range.

### Sample Usage

```gse
MINVERSE(A1:D4)
MINVERSE({1,0,0,0;0,0,4,0;0,1,1,0;0,0,0,1})
```

### Syntax

```gse
MINVERSE(square_matrix)
```

- `square_matrix` - An array or range with an equal number of rows and columns representing a matrix whose multiplicative inverse will be calculated.

### Engine compatibility

MINVERSE is implemented by Excel, Google Sheets, Lattice, and `formulas`, but **not by HyperFormula, IronCalc, or pycel** (`#NAME?`). For a **singular** matrix (no inverse), the implementers correctly refuse with `#NUM!` — for example `MINVERSE({1,2;2,4})`, whose second row is twice the first. This is worth distinguishing from an absence error: a `#NUM!` means the engine has MINVERSE and rejected an un-invertible matrix, while a `#NAME?` means the engine lacks the function and never examined the matrix at all (assay: MINVERSE/minverse-singular-error; live probe, 2026-07-11).

| Engine | Behavior |
| --- | --- |
| Google Sheets | Supported; singular matrix → `#NUM!`. |
| Excel | Supported; singular matrix → `#NUM!`. |
| HyperFormula | Not implemented; returns `#NAME?` (live probe, 2026-07-11). |
| IronCalc | Not implemented; returns `#NAME?` (live probe, 2026-07-11). |
| formulas | Supported; singular matrix → `#NUM!` (live probe, 2026-07-11). |
| pycel | Not implemented; returns `#NAME?` (live probe, 2026-07-11). |
| Lattice | Supported; singular matrix → `#NUM!`. |

### See Also

[[TRANSPOSE]]: Transposes the rows and columns of an array or range of cells.

[[MMULT]]: Calculates the matrix product of two matrices specified as arrays or ranges.

[[MDETERM]]: Returns the matrix determinant of a square matrix specified as an array or range.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdHhaQWRsVW5fWW9RbTZGTVk3ZFFnNkE&amp;output=html" width="500"></iframe>