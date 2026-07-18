---
name: F.INV
category: statistical
syntax: F.INV(probability, degrees_freedom1, degrees_freedom2)
status: imported
description: Calculates the inverse of the left-tailed F probability distribution.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/7004265?hl=en).

Calculates the inverse of the left-tailed F probability distribution. Also called the Fisher-Snedecor distribution or Snedecor’s F distribution.

### Sample Usage

```gse
F.INV(0.42, 2, 3)
F.INV(A2, B2, C2)
```

### Syntax

```gse
F.INV(probability, degrees_freedom1, degrees_freedom2)
```

- `probability` - The probability associated with the left-tailed F-distribution.

  + Must be greater than `0` and less than `1`.
- `degrees_freedom1` - The number of degrees of freedom of the numerator of the test statistic.
- `degrees_freedom2` - The number of degrees of freedom of the denominator of the test statistic.

### Notes

- Both `degrees_freedom1` and `degrees_freedom2` are truncated to an integer in the calculation if a non-integer is provided as an argument.
- Both `degrees_freedom1` and `degrees_freedom2` must be at least `1`.
- All arguments must be numeric.

### See Also

[[CHIINV]]: Calculates the inverse of the right-tailed chi-squared distribution.

[[FDIST]]: Calculates the right-tailed F probability distribution (degree of diversity) for two data sets with given input x. Alternately called Fisher-Snedecor distribution or Snedecor's F distribution.

[[FINV]]: Calculates the inverse of the right-tailed F probability distribution. Also called the Fisher-Snedecor distribution or Snedecor’s F distribution.

[[FTEST]]: Returns the probability associated with an F-test for equality of variances. Determines whether two samples are likely to have come from populations with the same variance.

[[T.INV]]: Calculates the negative inverse of the one-tailed TDIST function.

### Example

Suppose you want to find the cutoff for the F statistic associated with a left-tailed cumulative probability of `0.95`.

|  | A | B | C | D |
| --- | --- | --- | --- | --- |
| 1 | **Probability** | **Degrees freedom numerator** | **Degrees freedom denominator** | **Solution** |
| 2 | 0.95 | 4 | 5 | 5.192167773 |
| 3 | 0.95 | 4 | 5 | =F.INV(0.95, 4, 5) |
| 4 | 0.95 | 4 | 5 | =F.INV(A2, B2, C2) |