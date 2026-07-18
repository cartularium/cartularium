---
name: CHISQ.TEST
category: statistical
syntax: CHITEST(observed_range, expected_range)
status: imported
description: Returns the probability associated with a Pearson’s chi-squared test on the two ranges of data.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/7004263?hl=en).

Returns the probability associated with a Pearson’s chi-squared test on the two ranges of data. Determines the likelihood that the observed categorical data is drawn from an expected distribution.

### Sample Usage

```gse
CHITEST(A1:A5, B1:B5)
CHITEST(A1:D3, A5:D7)
```

### Syntax

```gse
CHITEST(observed_range, expected_range)
```

- `observed_range` - The counts associated with each category of data.
- `expected_range` - The expected counts for each category under the null hypothesis.

### Notes

- `observed_range` and `expected_range` must both be ranges with the same number of rows and columns.
- If any cell in either range is non-numeric, it and the corresponding cell in the other range do not count toward the calculation.

### See Also

[[CHIDIST]]: Calculates the right-tailed chi-squared distribution, often used in hypothesis testing.

[[CHIINV]]: Calculates the inverse of the right-tailed chi-squared distribution.

[[CHISQ.DIST]]: Calculates the left-tailed chi-squared distribution, often used in hypothesis testing.

[[CHISQ.DIST.RT]]: Calculates the right-tailed chi-squared distribution, which is commonly used in hypothesis testing.

[[FTEST]]: Returns the probability associated with an F-test for equality of variances. Determines whether two samples are likely to have come from populations with the same variance.

[[TTEST]]: Returns the probability associated with t-test. Determines whether two samples are likely to have come from the same two underlying populations that have the same mean.

### Example

Suppose you want to test the fairness of a 6-sided die. You count the number of times each side is rolled for 60 trials, and compare it to an expected distribution where each side is rolled 10 times. There is only a 5.1% chance that the die is actually fair.

|  | A | B |
| --- | --- | --- |
| 1 | Observed data | Expected data |
| 2 | 11 | 10 |
| 3 | 15 | 10 |
| 4 | 8 | 10 |
| 5 | 10 | 10 |
| 6 | 2 | 10 |
| 7 | 14 | 10 |
| 8 | **Solution** | **Formula** |
| 9 | 0.05137998348 | =CHITEST(A1:A6, B1:B6) |