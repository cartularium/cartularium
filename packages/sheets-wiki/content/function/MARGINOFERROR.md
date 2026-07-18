---
name: MARGINOFERROR
category: statistical
syntax: MARGINOFERROR(range, confidence)
status: imported
description: This function calculates the margin of error from a range of values and a confidence level.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/12487850?hl=en).

This function calculates the margin of error from a range of values and a confidence level.

### Sample Usage

MARGINOFERROR(A1:A7, 0.95)

MARGINOFERROR(A1:C3, 0.99)

### Syntax

MARGINOFERROR(range, confidence)

- Range- The range of values used to calculate the margin of error.
- Confidence- The desired confidence level between (0, 1).

### Notes

- The margin of error is a statistical measurement used to determine the amount of error due to chance in a random sample of a population.
  + A large margin of error indicates that the estimate of the parameter of a given sample may not represent the parameter of the entire population.
  + The margin of error decreases when the sample size is greater.
  + Surveys with less differences in responses between participants also have smaller margins of error.
- The confidence level is the likelihood that the true mean of the population lies in the margin of error above or below the sample mean.
- MARGINOFERROR(range, confidence) is equal to CONFIDENCE.T(1 - confidence, STDEV(range), COUNT(range)).
- The margin of error calculation is appropriate for:
  + Continuous data normally distributed.
  + Surveys with large sample sizes.

### Examples

| A |
| --- |
| **1** | 8 |
| **2** | 4 |
| **3** | 3 |
| **4** | 6 |
| **Mean** | 5.25 |
| **Formula** | =MARGINOFERROR(A1:A4, 0.95) |
| **Result of MARGINOFERROR** | 3.528 |
| **Confidence Interval** | [5.25 - 3.528, 5.25 + 3.528] |
| **Lower Bound**  **(Mean - MARGINOFERROR)** | 1.722 |
| **Upper Bound**  **(Mean - MARGINOFERROR)** | 8.778 |

### Related resources

- [[CONFIDENCE.T]]
- [[CONFIDENCE.NORM]]