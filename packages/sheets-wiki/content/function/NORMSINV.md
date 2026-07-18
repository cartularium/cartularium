---
name: NORMSINV
category: statistical
syntax: NORMSINV(x)
status: imported
description: Returns the value of the inverse standard normal distribution function for a specified value.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094091?hl=en).

Returns the value of the inverse standard normal distribution function for a specified value.

### Sample Usage

```gse
NORMSINV(.75)
NORMSINV(A2)
```

### Syntax

```gse
NORMSINV(x)
```

- `x` - The input to the inverse standard normal distribution function.

### Notes

- The "standard" normal distribution function is the normal distribution function with mean of `0` and variance (and therefore standard deviation) of `1`.
- `x` must be greater than `0` and less than `1` or a `#NUM!` error will occur.

### See Also

[[WEIBULL]]: Returns the value of the Weibull distribution function (or Weibull cumulative distribution function) for a specified shape and scale.

[[POISSON]]: Returns the value of the Poisson distribution function (or Poisson cumulative distribution function) for a specified value and mean.

[[NORMSDIST]]: Returns the value of the standard normal cumulative distribution function for a specified value.

[[NORMINV]]: Returns the value of the inverse normal distribution function for a specified value, mean, and standard deviation.

[[NORMDIST]]: The NORMDIST function returns the value of the normal distribution function (or normal cumulative distribution function) for a specified value, mean, and standard deviation.

[[NEGBINOMDIST]]: Calculates the probability of drawing a certain number of failures before a certain number of successes given a probability of success in independent trials.

[[LOGNORMDIST]]: Returns the value of the log-normal cumulative distribution with given mean and standard deviation at a specified value.

[[LOGINV]]: Returns the value of the inverse log-normal cumulative distribution with given mean and standard deviation at a specified value.

[[EXPONDIST]]: Returns the value of the exponential distribution function with a specified lambda at a specified value.

[[BINOMDIST]]: Calculates the probability of drawing a certain number of successes (or a maximum number of successes) in a certain number of tries given a population of a certain size containing a certain number of successes, with replacement of draws.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdHBDcXFGdHVsSkxJZHBwX3N4ZjVTelE&amp;output=html" width="500"></iframe>