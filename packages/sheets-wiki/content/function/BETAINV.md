---
name: BETAINV
category: statistical
syntax: BETA.INV(probability, alpha, beta, lower_bound, upper_bound)
status: imported
description: The BETA.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9061377?hl=en).

The BETA.INV function returns the value of the inverse beta distribution function for a given probability.

### Syntax
```gse
BETA.INV(probability, alpha, beta, lower_bound, upper_bound)
```

| Part | Description | Notes |
| --- | --- | --- |
| `probability` | The probability at which to evaluate the function. | Must be between 0 and 1, inclusive. |
| `alpha` | The first shape parameter of the distribution. | Must be positive. |
| `beta` | The second shape parameter of the distribution. | Must be positive. |
| `lower_bound` | Lower bound of the original beta distribution’s domain. | Default value is 1. |
| `upper-bound` | Upper bound of the original beta distributions’s domain. | Default value is 1. |

### Sample formulas

`BETA.INV(0.65,1.234,7,1,3)  
BETA.INV(0.3,5,1)  
BETA.INV(A4,3,2,-1,1)`

### Example

If you want to know the value of inverse cumulative beta function at probability 0.13, parameterize it by alpha = 5, beta = 1, and domain [-1, 1].

| A | B | C | D | E | F | G |
| --- | --- | --- | --- | --- | --- | --- |
| **1** | **Formula** | **Probability** | **Alpha** | **Beta** | **Lower bound** | **Upper bound** | **Result** |
| **2** | `=BETA.INV(0.13, 5, 1, -1, 1)` | 0.13 | 5 | 1 | -1 | 1 | 0.33 |

### Related functions

[[BETA.DIST]]: The BETA.DIST function returns the probability of a given value as defined by the beta distribution function.