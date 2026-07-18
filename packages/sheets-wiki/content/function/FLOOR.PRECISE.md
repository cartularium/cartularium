---
name: FLOOR.PRECISE
category: math
syntax: FLOOR.PRECISE(number, [significance])
status: imported
description: The FLOOR.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9116270?hl=en).

The FLOOR.PRECISE functions rounds a number down to the nearest integer or multiple of specified significance.

### Syntax
```gse
FLOOR.PRECISE(number, [significance])
```

| Part | Description | Notes |
| --- | --- | --- |
| `number` | The value to round down to the nearest integer or multiple of significance. |  |
| `significance` | The number to whose multiple's number will be rounded. | * Optional (defaults to 1). * The sign of this value is ignored. |

### Sample formulas

```gse
FLOOR.PRECISE(-10.5, 1)
FLOOR.PRECISE(96, 10)
FLOOR.PRECISE(-23.25,0.1)
```

### Notes

- By default, positive numbers with decimal places are rounded down to the nearest integer. For example, 4.8 is rounded down to 4.
- Negative numbers are rounded down (away from zero). For example, -4.8 is rounded down to -5.

### Examples

| A | B |
| --- | --- |
| **1** | **Formula** | **Result** |
| **2** | =FLOOR.PRECISE(-10.5, 1) | -11 |
| **3** | =FLOOR.PRECISE(96, 10) | 90 |
| **4** | =FLOOR.PRECISE(-23.25, 0.1) | -23.3 |

### Related functions

- [[FLOOR]]: The FLOOR function rounds a number down to the nearest integer multiple of specified significance.
- [[FLOOR.MATH]]: The FLOOR.MATH function rounds a number down to the nearest integer or a multiple of specified significance, with negative numbers rounding toward or away from zero depending on the mode.
- [[CEILING]]: The CEILING function rounds a number up to the nearest integer multiple of specified significance.
- [[CEILING.MATH]]: The CEILING.MATH function rounds a number up to the nearest integer or to the nearest multiple of specified significance. It also specifies whether the number is rounded toward or away from 0 depending on the mode.
- [[CEILING.PRECISE]]:The CEILING.PRECISE function rounds a number up to the nearest integer or multiple of specified significance. If the number is positive or negative, it's rounded up.
- [[ROUNDDOWN]]: The ROUNDDOWN function rounds a number to a certain number of decimal places, always rounding down to the next valid increment.
- [[ROUND]]: The ROUND function rounds a number to a certain number of decimal places according to standard rules.