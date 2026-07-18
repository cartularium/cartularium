---
name: Z.TEST
category: statistical
syntax: Z.TEST(data, value, [standard_deviation])
status: imported
description: Returns the one-tailed P-value of a Z-test with standard distribution.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094067?hl=en).

Returns the one-tailed P-value of a Z-test with standard distribution.

### Sample Usage

```gse
Z.TEST(A2:A100,B2)
Z.TEST({1,2,3,4,5,6},5.5,1.2)
```

### Syntax

```gse
Z.TEST(data, value, [standard_deviation])
```

- `data` - The array or range containing the dataset to consider.
- `value` - The test statistic to use in the Z-test.
- `standard_deviation` - **[** OPTIONAL **]** - The standard deviation to assume for the Z-test. If this is not provided, `STDEV(data)` will be calculated.

### Notes

- The P-value returned by `Z.TEST` is the probability that a randomly generated sample (of the same size as the data) has a mean `value` greater than that of the original data set.
- You can use `ZTEST` or `Z.TEST` to perform this function.

### See Also

[[NORMSDIST]]: Returns the value of the standard normal cumulative distribution function for a specified value.

[[NORMDIST]]: The NORMDIST function returns the value of the normal distribution function (or normal cumulative distribution function) for a specified value, mean, and standard deviation.

[[CONFIDENCE]]: Calculates the width of half the confidence interval for a normal distribution.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdEw2M1J1Z1lKaE1YZkFMWUxrVXQzVXc&amp;output=html" width="500"></iframe>