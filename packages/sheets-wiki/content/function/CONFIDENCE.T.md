---
name: CONFIDENCE.T
category: statistical
syntax: CONFIDENCE.T(alpha, standard_deviation, size)
status: imported
description: The CONFIDENCE.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9365672?hl=en).

The CONFIDENCE.T function calculates the width of half the confidence interval for a student's t-distribution.

### Syntax
```gse
CONFIDENCE.T(alpha, standard_deviation, size)
```

| Part | Description |
| --- | --- |
| `alpha` | One minus the desired confidence level. E.g. `0.1`for `0.9`, or 90%, confidence. |
| `standard_deviation` | The standard deviation of the population. |
| `size` | The size of the population. |

### Note

`CONFIDENCE.T` calculates the width of half the confidence interval such that a value picked at random from the data set has `1-alpha` probability of lying within the mean plus or minus the result of `CONFIDENCE.T`.

### Examples

| A | B | C | D | E | F |
| --- | --- | --- | --- | --- | --- |
| **1** | **Alpha** | **STDEV** | **size** | **Result** | **Formula** | **Confidence Interval (Supposed Mean=40)** |
| **2** | 0.05 | 6.43 | 27 | 2.56340262541175 | `=CONFIDENCE.T(A2,B2,C2)` | [40-2.563, 40+2.563] |

### Related functions

- [[CONFIDENCE.NORM]]: Calculates the width of half the confidence interval for a normal distribution.