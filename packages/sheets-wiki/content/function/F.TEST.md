---
name: F.TEST
category: statistical
syntax: FTEST(range1, range2)
status: imported
description: Returns the probability associated with an F-test for equality of variances.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/7004183?hl=en).

Returns the probability associated with an F-test for equality of variances. Determines whether two samples are likely to have come from populations with the same variance.

### Sample Usage

```gse
FTEST(A1:A5, B1:B5)
FTEST(A1:D3, A5:D7)
```

### Syntax

```gse
FTEST(range1, range2)
```

- `range1` - The first sample of data or group of cells to consider for the F-test.
- `range2` - The second sample of data or group of cells to consider for the F-test.

### Notes

- Any non-numeric cells in either range are ignored in the calculation.
- You can use `FTEST` or `F.TEST` to perform this function.

### See Also

[[CHITEST]]: Returns the probability associated with a Pearson’s chi-squared test on the two ranges of data. Determines the likelihood that the observed categorical data is drawn from an expected distribution.

[[FDIST]]: Calculates the right-tailed F probability distribution (degree of diversity) for two data sets with given input x. Alternately called Fisher-Snedecor distribution or Snedecor's F distribution.

[[FINV]]: Calculates the inverse of the right-tailed F probability distribution. Also called the Fisher-Snedecor distribution or Snedecor’s F distribution.

[[TTEST]]: Returns the probability associated with t-test. Determines whether two samples are likely to have come from the same two underlying populations that have the same mean.

### Example

Suppose you want to determine whether exam scores from this semester have a different variability than last semester. Pass the scores from each semester as arguments to `FTEST`. Because the p-value is high, we can conclude that there is not a significant difference in variability in exam scores.

|  | A | B |
| --- | --- | --- |
| 1 | **Scores this semester** | **Scores last semester** |
| 2 | 92 | 84 |
| 3 | 75 | 89 |
| 4 | 97 | 87 |
| 5 | 85 | 95 |
| 6 | 87 | 82 |
| 7 | 82 | 71 |
| 8 | 79 |  |
| 9 | **Solution** | **Formula** |
| 10 | 0.8600520777 | `=FTEST(A2:A8, B2:B7)` |