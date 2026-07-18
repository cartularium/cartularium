---
name: PDURATION
category: financial
syntax: PDURATION(rate, present_value, future_value)
status: imported
description: The PDURATION function returns the number of periods for an investment to reach a specific value at a given rate.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9368165?hl=en).

The PDURATION function returns the number of periods for an investment to reach a specific value at a given rate. Mathematically, `PDURATION` = (log(futureValue) - log (currentValue))/(log(1 + rate)).

### Syntax
```gse
PDURATION(rate, present_value, future_value)
```

| Part | Description |
| --- | --- |
| `rate` | Required. The rate at which the investment grows each period. |
| `present_valuepresent_value` | Required. The investment's current value. |
| `future_valuefuture_value` | Required. The investment's desired future value. |

### Notes

All values must be positive and greater than 0.

### Examples

| PDURATION | FORMULA |
| --- | --- |
| 1.817059493 | `=PDURATION(0.25, 10, 15)` |
| 3.600511394 | `=PDURATION(0.75, 2, 15)` |

### Related functions

- [[RRI]]: The RRI function returns the interest rate needed for an investment to reach a specific value within a given number of periods.