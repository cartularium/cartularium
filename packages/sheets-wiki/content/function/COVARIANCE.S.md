---
name: COVARIANCE.S
category: statistical
syntax: COVARIANCE.S(data_y, data_x)
status: imported
description: The COVARIANCE.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9365675?hl=en).

The COVARIANCE.S function calculates the covariance of a dataset, where the dataset is a sample of the total population.

### Syntax
```gse
COVARIANCE.S(data_y, data_x)
```

| Part | Description |
| --- | --- |
| `data_y` | The range representing the array or matrix of dependent data. |
| `data_x` | The range representing the array or matrix of independent data. |

### Sample formulas

```gse
COVARIANCE.S(A1:A10)
COVARIANCE.S(1, 2, 3, 4)
COVARIANCE.S(B1:B5, 10)
```

### Notes

- Any text encountered in the `value` arguments will be ignored.
- Positive covariance indicates that the independent data and dependent data tend to change together in the same direction.
- Negative covariance indicates that they tend to change together in the opposite direction. An increase in one leads to a decrease in the other. The magnitude of covariance is difficult to interpret.

### Examples

| A | B |
| --- | --- |
| **1** | **data\_1** | **data\_2** |
| **2** | 2 | 4 |
| **3** | 5 | 3 |
| **4** | 7 | 6 |
| **5** | 1 | 1 |
| **6** | 8 | 5 |
| **7** |  |  |
| **8** |  |  |
| **9** | **Covariance** | **Formula** |
| **10** | 4.65 | `=COVARIANCE.S(A2:A6, B2:B6)` |
| **11** | 7 | `=COVARIANCE.S({1,3}, {-1,6})` |

### Related functions

- [[COVAR]]: Calculates the covariance of a dataset.