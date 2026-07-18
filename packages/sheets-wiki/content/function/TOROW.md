---
name: TOROW
category: array
syntax: TOROW(array_or_range, [ignore], [scan_by_column])
status: imported
description: This function transforms an array or range of cells into a single row.
tags: [modified, undocumented]
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/13187459?hl=en).

This function transforms an array or range of cells into a single row. TOROW can scan values:

- By column, top to bottom
- By row, left to right

The `scan_by_column` argument is a boolean value that controls how TOROW reads values from the source array.

### Sample Usage

`TOROW(A1:C3)`: A `TOROW` function that keeps all values and scans by row.

`TOROW(A1:C3, 1, TRUE)`: A `TOROW` function that ignores blanks and scans by column.

### Syntax

```gse
TOROW(array_or_range, [ignore], [scan_by_column])
```

- `array_or_range`: The array or range of cells to return as a row.
- `[ignore]`: By default, no values are ignored. Specify one of these values:
  + **0:** Keep all values
  + **1:** Ignore blanks
  + **2:** Ignore errors
  + **3:** Ignore blanks and errors
- `[scan_by_column]`: The boolean value of `scan_by_column` determines how the array is scanned. By default, the `TOROW` function scans the array by row.
  + **True:** scans the array by column
  + **False:** scans the array by row

### Examples

### Use simple data transformation operation with TOROW

**Example data:**

|  | **A** | **B** | **C** |
| --- | --- | --- | --- |
| **1** | Ben | Peter | Mary |
| **2** | John | Hillary | Jenny |
| **3** | Agnes | Harry | Felicity |

**Example:** Input this formula in `E1: =TOROW(A1:C3)`

**Result:**

|  | **E** | **F** | **G** | **H** | **I** | **J** | **K** | **L** | **M** |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **1** | Ben | Peter | Mary | John | Hillary | Jenny | Agnes | Harry | Felicity |

[Make a Copy](https://docs.google.com/spreadsheets/d/1km45-ev3eD7ZS_J3PeSA7PLykpV71_98CqXq58vnXt8/copy)

### Ignore blanks with TOROW

**Example data:**

|  | **A** | **B** | **C** |
| --- | --- | --- | --- |
| **1** | Ben | Peter | Mary |
| **2** | John |  | Jenny |
| **3** | Agnes | Harry | Felicity |

**Example:** Input this formula in `E1: =TOROW(A1:C3, 1)`

**Result:**

|  | **E** | **F** | **G** | **H** | **I** | **J** | **K** | **L** |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **1** | Ben | Peter | Mary | John | Jenny | Agnes | Harry | Felicity |

[Make a Copy](https://docs.google.com/spreadsheets/d/1km45-ev3eD7ZS_J3PeSA7PLykpV71_98CqXq58vnXt8/copy#gid=1425143757)

### Scan by column with TOROW

**Example data:**

|  | **A** | **B** | **C** |
| --- | --- | --- | --- |
| **1** | Ben | Peter | Mary |
| **2** | John | Hillary | Jenny |
| **3** | Agnes | Harry | Felicity |

**Example:** Input this formula in `E1: =TOROW(A1:C3, 0, TRUE)`

**Result:**

|  | **E** | **F** | **G** | **H** | **I** | **J** | **K** | **L** | **M** |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **1** | Ben | John | Agnes | Peter | Hillary | Harry | Mary | Jenny | Felicity |

[Make a Copy](https://docs.google.com/spreadsheets/d/1km45-ev3eD7ZS_J3PeSA7PLykpV71_98CqXq58vnXt8/copy#gid=312714135)

### Engine compatibility

`TOROW` is a modern dynamic-array reshape function; support is a presence/absence split, and where implemented the flattened result and its order agree.

| Engine | Behavior |
| --- | --- |
| Google Sheets | Implemented; default scan is by row, `scan_by_column` = `TRUE` switches to column-major. |
| Excel | Implemented; same scan semantics. |
| Lattice | Implemented; agrees on shape and order. |
| formulas | Implemented; `=TOROW({1,2;3,4})` is `{1,2,3,4}` (row-major) (live probe, 2026-07-11). |
| HyperFormula | `#NAME?` — not implemented (live probe, 2026-07-11). |
| IronCalc | `#NAME?` — not implemented (live probe, 2026-07-11). |
| pycel | `#NAME?` — not implemented (live probe, 2026-07-11). |

> [!INFO]
> Not portable to HyperFormula, IronCalc, or pycel. The default scan order is row-major; pass the third argument `TRUE` for column-major. The same availability split applies to [[TOCOL]].

### Related functions

- [[TOCOL]]: This function transforms an array or range of cells into a single column.