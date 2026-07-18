---
name: WRAPROWS
category: array
syntax: WRAPROWS(range, wrap_count, [pad_with])
status: imported
description: This function wraps the provided row or column of cells by rows after a specified number of elements to form a new array.
tags: [modified, undocumented]
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/13184285?hl=en).

This function wraps the provided row or column of cells by rows after a specified number of elements to form a new array.

### Sample Usage

`WRAPROWS(A1:E1, 2)`: A `WRAPROWS` function that wraps the range with 2 values per row.

`WRAPROWS(A1:E1, 2, “No value”)`: A `WRAPROWS` function that wraps the range with 2 values per row and fills the extra cells with “No value.”

### Syntax

```gse
WRAPROWS(range, wrap_count, [pad_with])
```

- `range`: The range to wrap.
- `wrap_count`: The maximum number of cells for each row. If the value isn’t a whole number, it’s rounded down to the nearest whole number.
- `[pad_with]`: The value with which to fill the extra cells in the range. By default, the WRAPROWS function fills the extra cells with `#N/A`.

### Examples

### Wrap simple data with WRAPROWS

**Example data:**

|  | A | B | C | D | E |
| --- | --- | --- | --- | --- | --- |
| **1** | A | B | C | D | E |

**Example:** Input this formula in `G1: =WRAPROWS(A1:E1, 2)`

**Result:**

|  | **G** | **H** |
| --- | --- | --- |
| **1** | A | B |
| **2** | C | D |
| 3 | E | `#N/A` |

[Make a Copy](https://docs.google.com/spreadsheets/d/1QLNyrIjx9OVJyX9--r2WplrcIxtOCp1ia5EYYIb4GTE/copy)

### Wrap data with “No value” as pad with WRAPROWS

**Example data:**

|  | A | B | C | D | E |
| --- | --- | --- | --- | --- | --- |
| **1** | A | B | C | D | E |

**Example:** Input this formula in `G1: =WRAPROWS(A1:E1, 2, "No value")`

**Result:**

|  | **G** | **H** |
| --- | --- | --- |
| **1** | A | B |
| **2** | C | D |
| 3 | E | No value |

[Make a Copy](https://docs.google.com/spreadsheets/d/1QLNyrIjx9OVJyX9--r2WplrcIxtOCp1ia5EYYIb4GTE/copy#gid=907400634)

### Related functions

- [[WRAPCOLS]]: This function wraps the provided row or column of cells by columns after a specified number of elements to form a new array.