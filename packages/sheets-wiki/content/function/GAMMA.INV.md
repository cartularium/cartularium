---
name: GAMMA.INV
category: statistical
syntax: GAMMA.INV(probability, alpha, beta)
status: imported
description: The GAMMA.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9116467?hl=en).

The GAMMA.INV function returns the value of the inverse gamma cumulative distribution function for the specified probability, alpha, and beta parameters.

### Syntax
```gse
GAMMA.INV(probability, alpha, beta)
```

| Part | Description | Notes |
| --- | --- | --- |
| `probability` | The input to the inverse gamma distribution function. | * Must be between 0 and 1. |
| `alpha` | The shape of the gamma distribution. | * Must be positive. * The sign of significance is ignored. |
| `beta` | The scale of the gamma distribution. | * Must be positive. |

### Sample formulas

```gse
GAMMA.INV(0.65, 4, 2)
GAMMA.INV(C3, 3, 2)
```

### Note

- You can use `GAMMAINV` or `GAMMA.INV` to perform this function.

### Example

| A | B |
| --- | --- |
| **1** | **Formula** | **Result** |
| **2** | =GAMMA.INV(0.3, 5, 1) | 3.633609083 |

### Related function

- [[GAMMA.DIST]]: The GAMMA.DIST function calculates the gamma distribution, a 2-parameter continuous probability distribution.