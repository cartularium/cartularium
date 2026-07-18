---
name: BINOM.DIST
category: statistical
syntax: BINOMDIST(num_successes, num_trials, prob_success, cumulative)
status: imported
description: >-
  Calculates the probability of drawing a certain number of successes (or a maximum number of successes) in a certain number of tries given a population of a certain size containing a certain number
  of successes, with replacement of draws.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093987?hl=en).

Calculates the probability of drawing a certain number of successes (or a maximum number of successes) in a certain number of tries given a population of a certain size containing a certain number of successes, with replacement of draws.

### Sample Usage

```gse
BINOMDIST(4,100,0.005,FALSE)
BINOMDIST(A2,A3,A4,TRUE)
```

### Syntax

```gse
BINOMDIST(num_successes, num_trials, prob_success, cumulative)
```

- `num_successes` - The number of successes for which to calculate the probability in `num_trials` trials.

  + If `cumulative` is `TRUE` then `BINOMDIST` returns the probability of `num_successes` or fewer successes, otherwise the probability of exactly `num_successes` successes.
- `num_trials` - The number of independent trials.
- `prob_success` - The probability of success in any given trial.
- `cumulative` - **[** `FALSE` by default **]** - Whether to use the binomial cumulative distribution.

### Notes

- `HYPGEOMDIST` describes the probability of drawing a certain number of successes in a certain number of tries given a population of a certain size containing a certain number of successes, *without* replacement of draws.

### See Also

[[WEIBULL]]: Returns the value of the Weibull distribution function (or Weibull cumulative distribution function) for a specified shape and scale.

[[PROB]]: Given a set of values and corresponding probabilities, calculates the probability that a value chosen at random falls between two limits.

[[POISSON]]: Returns the value of the Poisson distribution function (or Poisson cumulative distribution function) for a specified value and mean.

[[NORMSINV]]: Returns the value of the inverse standard normal distribution function for a specified value.

[[NORMSDIST]]: Returns the value of the standard normal cumulative distribution function for a specified value.

[[NORMINV]]: Returns the value of the inverse normal distribution function for a specified value, mean, and standard deviation.

[[NORMDIST]]: The NORMDIST function returns the value of the normal distribution function (or normal cumulative distribution function) for a specified value, mean, and standard deviation.

[[NEGBINOMDIST]]: Calculates the probability of drawing a certain number of failures before a certain number of successes given a probability of success in independent trials.

[[LOGNORMDIST]]: Returns the value of the log-normal cumulative distribution with given mean and standard deviation at a specified value.

[[LOGINV]]: Returns the value of the inverse log-normal cumulative distribution with given mean and standard deviation at a specified value.

[[HYPGEOMDIST]]: Calculates the probability of drawing a certain number of successes in a certain number of tries given a population of a certain size containing a certain number of successes, without replacement of draws.

[[EXPONDIST]]: Returns the value of the exponential distribution function with a specified lambda at a specified value.

[[CRITBINOM]]: Calculates the smallest value for which the cumulative binomial distribution is greater than or equal to a specified criteria.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdGxhcG9Uem1xekpHcWhaUVlKZWlXeVE&amp;output=html" width="500"></iframe>