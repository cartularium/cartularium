---
name: CEILING.PRECISE
category: math
syntax: CEILING.PRECISE(number, [significance])
status: imported
description: The CEILING.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9061294?hl=en).

The CEILING.PRECISE function rounds a number up to the nearest integer or multiple of specified significance. If the number is positive or negative, it's rounded up.

### Syntax
```gse
CEILING.PRECISE(number, [significance])
```

| Part | Description | Notes |
| --- | --- | --- |
| `number` | The value to round up to the nearest integer or multiple of `significance`. |  |
| `significance` | The number to whose multiples `number` will be rounded. The sign of `significance` will be ignored. | [OPTIONAL: 1 by default] |

### Sample formulas

`CEILING.PRECISE(-10.5, 1)  
CEILING.PRECISE(96, 10)  
CEILING.PRECISE(-23.25, 0.1)`

### Notes

- By default, positive numbers with decimal places are rounded up to the nearest integer. For example, 4.3 is rounded up to 5.
- Negative numbers are rounded up (toward zero). For example, -4.3 is rounded up to -4.

### Examples

| A | B |
| --- | --- |
| **1** | **Formula** | **Result** |
| **2** | `=CEILING.PRECISE(-10.5, 1)` | -10 |
| **3** | `=CEILING.PRECISE(96, 10)` | 100 |
| **4** | `=CEILING.PRECISE(-23.25, 0.1)` | 23.2 |

### Related functions

- [[CEILING]]: The CEILING function rounds a number up to the nearest integer multiple of specified significance.
- [[CEILING.MATH]]: The CEILING.MATH function rounds a number up to the nearest integer or to the nearest multiple of specified significance. It also specifies whether the number is rounded toward or away from 0 depending on the mode.
- [[ROUNDUP]]: Rounds a number to a certain number of decimal places, always rounding up to the next valid increment.
- [[ROUND]]: The ROUND function rounds a number to a certain number of decimal places according to standard rules.
- [[FLOOR]]: The FLOOR function rounds a number down to the nearest integer multiple of specified significance.
- [[FLOOR.MATH]]: The FLOOR.MATH function rounds a number down to the nearest integer or a multiple of specified significance, with negative numbers rounding toward or away from zero depending on the mode.
- [[FLOOR.PRECISE]]: The FLOOR.PRECISE functions rounds a number down to the nearest integer or multiple of specified significance.