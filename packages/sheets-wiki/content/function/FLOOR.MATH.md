---
name: FLOOR.MATH
category: math
syntax: FLOOR.MATH(number, [significance], [mode])
status: imported
description: The FLOOR.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9061444?hl=en).

The FLOOR.MATH function rounds a number down to the nearest integer or a multiple of specified significance, with negative numbers rounding toward or away from zero depending on the mode.

### Syntax
```gse
FLOOR.MATH(number, [significance], [mode])
```

| Part | Description | Notes |
| --- | --- | --- |
| `number` | The value to round down to the nearest integer or if specified, the nearest multiple of `significance`. |  |
| `significance` | The number to whose multiples `number` will be rounded. The sign of `significance` will be ignored. It's 1 by default. | [OPTIONAL] |
| `mode` | If `number` is negative, specifies the rounding direction. If 0 or blank, it's rounded away from zero. Otherwise, it's rounded towards zero. | [OPTIONAL] |

### Sample formulas

`FLOOR.MATH(5.4)  
FLOOR.MATH(A2)  
FLOOR.MATH(32, 5)  
FLOOR.MATH(-26.2, 10, 1)`

### Notes

- By default, positive numbers with decimal places are rounded down to the nearest integer. For example, 4.3 is rounded down to 4.
- By default, negative numbers with decimal places are rounded away from zero to the nearest integer. For example, -4.7 is rounded down to -5.

### Examples

| A | B |
| --- | --- |
| **1** | **Formula** | **Result** |
| **2** | `=FLOOR.MATH(11.2)` | 11 |
| **3** | `=FLOOR.MATH(-8.8)` | -9 |
| **4** | `=FLOOR.MATH(7.7,0.2)` | 7.6 |
| **5** | `=FLOOR.MATH(-10.2,2)` | -12 |
| **6** | `=FLOOR.MATH(-42,10,-1)` | -40 |

### Related functions

- [[CEILING]]: The CEILING function rounds a number up to the nearest integer multiple of specified significance.
- [[ROUNDDOWN]]: The ROUNDDOWN function rounds a number to a certain number of decimal places, always rounding down to the next valid increment.
- [[ROUND]]: The ROUND function rounds a number to a certain number of decimal places according to standard rules.
- [[CEILING.MATH]]: The CEILING.MATH function rounds a number up to the nearest integer or to the nearest multiple of specified significance. It also specifies whether the number is rounded toward or away from 0 depending on the mode.
- [[FLOOR]]: The FLOOR function rounds a number down to the nearest integer multiple of specified significance.