---
name: BETADIST
category: statistical
syntax: BETA.DIST(value, alpha, beta, lower_bound, upper_bound)
status: imported
description: The BETA.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9084228?hl=en).

The BETA.DIST function returns the probability of a given value as defined by the beta distribution function.

### Syntax
```gse
BETA.DIST(value, alpha, beta, lower_bound, upper_bound)
```

| Part | Description | Notes |
| --- | --- | --- |
| `value` | The value at which to evaluate the probability function. | * The given value must be a number from the given lower boundary to the given upper boundary. |
| `alpha` | The first shape parameter of the distribution. | * The given alpha must be a positive number. |
| beta | The second shape parameter of the distribution. | * The given beta must be a positive number. |
| `lower_bound` | The lower boundary of the function. | * The default lower boundary is 0. |
| `upper-bound` | The upper boundary of the function. | * The default upper boundary is 1. |

### Sample formulas

```gse
BETA.DIST(0.65, 1.234, 7, 0.5, 3)
BETA.DIST(0.42, 3, 8)
BETA.DIST(0.92, 0.5, 0.7)
BETA.DIST(A5, 0.5, 0.7, -1, 1)
```

### Note

- You can use `BETADIST` or `BETA.DIST` to perform this function.

### Example

In this example, the cumulative probability of beta distribution at 0.3 is parameterized by an alpha of 5 and a beta of 1, defined over [-1, 1]:

| A | B | C | D | E | F |
| --- | --- | --- | --- | --- | --- |
| **1** | **Value** | **Alpha** | **Beta** | **Lower bound** | **Upper bound** | **Solution** |
| **2** | 0.3 | 5 | 1 | -1 | 1 | 0.1160290625 |
| **3** | 0.3 | 5 | 1 | -1 | 1 | =BETA.DIST(0.3, 5, 1, -1, 1) |
| **4** | 0.3 | 5 | 1 | -1 | 1 | =BETA.DIST(A4, B4, C4, D4, E4) |

### Related function

[[BETAINV]]: The BETA.INV function returns the value of the inverse beta distribution function for a given probability.