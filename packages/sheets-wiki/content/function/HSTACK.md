---
name: HSTACK
category: array
syntax: HSTACK(range1; [range2, …])
status: imported
description: This function appends arrays horizontally and in sequence to return a larger array.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/13190756?hl=en).

This function appends arrays horizontally and in sequence to return a larger array.

### Sample Usage

```gse
HSTACK(A1:E2; A3:E4)
```

### Syntax

```gse
HSTACK(range1; [range2, …])
```

- `range1`: The first range to append.
- `range2, …`: **[** OPTIONAL **]** Additional ranges to add to range1.

### Examples

### Simple append operation with HSTACK

**Example data:**

| 1 | Year: 2021 | Q1 | Q2 | Q3 | Q4 |
| --- | --- | --- | --- | --- | --- |
| **2** | Winner | Andrew | Luca | Robert | Eric |
| **3** | **Year: 2022** | **Q1** | **Q2** | **Q3** | **Q4** |
| **4** | Winner | Lola | Andy | Mary | Kate |

**Example:** Input this formula in `A6: =HSTACK(A1:E2; A3:E4)`

**Result:**

|  | A | **B** | **C** | **D** | **E** | **F** | **G** | **H** | **I** | **J** |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **6** | Year: 2021 | Q1 | Q2 | Q3 | Q4 | Year: 2022 | Q1 | Q2 | Q3 | Q4 |
| **7** | Winner | Andrew | Luca | Robert | Eric | Winner | Lola | Andy | Mary | Kate |

[Make a Copy](https://docs.google.com/spreadsheets/d/1vSVR0L7_QAPj_tAwpmDAeWpkEckudt_DYGZ9TUSzAHA/copy)

### Related functions

- [[VSTACK]]