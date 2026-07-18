---
name: PROB
category: statistical
syntax: PROB(data, probabilities, low_limit, [high_limit])
status: imported
description: Given a set of values and corresponding probabilities, calculates the probability that a value chosen at random falls between two limits.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094039?hl=en).

Given a set of values and corresponding probabilities, calculates the probability that a value chosen at random falls between two limits.

### Sample Usage

```gse
PROB({1,2,3,4},{0.25,0.25,0.25,0.25},3)
PROB(A2:A100,B2:B100,C2,C3)
```

### Syntax

```gse
PROB(data, probabilities, low_limit, [high_limit])
```

- `data` - Array or range containing the dataset to consider.
- `probabilities` - Array or range containing probabilities corresponding to `data`.

  + Each value in `probabilities` must be greater than `0` and less than or equal to `1`.
- `low_limit` - The lower bound on the value range for which to calculate the probability.
- `high_limit` - **[** OPTIONAL - `low_limit` by default **]** - The upper bound on the value range for which to calculate the probability.

  + If `high_limit` is omitted, `PROB` calculates the probability that a value chosen at random is exactly equal to `low_limit`.

### Notes

- The number of values in `data` and `probabilities` must be the same.

### See Also

[[CRITBINOM]]: Calculates the smallest value for which the cumulative binomial distribution is greater than or equal to a specified criteria.

[[BINOMDIST]]: Calculates the probability of drawing a certain number of successes (or a maximum number of successes) in a certain number of tries given a population of a certain size containing a certain number of successes, with replacement of draws.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdGJWaFU5SEVRVzVBSzBLUzNobGYySlE&amp;output=html" width="500"></iframe>