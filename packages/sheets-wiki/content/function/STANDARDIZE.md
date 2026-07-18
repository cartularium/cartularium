---
name: STANDARDIZE
category: statistical
syntax: STANDARDIZE(value, mean, standard_deviation)
status: imported
description: Calculates the normalized equivalent of a random variable given mean and standard deviation of the distribution.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094102?hl=en).

Calculates the normalized equivalent of a random variable given mean and standard deviation of the distribution.

### Sample Usage

```gse
STANDARDIZE(96,80,6.7)
STANDARDIZE(A2,A3,A4)
```

### Syntax

```gse
STANDARDIZE(value, mean, standard_deviation)
```

- `value` - The value of the random variable to normalize.
- `mean` - The mean of the distribution.
- `standard_deviation` - The standard deviation of the distribution.

### Notes

- For a given dataset, `mean` can be calculated using `AVERAGE` or its related functions and `standard_deviation` can be calculated using `STDEV` or its related functions.

### See Also

[[STDEV]]: The STDEV function calculates the standard deviation based on a sample.

[[AVERAGE]]: The AVERAGE function returns the numerical average value in a dataset, ignoring text.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdF9QbjQxQjhrOE5HY1B6Q2xFUnI2NVE&amp;output=html" width="500"></iframe>