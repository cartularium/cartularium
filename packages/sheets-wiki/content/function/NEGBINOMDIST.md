---
name: NEGBINOMDIST
category: statistical
syntax: NEGBINOMDIST(num_failures, num_successes, prob_success)
status: imported
description: Calculates the probability of drawing a certain number of failures before a certain number of successes given a probability of success in independent trials.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094031?hl=en).

Calculates the probability of drawing a certain number of failures before a certain number of successes given a probability of success in independent trials.

### Sample Usage

```gse
NEGBINOMDIST(4,2,0.1)
NEGBINOMDIST(A2,A3,A4)
```

### Syntax

```gse
NEGBINOMDIST(num_failures, num_successes, prob_success)
```

- `num_failures` - The number of failures to model.
- `num_successes` - The number of successes to model.
- `prob_success` - The probability of success in any given trial.

### Notes

- `NEGBINOMDIST` models the negative binomial distribution, which is related to the binomial distribution except that the number of trials is variable whereas the number of successes is fixed.

### See Also

[[WEIBULL]]: Returns the value of the Weibull distribution function (or Weibull cumulative distribution function) for a specified shape and scale.

[[POISSON]]: Returns the value of the Poisson distribution function (or Poisson cumulative distribution function) for a specified value and mean.

[[NORMSINV]]: Returns the value of the inverse standard normal distribution function for a specified value.

[[NORMSDIST]]: Returns the value of the standard normal cumulative distribution function for a specified value.

[[NORMINV]]: Returns the value of the inverse normal distribution function for a specified value, mean, and standard deviation.

[[NORMDIST]]: The NORMDIST function returns the value of the normal distribution function (or normal cumulative distribution function) for a specified value, mean, and standard deviation.

[[LOGNORMDIST]]: Returns the value of the log-normal cumulative distribution with given mean and standard deviation at a specified value.

[[LOGINV]]: Returns the value of the inverse log-normal cumulative distribution with given mean and standard deviation at a specified value.

[[HYPGEOMDIST]]: Calculates the probability of drawing a certain number of successes in a certain number of tries given a population of a certain size containing a certain number of successes, without replacement of draws.

[[EXPONDIST]]: Returns the value of the exponential distribution function with a specified lambda at a specified value.

[[BINOMDIST]]: Calculates the probability of drawing a certain number of successes (or a maximum number of successes) in a certain number of tries given a population of a certain size containing a certain number of successes, with replacement of draws.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdElJLWNJUkZ1MXh0Tnh2cXVoSjJZbVE&amp;output=html" width="500"></iframe>