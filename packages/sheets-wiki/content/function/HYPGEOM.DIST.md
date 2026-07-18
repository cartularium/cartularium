---
name: HYPGEOM.DIST
category: statistical
syntax: HYPGEOMDIST(num_successes, num_draws, successes_in_pop, pop_size)
status: imported
description: >-
  Calculates the probability of drawing a certain number of successes in a certain number of tries given a population of a certain size containing a certain number of successes, without replacement of
  draws.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094004?hl=en).

Calculates the probability of drawing a certain number of successes in a certain number of tries given a population of a certain size containing a certain number of successes, without replacement of draws.

### Sample Usage

```gse
HYPGEOMDIST(4,12,20,40)
HYPGEOMDIST(A2,A3,A4,A5)
```

### Syntax

```gse
HYPGEOMDIST(num_successes, num_draws, successes_in_pop, pop_size)
```

- `num_successes` - The desired number of successes.
- `num_draws` - The number of permitted draws.
- `successes_in_pop` - The total number of successes in the population.
- `pop_size` - The total size of the population

### Notes

- `BINOMDIST` describes the probability of drawing a certain number of successes in a certain number of tries given a population of a certain size containing a certain number of successes, *with* replacement of draws.

### See Also

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

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdFc4Zzcwb0VlelE4dDh4UUY5d3NzUFE&amp;output=html" width="500"></iframe>