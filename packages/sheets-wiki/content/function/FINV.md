---
name: FINV
category: statistical
syntax: F.INV.RT(probability, degrees_freedom1, degrees_freedom2)
status: imported
description: The F.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/7003960?hl=en).

The F.INV.RT function calculates the inverse of the right-tailed F probability distribution. Also called the Fisher-Snedecor distribution or Snedecor’s F distribution.

### Sample Usage

```gse
F.INV.RT(0.42, 2, 3)
F.INV.RT(A2, B2, C2)
```

### Syntax

```gse
F.INV.RT(probability, degrees_freedom1, degrees_freedom2)
```

- `probability` - The probability associated with the right-tailed F-distribution.

  + Must be greater than `0` and less than `1`.
- `degrees_freedom1` - The number of degrees of freedom of the numerator of the test statistic.
- `degrees_freedom2` - The number of degrees of freedom of the denominator of the test statistic.

### Notes

- Both `degrees_freedom1` and `degrees_freedom2` are truncated to an integer in the calculation if a non-integer is provided as an argument.
- Both `degrees_freedom1` and `degrees_freedom2` must be at least `1`.
- All arguments must be numeric.
- `F.INV.RT` is synonymous with `FINV`.

### See Also

[[CHIINV]]: Calculates the inverse of the right-tailed chi-squared distribution.

[[F.DIST]]: Calculates the right-tailed F probability distribution (degree of diversity) for two data sets with given input x. Alternately called Fisher-Snedecor distribution or Snedecor's F distribution.

[[F.INV]]: Calculates the inverse of the left-tailed F probability distribution. Also called the Fisher-Snedecor distribution or Snedecor’s F distribution.

[[FTEST]]: Returns the probability associated with an F-test for equality of variances. Determines whether two samples are likely to have come from populations with the same variance.

[[TINV]]: Calculates the inverse of the two-tailed TDIST function.

### Example

Suppose you want to find the cutoff for the F statistic associated with a p-value of `0.05`. With `4` and `5` as the degrees of freedom, you can consider any F statistic larger than `5.19` to be statistically significant.

|  | A | B | C | D |
| --- | --- | --- | --- | --- |
| 1 | **Probability** | **Degrees freedom numerator** | **Degrees freedom denominator** | **Solution** |
| 2 | 0.05 | 4 | 5 | 5.192167773 |
| 3 | 0.05 | 4 | 5 | =F.INV.RT(0.05, 4, 5) |
| 4 | 0.05 | 4 | 5 | =F.INV.RT(A2, B2, C2) |