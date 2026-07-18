---
name: WEIBULL.DIST
category: statistical
syntax: WEIBULL(x, shape, scale, cumulative)
status: imported
description: Returns the value of the Weibull distribution function (or Weibull cumulative distribution function) for a specified shape and scale.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094116?hl=en).

Returns the value of the Weibull distribution function (or Weibull cumulative distribution function) for a specified shape and scale.

### Sample Usage

```gse
WEIBULL(2.4, 2, 3, TRUE)
WEIBULL(A2,A3,A4,TRUE)
```

### Syntax

```gse
WEIBULL(x, shape, scale, cumulative)
```

- `x` - The input to the Weibull distribution function.
- `shape` - The shape parameter of the Weibull distribution function.

  + `shape` is usually denoted k, and denoted as alpha in other spreadsheet packages.
  + `shape` must be greater than `0`.
- `scale` - The scale parameter of the Weibull distribution function.

  + `scale` is usually denoted lambda in texts, and denoted as beta in other spreadsheet packages.
  + `scale` must be greater than `0`.
- `cumulative` - `TRUE` to use the cumulative distribution function, `FALSE` to use the probability density function.

### Notes

- If `shape` is `1`, `WEIBULL` is equivalent to `EXPONDIST` with `lambda` set to `1/scale`.

### See Also

[[POISSON]]: Returns the value of the Poisson distribution function (or Poisson cumulative distribution function) for a specified value and mean.

[[NORMSINV]]: Returns the value of the inverse standard normal distribution function for a specified value.

[[NORMSDIST]]: Returns the value of the standard normal cumulative distribution function for a specified value.

[[NORMINV]]: Returns the value of the inverse normal distribution function for a specified value, mean, and standard deviation.

[[NORMDIST]]: The NORMDIST function returns the value of the normal distribution function (or normal cumulative distribution function) for a specified value, mean, and standard deviation.

[[NEGBINOMDIST]]: Calculates the probability of drawing a certain number of failures before a certain number of successes given a probability of success in independent trials.

[[LOGNORMDIST]]: Returns the value of the log-normal cumulative distribution with given mean and standard deviation at a specified value.

[[LOGINV]]: Returns the value of the inverse log-normal cumulative distribution with given mean and standard deviation at a specified value.

[[EXPONDIST]]: Returns the value of the exponential distribution function with a specified lambda at a specified value.

[[BINOMDIST]]: Calculates the probability of drawing a certain number of successes (or a maximum number of successes) in a certain number of tries given a population of a certain size containing a certain number of successes, with replacement of draws.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdF96VkcyU0xaaGMwUFZYS19xNURCd2c&amp;output=html" width="500"></iframe>