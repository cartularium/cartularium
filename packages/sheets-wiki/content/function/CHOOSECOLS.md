---
name: CHOOSECOLS
category: array
syntax: CHOOSECOLS(array, col_num1, [col_num2])
status: imported
description: This function creates a new array from the selected columns in the existing range.
tags: [modified, undocumented]
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/13197914?hl=en).

This function creates a new array from the selected columns in the existing range.

### Sample Usage

```gse
CHOOSECOLS(A1:E5, 1, 3, 1)
CHOOSECOLS(A1:E5, -1, -2, -3)
```

### Syntax

```gse
CHOOSECOLS(array, col_num1, [col_num2])
```

- `array`: The array that contains the columns to be returned.
- `col_num1`: The column number of the first column to be returned.
- `col_num2…`: **[** OPTIONAL **]** The column number(s) of additional column(s) to be returned.

### Examples

### Simple data extraction operation with CHOOSECOLS

**Example data:**

| 1 | Student | Math | History | Science | Gym |
| --- | --- | --- | --- | --- | --- |
| **2** | Harry | 95 | 70 | 82 | 78 |
| **3** | Jenny | 85 | 91 | 100 | 80 |
| **4** | Lily | 76 | 88 | 80 | 95 |
| **5** | Sunny | 60 | 77 | 89 | 80 |

**Example:** Input this formula in G1: `=CHOOSECOLS(A1:E5, 1, 3, 2)`

**Result:**

|  | **G** | **H** | **I** |
| --- | --- | --- | --- |
| **1** | Student | History | Math |
| **2** | Harry | 70 | 95 |
| **3** | Jenny | 91 | 85 |
| **4** | Lily | 88 | 76 |
| **5** | Sunny | 77 | 60 |

[Make a Copy](https://docs.google.com/spreadsheets/d/1rBlIiOQJDThG1KvNix1xC5OuJWO-O3lbQp7FRXgauSw/copy)

### Simple data extraction with CHOOSECOLS selecting columns from the right side

**Example data:**

| 1 | Student | Math | History | Science | Gym |
| --- | --- | --- | --- | --- | --- |
| **2** | Harry | 95 | 70 | 82 | 78 |
| **3** | Jenny | 85 | 91 | 100 | 80 |
| **4** | Lily | 76 | 88 | 80 | 95 |
| **5** | Sunny | 60 | 77 | 89 | 80 |

**Example:** Input this formula in G1: `=CHOOSECOLS(A1:E5, 1, -1, -2)`

**Result:**

|  | **G** | **H** | **I** |
| --- | --- | --- | --- |
| **1** | Student | Gym | Science |
| **2** | Harry | 78 | 82 |
| **3** | Jenny | 80 | 100 |
| **4** | Lily | 95 | 80 |
| **5** | Sunny | 80 | 89 |

[Make a Copy](https://docs.google.com/spreadsheets/d/1rBlIiOQJDThG1KvNix1xC5OuJWO-O3lbQp7FRXgauSw/copy#gid=907400634)

### Engine compatibility

`CHOOSECOLS` is a modern dynamic-array function (Excel added it in 2022). Support is purely a presence/absence split — where implemented, engines agree on the result. `=CHOOSECOLS({1,2,3;4,5,6}, 1, 3)` gives `[[1,3],[4,6]]`:

| Engine | Behavior |
| --- | --- |
| Google Sheets | Implemented; `[[1,3],[4,6]]`. |
| Excel | Implemented; `[[1,3],[4,6]]`. |
| Lattice | Implemented; `[[1,3],[4,6]]`. |
| formulas | Implemented; `[[1,3],[4,6]]` (live probe, 2026-07-11). |
| HyperFormula | `#NAME?` — not implemented (live probe, 2026-07-11). |
| IronCalc | `#NAME?` — not implemented (live probe, 2026-07-11). |
| pycel | `#NAME?` — not implemented (live probe, 2026-07-11). |

> [!INFO]
> Not portable to HyperFormula, IronCalc, or pycel. For broad engine coverage, an `INDEX`-based column pick is the fallback. The same availability split applies to [[CHOOSEROWS]].

### Related functions

- [[CHOOSEROWS]]