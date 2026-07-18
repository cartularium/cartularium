---
name: TOCOL
category: array
syntax: TOCOL(array_or_range, [ignore], [scan_by_column])
status: imported
description: This function transforms an array or range of cells into a single column.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/13187258?hl=en).

This function transforms an array or range of cells into a single column. TOCOL can scan values:

- By column, top to bottom
- By row, left to right

The `scan_by_column` argument is a boolean value that controls how TOCOL reads values from the source array.

### Sample Usage

`TOCOL(A1:C3)`: A `TOCOL` function that keeps all values and scans by row.

`TOCOL(A1:C3, 1, TRUE)`: A `TOCOL` function that ignores blanks and scans by column.

### Syntax

```gse
TOCOL(array_or_range, [ignore], [scan_by_column])
```

- `array_or_range`: The array or range of cells to return as a column.
- `[ignore]`: By default, no values are ignored. Specify one of these values:
  + **0:** Keep all values
  + **1:** Ignore blanks
  + **2:** Ignore errors
  + **3:** Ignore blanks and errors
- `[scan_by_column]`: The boolean value of `scan_by_column` determines how the array is scanned. By default, the `TOCOL` function scans the array by row.
  + **True:** Scans the array by column
  + **False:** Scans the array by row

### Examples

### Use simple data transformation operation with TOCOL

**Example data:**

|  | **A** | **B** | **C** |
| --- | --- | --- | --- |
| **1** | Ben | Peter | Mary |
| **2** | John | Hillary | Jenny |
| **3** | Agnes | Harry | Felicity |

**Example:** Input this formula in `E1: =TOCOL(A1:C3)`

**Result:**

|  | **E** |
| --- | --- |
| **1** | Ben |
| **2** | Peter |
| **3** | Mary |
| **4** | John |
| **5** | Hillary |
| **6** | Jenny |
| **7** | Agnes |
| **8** | Harry |
| **9** | Felicity |

[Make a Copy](https://docs.google.com/spreadsheets/d/1yAEE7SWpVHfhhO5Z0mv5p843DPBvu_ge0WTYOIdnINI/copy)

### Ignore blanks with TOCOL

**Example data:**

|  | **A** | **B** | **C** |
| --- | --- | --- | --- |
| **1** | Ben | Peter | Mary |
| **2** | John |  | Jenny |
| **3** | Agnes | Harry | Felicity |

**Example:**Input this formula in `E1: =TOCOL(A1:C3, 1)`

**Result:**

|  | **E** |
| --- | --- |
| **1** | Ben |
| **2** | Peter |
| **3** | Mary |
| **4** | John |
| 5 | Jenny |
| 6 | Agnes |
| 7 | Harry |
| 8 | Felicity |

[Make a Copy](https://docs.google.com/spreadsheets/d/1yAEE7SWpVHfhhO5Z0mv5p843DPBvu_ge0WTYOIdnINI/copy#gid=1309790498)

### Scan by column with TOCOL

**Example data:**

|  | **A** | **B** | **C** |
| --- | --- | --- | --- |
| **1** | Ben | Peter | Mary |
| **2** | John | Hillary | Jenny |
| **3** | Agnes | Harry | Felicity |

**Example:** Input this formula in `E1: =TOCOL(A1:C3, 0, TRUE)`

**Result:**

|  | **E** |
| --- | --- |
| **1** | Ben |
| **2** | John |
| **3** | Agnes |
| **4** | Peter |
| **5** | Hillary |
| **6** | Harry |
| **7** | Mary |
| **8** | Jenny |
| **9** | Felicity |

[Make a Copy](https://docs.google.com/spreadsheets/d/1yAEE7SWpVHfhhO5Z0mv5p843DPBvu_ge0WTYOIdnINI/copy#gid=2044216832)

### Related functions

- [[TOROW]]: This function transforms an array or range of cells into a single row.