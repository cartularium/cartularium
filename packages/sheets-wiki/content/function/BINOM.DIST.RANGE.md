---
name: BINOM.DIST.RANGE
category: statistical
engines:
  excel:
    status: available
  gsheets:
    status: available
coverage: pending-assay
syntax: BINOM.DIST.RANGE(num_trials, prob_success, num_successes, max_num_successes)
status: imported
description: Returns the probability of drawing a specific number of successes or range of successes given a probability and number of tries.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9982776).

Returns the probability of drawing a specific number of successes or range of successes given a probability and number of tries.

### Syntax

```gse
BINOM.DIST.RANGE(num_trials, prob_success, num_successes, max_num_successes)
```

| Part                | Description                                                                                                                                                                                                                                              |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| num\_trials         | The number of independent trials. Must be greater than or equal to 0.                                                                                                                                                                                    |
| prob\_success       | The probability of success in any given trial. Must be between 0 and 1, both  exclusive.                                                                                                                                                                 |
| num\_successes      | The number of successes for which to calculate the probability in `num\_trials`  trials. Must be between 0 and num\_trials, both exclusive.                                                                                                              |
| max\_num\_successes | **Optional:** The maximum number of successes for which to calculate the   probability in `num\_trials` trials. If omitted, then we compute the probability of   just `num\_successes`. Must be between num\_successes and num\_trials, both  exclusive. |

### Notes

- If any arguments does not meet its constraints, this function returns a `#NUM!` error value.
- If any argument is non-numeric, this functions returns a `#VALUE!` error value.
- Except for prob\_success, this function truncates any numerical argument to an integer.

### Examples

| A     | B                                   |                     |
| ----- | ----------------------------------- | ------------------- |
| **1** | **Function input**                  | **Function output** |
| **2** | =BINOM.DIST.RANGE(100, 0.5, 45)     | 0.04847429663       |
| **3** | =BINOM.DIST.RANGE(100, 0.5, 30, 45) | 0.1840847287        |
| **4** | =BINOM.DIST.RANGE(100, 0.5, 30)     | 0.00002317069058    |

### Related functions

- BINOM.DIST/BINOMDIST
