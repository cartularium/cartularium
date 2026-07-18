---
name: CHISQ.DIST.RT
category: statistical
syntax: CHISQ.DIST.RT(x, degrees_freedom)
status: imported
description: Calculates the right-tailed chi-squared distribution, which is commonly used in hypothesis testing.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/7003199?hl=en).

Calculates the right-tailed chi-squared distribution, which is commonly used in hypothesis testing.

### Sample Usage

```gse
CHISQ.DIST.RT(3.45, 2)
CHISQ.DIST.RT(A2, B2)
```

### Syntax

```gse
CHISQ.DIST.RT(x, degrees_freedom)
```

- `x` - The input to the chi-squared probability distribution function. The value at which to evaluate the function.

  + Must be a positive number.
- `degrees_freedom` - The number of degrees of freedom of the distribution.

### Notes

- `degrees_freedom` is truncated to an integer if a non-integer is provided.
- `degrees_freedom` must be at least `1` and may not exceed `10^10`.
- All arguments must be numeric.
- `CHISQ.DIST.RT` is synonymous with `CHIDIST`.

### See Also

[[CHIDIST]]: Calculates the right-tailed chi-squared distribution, often used in hypothesis testing.

[[CHIINV]]: Calculates the inverse of the right-tailed chi-squared distribution.

[[CHISQ.DIST]]: Calculates the left-tailed chi-squared distribution, often used in hypothesis testing.

[[CHITEST]]: Returns the probability associated with a Pearson’s chi-squared test on the two ranges of data. Determines the likelihood that the observed categorical data is drawn from an expected distribution.

### Example

Suppose you want to test the fairness of a 6-sided die:

- From several rolls, you obtain a chi-squared statistic of `12.3`.
- The number of degrees of freedom is `6 - 1 = 5`.
- We will evaluate the chi-squared distribution with `5` degrees of freedom when x equals `12.3`.

| 1 | x | Degrees freedom | Solution |
| --- | --- | --- | --- |
| **2** | 12.3 | 5 | 0.03090046464 |
| **3** | 12.3 | 5 | =CHISQ.DIST.RT(12.3, 5) |
| **4** | 12.3 | 5 | =CHISQ.DIST.RT(A2, B2) |