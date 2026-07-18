---
name: CRITBINOM
category: statistical
syntax: CRITBINOM(num_trials, prob_success, target_prob)
status: imported
description: Calculates the smallest value for which the cumulative binomial distribution is greater than or equal to a specified criteria.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093623?hl=en).

Calculates the smallest value for which the cumulative binomial distribution is greater than or equal to a specified criteria.

### Sample Usage

```gse
CRITBINOM(100,0.005,0.8)
CRITBINOM(A2,A3,A4)
```

### Syntax

```gse
CRITBINOM(num_trials, prob_success, target_prob)
```

- `num_trials` - The number of independent trials.
- `prob_success` - The probability of success in any given trial.
- `target_prob` - The desired threshold probability.

### See Also

[[PROB]]: Given a set of values and corresponding probabilities, calculates the probability that a value chosen at random falls between two limits.

[[BINOMDIST]]: Calculates the probability of drawing a certain number of successes (or a maximum number of successes) in a certain number of tries given a population of a certain size containing a certain number of successes, with replacement of draws.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdEdtX011WGpSN3Rpb1JQd1gtTUVtSHc&amp;output=html" width="500"></iframe>