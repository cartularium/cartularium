---
name: NORM.DIST
category: statistical
syntax: NORMDIST(x, mean, standard_deviation, cumulative)
status: imported
description: The NORMDIST function returns the value of the normal distribution function (or normal cumulative distribution function) for a specified value, mean, and standard deviation.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094021?hl=en).

The NORMDIST function returns the value of the normal distribution function (or normal cumulative distribution function) for a specified value, mean, and standard deviation.

### Sample Usage

```gse
NORMDIST(2.4,1,4,FALSE)
NORMDIST(A2,A3,A4,TRUE)
```

### Syntax

```gse
NORMDIST(x, mean, standard_deviation, cumulative)
```

- `x` - The input to the normal distribution function.
- `mean` - The mean (mu) of the normal distribution function.
- `standard_deviation` - The standard deviation (sigma) of the normal distribution function.
- `cumulative` - Whether to use the normal cumulative distribution function rather than the distribution function.

### See Also

[[ZTEST]]: Returns the one-tailed P-value of a Z-test with standard distribution.

[[WEIBULL]]: Returns the value of the Weibull distribution function (or Weibull cumulative distribution function) for a specified shape and scale.

[[POISSON]]: Returns the value of the Poisson distribution function (or Poisson cumulative distribution function) for a specified value and mean.

[[NORMSINV]]: Returns the value of the inverse standard normal distribution function for a specified value.

[[NORMSDIST]]: Returns the value of the standard normal cumulative distribution function for a specified value.

[[NORMINV]]: Returns the value of the inverse normal distribution function for a specified value, mean, and standard deviation.

[[NEGBINOMDIST]]: Calculates the probability of drawing a certain number of failures before a certain number of successes given a probability of success in independent trials.

[[LOGNORMDIST]]: Returns the value of the log-normal cumulative distribution with given mean and standard deviation at a specified value.

[[LOGINV]]: Returns the value of the inverse log-normal cumulative distribution with given mean and standard deviation at a specified value.

[[EXPONDIST]]: Returns the value of the exponential distribution function with a specified lambda at a specified value.

[[BINOMDIST]]: Calculates the probability of drawing a certain number of successes (or a maximum number of successes) in a certain number of tries given a population of a certain size containing a certain number of successes, with replacement of draws.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdGg0OVhSV0JlSjFJalp5dF9qTXh6NVE&amp;output=html" width="500"></iframe>