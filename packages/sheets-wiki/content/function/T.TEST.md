---
name: T.TEST
category: statistical
syntax: T.TEST(range1, range2, tails, type)
status: imported
description: Returns the probability associated with t-test.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/6055837?hl=en).

Returns the probability associated with t-test. Determines whether two samples are likely to have come from the same two underlying populations that have the same mean.

### Sample Usage

```gse
T.TEST(A1:A4, B1:B4, 2, 1)
```

### Syntax

```gse
T.TEST(range1, range2, tails, type)
```

- `range1` - The first sample of data or group of cells to consider for the t-test.
- `range2` - The second sample of data or group of cells to consider for the t-test.
- `tails` - Specifies the number of distribution tails.

  + If `1`: uses a one-tailed distribution.
  + If `2`: uses a two-tailed distribution.
- `type` - Specifies the type of t-Test.

  + If `1`: a paired test is performed.
  + If `2`: a two-sample equal variance (homoscedastic) test is performed.
  + If `3`: a two-sample unequal variance (heteroscedastic) test is performed.

### Notes

- `tails` and `type` must be numeric.
- `range1` and `range2` must have the same number of data points.
- `T.TEST` uses the data in `range1` and `range2` to compute a non-negative test. If `tails` is set to `1`, `T.TEST` returns the probability of a higher value of the t-statistic under the assumption that `range1` and `range2` are samples from populations with the same mean. The value returned by `T.TEST` when `tails` is set to  `2` is double that returned when `tails` is set to `1` and corresponds to the probability of a higher absolute value of the t-statistic under the "same population means" assumption.
- You can use `TTEST` or `T.TEST` to perform this function.

### Examples

In this example, a paired, two-tailed t-Test is computed on a student's first and second quarter grades.

<iframe height="450" src="https://docs.google.com/spreadsheets/d/1OvkNshFiPh2P343eNv244viXpiTlF-WtSHpteKF7hzI/pubhtml?widget=true&amp;headers=false" width="500"></iframe>