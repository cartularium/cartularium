---
name: RRI
category: financial
syntax: RRI(number_of_periods, present_value, future_value)
status: imported
description: The RRI function returns the interest rate needed for an investment to reach a specific value within a given number of periods.
tags:
  - modified
  - undocumented
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9368238?hl=en).

The RRI function returns the interest rate needed for an investment to reach a specific value within a given number of periods.

### Syntax
```gse
RRI(number_of_periods, present_value, future_value)
```

| Part | Description |
| --- | --- |
| `number_of_periods` | Required. The number of periods. |
| `present_value` | Required. The present value of the investment |
| `future_value` | Required. The future value of the investment. |

### Notes

- All values must be positive. `Number_of_periods` and `present_value` must be greater than 0.
- If `future_value` is 0, the rate returned is -1 (-100%).

### Examples

| RRI | Formula |
| --- | --- |
| -0.1083343751 | `=RRI(10.5, 10, 3)` |
| 0.2599210499 | `=RRI(3, 2, 4)` |
| -1 | `=RRI(1, 10, 0)` |

### Related functions

- [[PDURATION]]: The PDURATION function returns the number of periods for an investment to reach a specific value at a given rate.