---
name: GAUSS
category: statistical
syntax: GAUSS(z)
status: imported
description: The GAUSS function returns the probability that a random variable, drawn from a normal distribution, will be between the mean and *z* standard deviations above (or below) the mean.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9116278?hl=en).

The GAUSS function returns the probability that a random variable, drawn from a normal distribution, will be between the mean and *z* standard deviations above (or below) the mean. A normal distribution is also commonly known as a Gaussian distribution, from which this function gets its name.

### Syntax
```gse
GAUSS(z)
```

| Part | Description | Notes |
| --- | --- | --- |
| `z` | The number of standard deviations from the mean. | * The parameter *z*represents how far away from the mean a random variable might fall. * A normal distribution is characterized by a mean (μ) and a standard deviation (*z* **\*** σ). |

### Sample formulas

```gse
GAUSS(1)
GAUSS(B2)
```

### Notes

- A negative z value causes GAUSS(z) to return a negative number.
- When z uses the value in another cell (e.g. "GAUSS(B2)"), the GAUSS function returns 0 if there's no data in the cell.
- Calling GAUSS(z) asks the question, "what's the probability that a random number will be between μ and the standard deviation *z* **\*** σ?"

### Examples

| A | B | C |
| --- | --- | --- |
| **1** | **Function** | **Result** | **Comment** |
| **2** | =GAUSS(1) | 0.3413447461 | Probability that a variable falls between the mean and 1 standard deviation above the mean. |
| **3** | =GAUSS(-1) | -0.3413447461 | Probability that a variable falls between the mean and 1 standard deviation below the mean. Note that the result is negative. |
| **4** | =2\*GAUSS(1) | 0.6826894921 | Probability that a variable falls within 1 standard deviation of the mean. |

### Related function

[[NORMDIST]]: The NORMDIST function returns the value of the normal distribution function (or normal cumulative distribution function) for a specified value, mean, and standard deviation.