---
name: CHIINV
category: statistical
syntax: CHIINV(probability, degrees_freedom)
status: imported
description: Calculates the inverse of the right-tailed chi-squared distribution.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/7003198?hl=en).

Calculates the inverse of the right-tailed chi-squared distribution.

### Sample Usage

```gse
CHIINV(0.42, 2)
CHIINV(A2, B2)
```

### Syntax

```gse
CHIINV(probability, degrees_freedom)
```

- `probability` - The probability associated with the right-tailed chi-squared distribution.

  + Must be greater than `0` and less than `1`.
- `degrees_freedom` - The number of degrees of freedom of the distribution.

### Notes

- `degrees_freedom` is truncated to an integer if a non-integer is provided.
- `degrees_freedom` must be at least `1`.
- All arguments must be numeric.
- `CHIINV` is synonymous with `CHISQ.INV.RT`.

### See Also

[[CHIDIST]]: Calculates the right-tailed chi-squared distribution, often used in hypothesis testing.

[[CHISQ.INV]]: Calculates the inverse of the left-tailed chi-squared distribution.

[[CHISQ.INV.RT]]: Calculates the inverse of the right-tailed chi-squared distribution.

[[CHITEST]]: Returns the probability associated with a Pearson’s chi-squared test on the two ranges of data. Determines the likelihood that the observed categorical data is drawn from an expected distribution.

[[FINV]]: Calculates the inverse of the right-tailed F probability distribution. Also called the Fisher-Snedecor distribution or Snedecor’s F distribution.

[[TINV]]: Calculates the inverse of the two-tailed TDIST function.

### Example

Suppose you want to find the cutoff for the chi-squared statistic associated with a p-value of `0.05`. With `4` degrees of freedom, you can consider any chi-squared statistic larger than `9.49` to be statistically significant.

| 1 | Probability | Degrees freedom | Solution |
| --- | --- | --- | --- |
| **2** | 0.05 | 4 | 9.487729037 |
| **3** | 0.05 | 4 | =CHIINV(0.05, 4) |
| **4** | 0.05 | 4 | =CHIINV(A2, B2) |