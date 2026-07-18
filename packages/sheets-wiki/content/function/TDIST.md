---
name: TDIST
category: statistical
syntax: TDIST(x, degrees_freedom, tails)
status: imported
description: Calculates the probability for Student's t-distribution with a given input (x).
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3295914?hl=en).

Calculates the probability for Student's t-distribution with a given input (x).

### Sample Usage

```gse
TDIST(A2, 30, 1)
TDIST(0.5, 1, 2)
```

### Syntax

```gse
TDIST(x, degrees_freedom, tails)
```

- `x` - The input to the t-distribution function.
- `degrees_freedom` - The number of degrees of freedom.
- `tails` - Specifies whether the calculated distribution will be one- or two-sided. (1 for one-tailed distributions, 2 for two-tailed distributions).

### See Also

[`NOMDIST`](https://support.google.com/docs/answer/3094021): The NORMDIST function returns the value of the normal distribution function (or normal cumulative distribution function) for a specified value, mean, and standard deviation.

[[BINOMDIST]]: Calculates the probability of drawing a certain number of successes (or a maximum number of successes) in a certain number of tries given a population of a certain size containing a certain number of successes, with replacement of draws.

[[EXPONDIST]]: Returns the value of the exponential distribution function with a specified lambda at a specified value.

[[NEGBINOMDIST]]: Calculates the probability of drawing a certain number of failures before a certain number of successes given a probability of success in independent trials.

[[PROB]]: Given a set of values and corresponding probabilities, calculates the probability that a value chosen at random falls between two limits.