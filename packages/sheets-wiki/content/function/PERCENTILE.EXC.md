---
name: PERCENTILE.EXC
category: statistical
syntax: PERCENTILE.EXC(data, percentile)
status: imported
description: The PERCENTILE.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9368167?hl=en).

The PERCENTILE.EXC function returns the value at a given percentile of a dataset, exclusive of 0 and 1.

### Syntax
```gse
PERCENTILE.EXC(data, percentile)
```

| Part | Description |
| --- | --- |
| `data` | The array or range containing the dataset to consider. |
| `percentile` | The percentile whose value within data will be calculated and returned. |

### Sample formulas

```gse
PERCENTILE.EXC(A2:A100,0.33)
PERCENTILE.EXC(A2:A100,A2)
```

### Notes

- The value returned by `PERCENTILE.EXC` is not necessarily a member of data as this function interpolates between values to calculate the alpha percentile.
- The percentile must be between 0 and 1, exclusive.
- Different from `PERCENTILE.INC`, `PERCENTILE.EXC` calculates percentile based on a percentile range exclusive of 0 and 1.

### Examples

| A | B |
| --- | --- |
| **1** | **data** | **percentile** |
| **2** | 15 | 0.15 |
| **3** | 20 | 0.4 |
| **4** | 35 | 0.5 |
| **5** | 40 | 0.8 |
| **6** | 50 | 0.9 |

| A | B | C | D |
| --- | --- | --- | --- |
| **1** | **Percentile** | **Result** | **Formula** | **Explanation** |
| **2** | 0.15 | `#NUM!` | `=PERCENTILE.EXC(A2:A6, B2)` | Returns `#NUM!` error because it can't interpolate. |
| **3** | 0.4 | 26 | `=PERCENTILE.EXC(A2:A6, B3)` | Executes as intended. |
| **4** | 0.5 | 35 | `=PERCENTILE.EXC(A2:A6, B4)` | Executes as intended. |
| **5** | 0.8 | 48 | `=PERCENTILE.EXC(A2:A6, B5)` | Executes as intended. |
| **6** | 0.9 | `#NUM!` | `=PERCENTILE.EXC(A2:A6, B6)` | Returns `#NUM!` error because it can't interpolate. |

### Related functions

- [[PERCENTILE]]: Returns the value at a given percentile of a dataset.
- [[QUARTILE]]: Returns a value nearest to a specified quartile of a dataset.
- [[MEDIAN]]: Returns the median value in a numeric dataset.
- [[QUARTILE.EXC]]: The QUARTILE.EXC function returns value nearest to a given quartile of a dataset, exclusive of 0 and 4.