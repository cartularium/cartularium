---
name: GAMMA.DIST
category: statistical
syntax: GAMMA.DIST(x, alpha, beta, cumulative)
status: imported
description: The GAMMA.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/7013990?hl=en).

The GAMMA.DIST function calculates the gamma distribution, a 2-parameter continuous probability distribution.

### Sample Usage

```gse
GAMMA.DIST(4.79, 1.234, 7, TRUE)
GAMMA.DIST(A1, B1, C1, FALSE)
```

### Syntax

```gse
GAMMA.DIST(x, alpha, beta, cumulative)
```

- `x` - The input to the gamma probability distribution function. The value at which to evaluate the function.
- `alpha` - The shape of gamma distribution.
- `beta` - The scale of the distribution.
- `cumulative` - Logical value that determines the form of the function.

  + If `TRUE: GAMMA.DIST` returns the left-tailed cumulative distribution function.
  + If `FALSE: GAMMA.DIST` returns the probability density function.

### Notes

- `x`, `alpha`, and `beta` must be numeric.
- `alpha` and `beta` must be greater than zero.
- If `alpha` is less than or equal to `1` and `cumulative` is `FALSE`, then `x` must be greater than zero; otherwise, `x` must be greater than or equal to zero.
- `GAMMA.DIST` is synonymous with `GAMMADIST`.
- The chi-squared distribution is a special case of the gamma distribution. For an integer `n > 0`, `GAMMA.DIST(x, n/2, 2, cumulative)` is equivalent to `CHISQ.DIST(x, n, cumulative)`.

### See Also

[[CHISQ.DIST]]: Calculates the left-tailed chi-squared distribution, often used in hypothesis testing.

[[GAMMADIST]]: Calculates the gamma distribution, a two-parameter continuous probability distribution.

### Example

Evaluate the probability density function of the gamma distribution at `x = 5` with `alpha = 3.14` and `beta = 2`.

|  | A | B | C | D |
| --- | --- | --- | --- | --- |
| 1 | **x** | **alpha** | **beta** | **solution** |
| 2 | 5 | 3.14 | 2 | 0.1276550316 |
| 4 | 5 | 3.14 | 2 | =GAMMA.DIST(5, 3.14, 2, FALSE) |
| 5 | 5 | 3.14 | 2 | =GAMMA.DIST(A2, B2, C2, FALSE) |